import { getToolName, type UIMessage } from "ai";

export function getToolQuery(input?: Record<string, unknown>): string {
  const v = input?.query ?? input?.slugOrId ?? input?.url;
  return typeof v === "string" ? v.trim() : "";
}

export function toolRunningLabel(toolName: string, query: string): string {
  if (toolName === "web_search") {
    return query ? `Searching web for: "${query}"...` : "Searching web...";
  }
  if (toolName === "search_articles") {
    return query
      ? `Searching news archive for: "${query}"...`
      : "Searching news archive...";
  }
  if (toolName === "search_stories") {
    return query
      ? `Searching tracked stories for: "${query}"...`
      : "Searching tracked stories...";
  }
  if (toolName === "get_story_details") {
    return query
      ? `Loading story details: "${query}"...`
      : "Loading story details...";
  }
  return "Searching sources...";
}

export function getHeaderLabel(doneTools: UIMessage["parts"]): string {
  const names = new Set(
    doneTools.map((p) => getToolName(p as Parameters<typeof getToolName>[0])),
  );
  const hasArchive =
    names.has("search_articles") ||
    names.has("search_stories") ||
    names.has("get_story_details");
  const hasWeb = names.has("web_search") || names.has("fetch_url");

  if (hasArchive && hasWeb) return "Searched archive & web";
  if (hasArchive) return "Searched archive";
  if (hasWeb) return "Searched web";

  return "Searched sources";
}

export function isZeroResults(output?: Record<string, unknown>): boolean {
  if (!output) return false;
  if (typeof output.count === "number") return output.count === 0;
  if (Array.isArray(output.results)) return output.results.length === 0;
  if (Array.isArray(output.stories)) return output.stories.length === 0;
  return false;
}
