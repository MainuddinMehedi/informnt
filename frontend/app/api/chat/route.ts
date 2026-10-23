import {
  streamText,
  stepCountIs,
  smoothStream,
  wrapLanguageModel,
  extractReasoningMiddleware,
  type UIMessage,
} from "ai";
import { auth } from "@/auth";
import {
  createSessionTitle,
  getMessageText,
  prepareCoreMessages,
  estimateRequestSize,
} from "@/lib/chat/messages";
import type { ContextItem } from "@/types/chat";
import { getModel, DEFAULT_USER_MODEL, DEFAULT_GUEST_MODEL, GUEST_ALLOWED_MODELS } from "@/lib/ai/modelRegistry";
import { createProviderClient } from "@/lib/ai/providers";
import {
  webSearchTool,
  fetchUrlTool,
  searchArticlesTool,
} from "@/lib/ai/tools";
import { z } from "zod";
import {
  createChatSession,
  updateChatSession,
  upsertChatMessage,
  saveChatContexts,
  assertSessionAccess,
} from "@/lib/chat/db";
import { buildChatSystemPrompt } from "@/lib/chat/prompts";
import { formatStreamError } from "@/lib/chat/errors";
import { checkAndHandleGuestLimits } from "@/lib/chat/guestLimits";
import { buildProviderOptions } from "@/lib/chat/providers";
import { handleStreamFinish } from "@/lib/chat/streamHandlers";

export const maxDuration = 120;

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string().optional(),
        role: z.string(),
        parts: z.array(z.record(z.string(), z.unknown())).optional(),
        content: z.union([z.string(), z.array(z.unknown())]).optional(),
        metadata: z.unknown().optional(),
      }),
    )
    .min(1, "At least one message is required")
    .max(100, "Too many messages in conversation history"),
  contexts: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().max(500),
        type: z.string().max(50),
        url: z.string().max(2048).optional(),
        sourceId: z.string().optional(),
        sourceType: z.string().optional(),
        snapshot: z.unknown().optional(),
      }),
    )
    .max(30, "Too many context items")
    .optional(),
  model: z.string().max(100).optional(),
  adaptiveThinking: z.boolean().optional(),
  sessionId: z.string().uuid("Invalid session ID format").optional(),
  responseMode: z.enum(["concise", "descriptive"]).optional(),
});

