export function buildProviderOptions({
  adaptiveThinking,
  effectiveModel,
  modelProvider,
  responseMode,
}: {
  adaptiveThinking: boolean;
  effectiveModel: string;
  modelProvider: string;
  responseMode: "concise" | "descriptive";
}) {
  const openaiOptions: Record<string, unknown> = {};

  if (modelProvider === "groq") {
    openaiOptions.parallelToolCalls = false;
  }

  if (adaptiveThinking && effectiveModel.startsWith("openai/gpt-oss")) {
    openaiOptions.reasoningEffort =
      responseMode === "concise" ? "low" : "medium";
  }

  return {
    ...(Object.keys(openaiOptions).length > 0 ? { openai: openaiOptions } : {}),
    ...(adaptiveThinking && modelProvider === "google"
      ? {
          google: {
            thinkingConfig: {
              thinkingBudget: responseMode === "concise" ? 2048 : 4096,
            },
          },
        }
      : {}),
  };
}
