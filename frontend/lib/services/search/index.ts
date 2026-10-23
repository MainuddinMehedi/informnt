import { webSearch as exaWebSearch } from "@exalabs/ai-sdk";
import { compactText } from "@/lib/helpers/string";
import type { WebSearchResult, WebSearchResponse } from "./types";

export const MAX_SEARCH_RESULTS = 10;
export const MAX_SEARCH_SNIPPET_CHARS = 260;

async function braveSearch(
  query: string,
  count: number,
  signal?: AbortSignal,
): Promise<WebSearchResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) throw new Error("BRAVE_API_KEY not configured");

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(count));

  const res = await fetch(url.toString(), {
    headers: { "X-Subscription-Token": apiKey, Accept: "application/json" },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Brave search failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    web?: {
      results?: Array<{ title: string; url: string; description: string }>;
    };
  };

  return (data.web?.results ?? []).slice(0, count).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.description,
    source: "Brave Search",
  }));
}

async function tavilySearch(
  query: string,
  count: number,
  signal?: AbortSignal,
): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY not configured");

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, query, max_results: count }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Tavily search failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    results?: Array<{ title: string; url: string; content: string }>;
  };

  return (data.results ?? []).slice(0, count).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
    source: "Tavily",
  }));
}

async function exaSearch(
  query: string,
  count: number,
  signal?: AbortSignal,
): Promise<WebSearchResult[]> {
  const exaTool = exaWebSearch({
    numResults: count,
    type: "auto",
    category: "news",
    contents: {
      text: { maxCharacters: MAX_SEARCH_SNIPPET_CHARS },
      highlights: true,
    },
  });
  const exaExecute = (exaTool as { execute: (...args: unknown[]) => unknown })
    .execute;
  const data = (await exaExecute({ query }, { abortSignal: signal })) as {
    results?: Array<{
      title: string;
      url: string;
      text?: string;
      highlights?: string[];
      publishedDate?: string;
    }>;
  };

  return (data.results ?? []).slice(0, count).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: compactText(
      r.highlights?.[0] ?? r.text,
      MAX_SEARCH_SNIPPET_CHARS,
    ),
    source: "Exa",
    published: r.publishedDate,
  }));
}

/**
 * Executes a resilient multi-engine web search with automatic fallback (Brave -> Tavily -> Exa).
 */
export async function executeWebSearch(
  query: string,
  count: number = MAX_SEARCH_RESULTS,
  signal?: AbortSignal,
): Promise<WebSearchResponse> {
  const engines = [
    { name: "Brave", fn: braveSearch },
    { name: "Tavily", fn: tavilySearch },
    { name: "Exa", fn: exaSearch },
  ] as const;

  const errors: string[] = [];
  for (const { name, fn } of engines) {
    try {
      const results = await fn(query, count, signal);
      if (results.length > 0) {
        return {
          engine: name,
          results: results.map((r) => ({
            title: compactText(r.title, 140),
            url: r.url,
            snippet: compactText(r.snippet, MAX_SEARCH_SNIPPET_CHARS),
            source: r.source,
            published: r.published,
          })),
        };
      }
    } catch (err) {
      errors.push(`${name}: ${(err as Error).message}`);
    }
  }

  throw new Error(`All search engines failed — ${errors.join("; ")}`);
}

export * from "./types";