export async function POST(req: Request) {
  try {
    const rawJson = await req.json().catch(() => null);
    if (!rawJson) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const parseResult = chatRequestSchema.safeParse(rawJson);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error:
            parseResult.error.issues[0]?.message || "Invalid request body",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const {
      messages,
      contexts,
      model = DEFAULT_USER_MODEL,
      adaptiveThinking = false,
      sessionId,
      responseMode = "concise",
    } = parseResult.data;

    const latestUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === "user");
    const latestUserText = latestUserMessage
      ? getMessageText(latestUserMessage as unknown as UIMessage)
      : "";

    const authSession = await auth();
    const isGuest = !authSession?.user?.id;
    const userId = authSession?.user?.id || null;

    let effectiveModel = model;
    if (isGuest && !GUEST_ALLOWED_MODELS.includes(model)) {
      effectiveModel = DEFAULT_GUEST_MODEL;
    }

    // 1. Model Validation (fail early before any database mutations)
    const modelConfig = getModel(effectiveModel);
    if (!modelConfig) {
      return new Response(
        JSON.stringify({ error: `Model ${effectiveModel} is not supported.` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // 2. Session Setup & Access Verification
    let activeSessionId = sessionId;
    if (activeSessionId) {
      const access = await assertSessionAccess(activeSessionId, userId);
      if (!access.allowed) {
        if (access.reason === "forbidden") {
          return new Response(
            JSON.stringify({
              error: "Forbidden: You do not have access to this chat session.",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({ error: "Chat session not found or archived." }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      await updateChatSession(activeSessionId, {
        model: effectiveModel,
        responseMode,
      });
    } else {
      const session = await createChatSession({
        title: createSessionTitle(latestUserText),
        model: effectiveModel,
        responseMode,
        userId,
      });

      activeSessionId = session.id;
    }

    // 3. Guest Limits Check
    const guestLimitResponse = await checkAndHandleGuestLimits({
      isGuest,
      messages,
      activeSessionId,
    });
    if (guestLimitResponse) return guestLimitResponse;

    if (contexts?.length) {
      await saveChatContexts(activeSessionId, contexts as ContextItem[]);
    }

    if (latestUserMessage && activeSessionId) {
      const userMessageId =
        latestUserMessage.id || `user-${Date.now().toString(36)}`;

      await upsertChatMessage({
        id: userMessageId,
        sessionId: activeSessionId,
        role: "user",
        text: latestUserText,
        parts: latestUserMessage.parts || [
          { type: "text", text: latestUserText },
        ],
        metadata: latestUserMessage.metadata,
      });
    }

    // 4. System Prompt & Model Config
    const todayDateStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const systemPrompt = buildChatSystemPrompt({
      responseMode,
      contexts: contexts as unknown as Parameters<typeof buildChatSystemPrompt>[0]["contexts"],
      todayDateStr,
    });

    // 4. Initialize Provider Client
    const provider = createProviderClient(modelConfig.provider);
    const aiModel = provider.chat(
      modelConfig.provider === "github"
        ? effectiveModel.slice("github:".length)
        : effectiveModel,
    );

    const effectiveModelInstance =
      effectiveModel.includes("deepseek") &&
      effectiveModel.toLowerCase().includes("r1")
        ? wrapLanguageModel({
            model: aiModel,
            middleware: extractReasoningMiddleware({ tagName: "think" }),
          })
        : aiModel;

    const hasImageParts = messages.some((msg) =>
      msg.parts?.some((p) => p.type === "file"),
    );

    if (hasImageParts && !modelConfig.capabilities.supportsImages) {
      return new Response(
        JSON.stringify({
          error: `The selected model ${modelConfig.label} does not support image input. Please switch to a supported model or remove images.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // 5. Message Preparation
    const MAX_TURNS =
      modelConfig.provider === "groq"
        ? 4
        : modelConfig.contextWindow > 32000
          ? 16
          : 8;
    const coreMessages = await prepareCoreMessages(
      messages as unknown as Parameters<typeof prepareCoreMessages>[0],
      MAX_TURNS,
    );
    const requestSize = estimateRequestSize(
      systemPrompt,
      coreMessages as unknown as Parameters<typeof estimateRequestSize>[1],
    );

    console.log("DEBUG: Sending to streamText", {
      model,
      msgCount: coreMessages.length,
      requestSize,
      adaptiveThinking,
    });

    // 6. Tools & Provider Options
    const tools = modelConfig.capabilities.supportsTools
      ? {
          web_search: webSearchTool,
          fetch_url: fetchUrlTool,
          search_articles: searchArticlesTool,
        }
      : undefined;

    const providerOptions = buildProviderOptions({
      adaptiveThinking,
      effectiveModel,
      modelProvider: modelConfig.provider,
      responseMode,
    });

    // 7. Execute AI Stream
    const result = streamText({
      model: effectiveModelInstance,
      system: systemPrompt,
      messages: coreMessages,
      tools,
      maxOutputTokens: adaptiveThinking ? 16384 : 4096,
      experimental_transform: [
        smoothStream({ chunking: "word", delayInMs: 20 }),
      ],
      temperature: modelConfig.provider === "groq" ? 0 : undefined,
      stopWhen: stepCountIs(modelConfig.provider === "groq" ? 6 : 10),
      providerOptions,
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages as UIMessage[],
      messageMetadata: () => ({
        model: effectiveModel,
        sessionId: activeSessionId,
      }),
      sendSources: true,
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
      onError: (error) => {
        console.error(
          "Chat stream error details:",
          JSON.stringify(error, null, 2),
        );
        return formatStreamError(error);
      },
      onFinish: async ({ responseMessage, isAborted }) => {
        await handleStreamFinish({
          responseMessage: responseMessage as unknown as UIMessage,
          isAborted,
          activeSessionId,
          effectiveModel,
          responseMode,
          latestUserText,
        });
      },
    });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    const message = formatStreamError(error);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
