import { tool, zodSchema } from "ai";
import { z } from "zod";
import { webSearch as exaWebSearch } from "@exalabs/ai-sdk";
import { extract } from "@extractus/article-extractor";
import prisma from "@/lib/prisma";
import { generateQueryEmbedding } from "./embeddings";

const MAX_SEARCH_RESULTS = 10;
const MAX_SEARCH_SNIPPET_CHARS = 260;
const MAX_FETCHED_CONTENT_CHARS = 1200;

function compactText(value: string | undefined, maxLength: number) {
  if (!value) return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3)}...`
    : normalized;
}

const webSearchInputSchema = zodSchema(
  z.object({
    query: z.string().describe("The search query to look up online"),
  }),
);

type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
  source?: string;
  published?: string;
};

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
    snippet: compactText(r.highlights?.[0] ?? r.text, MAX_SEARCH_SNIPPET_CHARS),
    source: "Exa",
    published: r.publishedDate,
  }));
}

async function tryEngines(
  query: string,
  count: number,
  signal?: AbortSignal,
): Promise<{ results: WebSearchResult[]; engine: string }> {
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
        return { results, engine: name };
      }
    } catch (err) {
      errors.push(`${name}: ${(err as Error).message}`);
    }
  }

  throw new Error(`All search engines failed — ${errors.join("; ")}`);
}

import dns from "node:dns/promises";

function isPrivateIp(ip: string): boolean {
  if (ip === "localhost" || ip === "::1" || ip === "0.0.0.0") return true;
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("169.254.")) return true; // Link-local / Cloud metadata (AWS, GCP, Azure)
  if (ip.startsWith("10.")) return true; // RFC 1918 Class A
  if (ip.startsWith("192.168.")) return true; // RFC 1918 Class C
  const match172 = ip.match(/^172\.(\d+)\./);
  if (match172) {
    const secondOctet = parseInt(match172[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) return true; // RFC 1918 Class B
  }
  if (ip.toLowerCase().startsWith("fc") || ip.toLowerCase().startsWith("fd")) return true; // IPv6 ULA
  if (ip.toLowerCase().startsWith("fe80")) return true; // IPv6 link-local
  return false;
}

async function validateSafeUrl(rawUrl: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, reason: "Only HTTP and HTTPS protocols are supported." };
    }

    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".lan")
    ) {
      return { valid: false, reason: "Access to local and internal network hostnames is prohibited." };
    }

    if (isPrivateIp(hostname)) {
      return { valid: false, reason: "Access to private or internal IP addresses is prohibited." };
    }

    try {
      const records = await dns.lookup(hostname, { all: true });
      for (const record of records) {
        if (isPrivateIp(record.address)) {
          return {
            valid: false,
            reason: `Target address resolves to a restricted private address (${record.address}).`,
          };
        }
      }
    } catch {
      // If DNS resolution fails, allow fetch to handle or fail naturally
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: "Invalid URL format." };
  }
}

const fetchUrlInputSchema = zodSchema(
  z.object({
    url: z.string().url().describe("The URL to fetch and extract content from"),
  }),
);

export const fetchUrlTool = tool({
  description:
    "Fetch and extract the main content (title, text, author, etc.) from a given URL. Use this when the user provides a link they want you to read or analyze.",
  inputSchema: fetchUrlInputSchema,
  execute: async ({ url }) => {
    const validation = await validateSafeUrl(url);
    if (!validation.valid) {
      return {
        title: "",
        description: "",
        content: `Blocked for security: ${validation.reason}`,
        author: "",
        published: "",
        source: url,
        url,
      };
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out after 10 seconds")), 10000);
      });

      const article = await Promise.race([
        extract(url, undefined, { signal: AbortSignal.timeout(10000) } as unknown as Parameters<typeof extract>[2]),
        timeoutPromise,
      ]);

      if (!article) {
        return {
          title: "",
          description: "",
          content:
            "Failed to extract content. The site might be blocking scrapers or paywalled.",
          author: "",
          published: "",
          source: url,
          url,
        };
      }

      return {
        title: article.title || "",
        description: article.description || "",
        content: article.content
          ? compactText(
              article.content.replace(/<[^>]*>/g, ""),
              MAX_FETCHED_CONTENT_CHARS,
            )
          : "",
        author: Array.isArray(article.author)
          ? article.author.join(", ")
          : article.author || "",
        published: article.published || "",
        source: article.source || url,
        url: article.url || url,
      };
    } catch (err) {
      return {
        title: "",
        description: "",
        content: `Failed to fetch URL: ${(err as Error).message}. The site might be blocking access (e.g., 401/403) or timed out. Try relying on search results instead.`,
        author: "",
        published: "",
        source: url,
        url,
      };
    }
  },
});

export const webSearchTool = tool({
  description:
    "Search the web for current information, news, and data. Use this when the user asks about recent events, facts you are not confident about, or any topic that may have changed since your training data.",
  inputSchema: webSearchInputSchema,
  execute: async ({ query }, { abortSignal }) => {
    const safeCount = MAX_SEARCH_RESULTS;
    const { results, engine } = await tryEngines(query, safeCount, abortSignal);

    return {
      engine,
      results: results.map((r) => ({
        title: compactText(r.title, 140),
        url: r.url,
        snippet: compactText(r.snippet, MAX_SEARCH_SNIPPET_CHARS),
        source: r.source,
        published: r.published,
      })),
    };
  },
});

export const searchArticlesTool = tool({
  description:
    "Search the platform's internal database of indexed global news articles for relevant news matching a query. Use this tool first before checking the external web search if the user is asking about tracked/platform articles.",
  inputSchema: zodSchema(
    z.object({
      query: z.string().describe("The search query to look up in the database"),
    }),
  ),
  execute: async ({ query }) => {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        return {
          success: true,
          results: [],
          message: "The search query was empty. Please provide a valid search term.",
        };
      }

      // Check if the ProcessedArticle table has any records at all
      const dbArticleCountResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM "ProcessedArticle";
      `;
      const totalArticles = Number(dbArticleCountResult[0]?.count || BigInt(0));
      if (totalArticles === 0) {
        return {
          success: true,
          results: [],
          message: "The database currently contains no articles. The ingestion pipeline has not been run yet.",
        };
      }

      // Check if there are any embeddings in the database to prevent silent degradation (empty database)
      const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM "ProcessedArticle" WHERE embedding IS NOT NULL;
      `;
      const totalCount = Number(countResult[0]?.count || BigInt(0));
      if (totalCount === 0) {
        return {
          success: true,
          results: [],
          message: "Geopolitical articles are present in the database, but none of them have generated vector embeddings yet. Ingestion service needs to enrich them first.",
        };
      }

      const queryEmbedding = await generateQueryEmbedding(trimmedQuery);
      const vectorStr = `[${queryEmbedding.join(",")}]`;

      const results = await prisma.$queryRaw<unknown[]>`
        SELECT 
          p.id, 
          r.title, 
          r.url, 
          r.source, 
          r."contentSnippet", 
          p."biasNote", 
          p."sentimentScore", 
          r."publishedAt",
          (p.embedding <=> ${vectorStr}::vector) AS distance
        FROM "ProcessedArticle" p
        JOIN "RawArticle" r ON p."rawArticleId" = r.id
        WHERE p.embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT 10;
      `;

      // Runtime validation schema for raw query results
      const rawArticleQueryResultSchema = z.object({
        id: z.string(),
        title: z.string(),
        url: z.string(),
        source: z.string(),
        contentSnippet: z.string(),
        biasNote: z.string().nullable(),
        sentimentScore: z.number().nullable(),
        publishedAt: z.union([z.date(), z.string()]).transform((val) => new Date(val)),
        distance: z.number(),
      });

      const parsedResults = z.array(rawArticleQueryResultSchema).safeParse(results);
      if (!parsedResults.success) {
        console.error("❌ Database query results did not match the expected schema:", parsedResults.error);
        return {
          success: false,
          error: "Database schema mismatch during article retrieval.",
        };
      }

      const formatted = parsedResults.data.map((r) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        source: r.source,
        snippet: compactText(r.contentSnippet, 300),
        biasNote: r.biasNote,
        sentimentScore: r.sentimentScore,
        publishedAt: r.publishedAt.toISOString(),
        score: (1 - r.distance).toFixed(4),
      }));

      return {
        success: true,
        results: formatted,
      };
    } catch (error) {
      console.error("❌ Failed to search internal database articles:", error);
      return {
        success: false,
        error: "Failed to search internal database.",
      };
    }
  },
});
