import { getToolName, isToolUIPart, type UIMessage } from "ai";
import type { ContextItem } from "@/types/chat";

export type SourceItemType =
  | "source-url"
  | "source-document"
  | "source-unknown";

export type SourceItem = {
  index?: number;
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
  id?: string;
  internalUrl?: string;
  isPlatformItem?: boolean;
  contextItem?: ContextItem;
};

export function isPlatformResource(resource: SourceItem): boolean {
  if (resource.isPlatformItem) return true;
  if (resource.internalUrl) return true;
  if (resource.value?.startsWith("/")) return true;
  return false;
}

export function getResourceContextItem(
  resource: SourceItem,
): ContextItem | null {
  if (resource.contextItem) return resource.contextItem;

  const urlToCheck = resource.internalUrl || resource.value;
  if (!urlToCheck) return null;

  if (urlToCheck.startsWith("/stories/")) {
    const slug = urlToCheck.replace("/stories/", "").split(/[?#]/)[0];
    return {
      id: slug,
      title: resource.label,
      type: "story",
      url: urlToCheck,
    };
  }

  if (urlToCheck.startsWith("/article/")) {
    const id = urlToCheck.replace("/article/", "").split(/[?#]/)[0];
    return {
      id,
      title: resource.label,
      type: "article",
      url: urlToCheck,
    };
  }

  return null;
}

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
      id?: string;
      url?: string;
      title?: string;
      snippet?: string;
      source?: string;
      published?: string;
      publishedAt?: string;
    };
    if (!res.url && !res.id) continue;

    const value = res.url || (res.id ? `/article/${res.id}` : "");
    const internalUrl = res.id ? `/article/${res.id}` : undefined;

    items.push({
      id: res.id,
      label: res.title || res.url || "Internal Article",
      value,
      type: "source-url",
      snippet: res.snippet,
      published: res.published || res.publishedAt,
      source: res.source,
      toolName: "search_articles",
      internalUrl,
      isPlatformItem: true,
      contextItem: res.id
        ? {
            id: res.id,
            title: res.title || "Article",
            type: "article",
            url: res.url,
          }
        : undefined,
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
    articles?: Array<{
      id?: string;
      title?: string;
      url?: string;
      source?: string;
      published?: string;
      publishedAt?: string;
    }>;
  };
  const storyUrl = s.url || (s.slug ? `/stories/${s.slug}` : "");
  const items: SourceItem[] = [];

  if (storyUrl) {
    items.push({
      id: s.slug,
      label: s.title || "Tracked Story",
      value: storyUrl,
      type: "source-url",
      snippet: s.summary,
      source: "informnt Story Cluster",
      toolName: "get_story_details",
      internalUrl: s.slug ? `/stories/${s.slug}` : storyUrl,
      isPlatformItem: true,
      contextItem: s.slug
        ? {
            id: s.slug,
            title: s.title || "Story Cluster",
            type: "story",
            url: storyUrl,
          }
        : undefined,
    });
  }

  if (Array.isArray(s.articles)) {
    for (const art of s.articles) {
      if (!art || typeof art !== "object" || !art.url) continue;
      const internalUrl = art.id ? `/article/${art.id}` : undefined;
      items.push({
        id: art.id,
        label: art.title || art.url,
        value: art.url,
        type: "source-url",
        source: art.source,
        published: art.published || art.publishedAt,
        toolName: "get_story_details",
        internalUrl,
        isPlatformItem: !!art.id,
        contextItem: art.id
          ? {
              id: art.id,
              title: art.title || "Article",
              type: "article",
              url: art.url,
            }
          : undefined,
      });
    }
  }

  return items;
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
 * Deduplicates sources by normalized URL and assigns sequential 1-based indices.
 */
export function dedupeSources(sources: SourceItem[]): SourceItem[] {
  const seen = new Set<string>();
  const result: SourceItem[] = [];

  for (const source of sources) {
    if (!source.value) continue;
    const key = source.value.replace(/\/$/, "");

    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      ...source,
      index: result.length + 1,
    });
  }

  return result;
}

/**
 * Returns all unique, numbered sources present in a message (from parts and tool outputs).
 */
export function getMessageSources(parts: UIMessage["parts"]): SourceItem[] {
  const partResources = parts.filter(isSourceResourcePart).map(formatResourcePart);
  const toolResources = extractToolResources(parts);
  return dedupeSources([...partResources, ...toolResources]);
}
