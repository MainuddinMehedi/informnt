import { convertToModelMessages, isToolUIPart, type UIMessage } from "ai";

export function getMessageText(
  message: Partial<UIMessage> & { content?: string | unknown[] },
): string {
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .map((part) => {
        if (part.type === "text") return part.text || "";
        // If it's a reasoning part, we might want to include it IF it's the only thing there
        // but for synthesis we really want the text part.
        return "";
      })
      .join("\n")
      .trim();
  }

  if (typeof message.content === "string") {
    return message.content.trim();
  }

  // AI SDK Core Message content can be an array of parts
  if (Array.isArray(message.content)) {
    return (message.content as Array<unknown>)
      .map((part) => {
        if (
          typeof part === "object" &&
          part !== null &&
          "type" in part &&
          (part as Record<string, unknown>).type === "text"
        ) {
          return String((part as Record<string, unknown>).text || "");
        }

        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

export function createSessionTitle(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "New Chat";

  return normalized.length > 64 ? `${normalized.slice(0, 61)}...` : normalized;
}

export function normalizeMarkdownText(text: string) {
  return text.replace(/<br\s*\/?>/gi, "\n");
}

export function hasRenderableMessageContent(
  message: UIMessage,
  isLastAndLoading: boolean,
) {
  if (message.role !== "assistant") return true;
  if (isLastAndLoading) return true;

  return (message.parts ?? []).some((part) => {
    if (part.type === "text") return Boolean(part.text?.trim());
    if (part.type === "reasoning") return Boolean(part.text?.trim());
    if (!isToolUIPart(part)) return false;

    return (
      (part as { state?: string }).state === "output-error" ||
      (part as { state?: string }).state === "output-available"
    );
  });
}

export function areMessagePartsEqual(
  prevParts: UIMessage["parts"],
  nextParts: UIMessage["parts"],
) {
  if (prevParts === nextParts) return true;
  if (prevParts.length !== nextParts.length) return false;

  return prevParts.every((part, index) => {
    const next = nextParts[index];

    if (part.type !== next.type) return false;

    if ("text" in part && "text" in next) {
      return (
        (part as { text?: string }).text === (next as { text?: string }).text
      );
    }

    if ("state" in part && "state" in next) {
      return (
        (part as { state?: string }).state ===
        (next as { state?: string }).state
      );
    }

    return part === next;
  });
}

export function estimateRequestSize(
  systemPrompt: string,
  coreMessages: Array<{ role: string; content: unknown }>,
) {
  return Buffer.byteLength(
    JSON.stringify({
      system: systemPrompt,
      messages: coreMessages.map((msg) => ({
        role: msg.role,
        content:
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content),
      })),
    }),
    "utf8",
  );
}

export async function prepareCoreMessages(
  messages: Array<{
    id?: string;
    role: string;
    parts?: Array<{ type: string; text?: string }>;
    metadata?: unknown;
  }>,
  maxTurns: number,
) {
  // 1. Strip fake error messages and empty assistant non-tool turns
  const cleanMessages = messages.filter((msg) => {
    if (msg.id?.startsWith("error-")) return false;
    if (
      msg.metadata &&
      typeof msg.metadata === "object" &&
      (msg.metadata as Record<string, unknown>).error
    ) {
      return false;
    }

    const hasToolCalls = msg.parts?.some(
      (p) => p.type === "tool-invocation" || p.type.startsWith("tool-"),
    );

    if (
      msg.role === "assistant" &&
      !getMessageText(msg as unknown as UIMessage).trim() &&
      !hasToolCalls
    ) {
      return false;
    }
    return true;
  });

  // 2. Turn-based windowing: keep only the last maxTurns complete user turns
  // This preserves tool-call -> tool-result -> assistant-response sequences
  const userIndices: number[] = [];
  cleanMessages.forEach((msg, idx) => {
    if (msg.role === "user") {
      userIndices.push(idx);
    }
  });

  let trimmedMessages = cleanMessages;
  if (userIndices.length > maxTurns) {
    const startIndex = userIndices[userIndices.length - maxTurns];
    trimmedMessages = cleanMessages.slice(startIndex);
  }

  // 3. Convert to Model Messages
  const coreMessages = await convertToModelMessages(
    trimmedMessages as UIMessage[],
  );

  // 4. Ensure conversation history sent to provider starts with a user message
  while (coreMessages.length > 0 && coreMessages[0].role !== "user") {
    coreMessages.shift();
  }

  return coreMessages;
}
