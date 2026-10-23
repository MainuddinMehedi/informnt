import { getToolName, isToolUIPart, type UIMessage } from "ai";

export type SourceItemType =
  | "source-url"
  | "source-document"
  | "source-unknown";

export type SourceItem = {
  label: string;
  value: string;
  type: SourceItemType;
  snippet?: string;
  published?: string;
  source?: string;
  sourceId?: string;
  mediaType?: string;
  engine?: string;
  toolName?: string;
};

// ============================================================================
// Built-in Vercel AI SDK Part Handlers
// ============================================================================

export function isSourceResourcePart(part: UIMessage["parts"][number]): part is
  | { type: "source-url"; url: string; title?: string; sourceId: string }
  | {
      type: "source-document";
      sourceId: string;
      mediaType: string;
      title: string;
      filename?: string;
    } {
  return part.type === "source-url" || part.type === "source-document";
}

export function formatResourcePart(
  part: UIMessage["parts"][number],
): SourceItem {
  if (part.type === "source-url") {
    return {
      label: part.title || part.url,
      value: part.url,
      type: "source-url",
      sourceId: part.sourceId,
    };
  }

  if (part.type === "source-document") {
    return {
      label: part.title,
      value: part.filename ?? part.sourceId,
      type: "source-document",
      mediaType: part.mediaType,
      sourceId: part.sourceId,
    };
  }

  return {
    label: "Resource",
    value: "",
    type: "source-unknown",
  };
}

// ============================================================================
// Dedicated Tool Output Mappers
// ============================================================================

function mapWebSearchSources(output: Record<string, unknown>): SourceItem[] {
  const results = Array.isArray(output.results) ? output.results : [];
  const engine = typeof output.engine === "string" ? output.engine : undefined;
  const items: SourceItem[] = [];

  for (const r of results) {
    if (!r || typeof r !== "object") continue;
    const res = r as {
      url?: string;
      title?: string;
      snippet?: string;
      source?: string;
      published?: string;
    };
    if (!res.url) continue;

    items.push({
      label: res.title || res.url,
      value: res.url,
      type: "source-url",
      snippet: res.snippet,
      published: res.published,
      source: res.source,
      engine,
      toolName: "web_search",
    });
  }

  return items;
}

function mapArticleSources(output: Record<string, unknown>): SourceItem[] {
  const results = Array.isArray(output.results) ? output.results : [];
  const items: SourceItem[] = [];

  for (const r of results) {
    if (!r || typeof r !== "object") continue;
    const res = r as {
      url?: string;
      title?: string;
      snippet?: string;
      source?: string;
      published?: string;
    };
    if (!res.url) continue;

    items.push({
      label: res.title || res.url,
      value: res.url,
      type: "source-url",
      snippet: res.snippet,
      published: res.published,
      source: res.source,
      toolName: "search_articles",
    });
  }

  return items;
}

function mapFetchUrlSources(output: Record<string, unknown>): SourceItem[] {
  const url = typeof output.url === "string" ? output.url : undefined;
  if (!url || output.error) return [];

  const title = typeof output.title === "string" ? output.title : undefined;
  const description =
    typeof output.description === "string"
      ? output.description
      : typeof output.content === "string"
        ? output.content
        : undefined;
  const published =
    typeof output.published === "string" ? output.published : undefined;
  const source = typeof output.source === "string" ? output.source : undefined;

  return [
    {
      label: title || url,
      value: url,
      type: "source-url",
      snippet: description,
      published,
      source,
      toolName: "fetch_url",
    },
  ];
}

function mapStoryDetailSources(output: Record<string, unknown>): SourceItem[] {
  const story = output.story;
  if (!story || typeof story !== "object") return [];

  const s = story as {
    slug?: string;
    title?: string;
    summary?: string;
    url?: string;
  };
  const storyUrl = s.url || (s.slug ? `/stories/${s.slug}` : "");
  if (!storyUrl) return [];

  return [
    {
      label: s.title || "Tracked Story",
      value: storyUrl,
      type: "source-url",
      snippet: s.summary,
      source: "Tracked Story",
      toolName: "get_story_details",
    },
  ];
}

// ============================================================================
// Main Tool Citation Extractor
// ============================================================================

/**
 * Extracts cited sources from tool outputs in a message.
 * Uses dedicated tool mappers and prunes superseded exploratory searches.
 */
export function extractToolResources(parts: UIMessage["parts"]): SourceItem[] {
  const items: SourceItem[] = [];

  // Determine if a web search succeeded in this turn
  const hasSuccessfulWebSearch = parts.some((part) => {
    if (!isToolUIPart(part)) return false;
    if (getToolName(part) !== "web_search") return false;
    const tp = part as { state: string; output?: { results?: unknown[] } };
    return (
      tp.state === "output-available" &&
      Array.isArray(tp.output?.results) &&
      tp.output.results.length > 0
    );
  });

  for (const part of parts) {
    if (!isToolUIPart(part)) continue;

    const toolName = getToolName(part);
    const tp = part as {
      state: string;
      output?: unknown;
    };

    if (
      tp.state !== "output-available" ||
      !tp.output ||
      typeof tp.output !== "object"
    ) {
      continue;
    }

    const output = tp.output as Record<string, unknown>;

    switch (toolName) {
      case "web_search":
        items.push(...mapWebSearchSources(output));
        break;

      case "search_articles":
        // If web_search succeeded, omit superseded internal search candidates
        if (!hasSuccessfulWebSearch) {
          items.push(...mapArticleSources(output));
        }
        break;

      case "fetch_url":
        items.push(...mapFetchUrlSources(output));
        break;

      case "get_story_details":
        items.push(...mapStoryDetailSources(output));
        break;

      case "search_stories":
        // Lightweight metadata pass only — full citations come from get_story_details
        break;

      default:
        break;
    }
  }

  return items;
}

/**
 * Deduplicates sources by normalized URL.
 */
export function dedupeSources(sources: SourceItem[]): SourceItem[] {
  const seen = new Set<string>();

  return sources.filter((source) => {
    if (!source.value) return false;
    const key = source.value.replace(/\/$/, "");

    if (seen.has(key)) return false;
    seen.add(key);

    return true;
  });
}
