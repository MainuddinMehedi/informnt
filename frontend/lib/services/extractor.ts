import { extract } from "@extractus/article-extractor";
import { compactText } from "@/utils/formatters";
import { validateSafeUrl } from "@/lib/security/ssrf";

export const MAX_FETCHED_CONTENT_CHARS = 1200;

export interface ExtractedArticleResult {
  title: string;
  description: string;
  content: string;
  author: string;
  published: string;
  source: string;
  url: string;
  error?: string;
}

/**
 * Safely extracts the main readable content and metadata from a web page URL.
 * Automatically validates against private/internal SSRF targets and enforces a 10s timeout.
 */
export async function extractUrlContent(
  url: string,
): Promise<ExtractedArticleResult> {
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
      error: validation.reason,
    };
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Request timed out after 10 seconds")),
        10000,
      );
    });

    const article = await Promise.race([
      extract(url, undefined, {
        signal: AbortSignal.timeout(10000),
      } as unknown as Parameters<typeof extract>[2]),
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
        error: "Extractor returned empty content.",
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
    const message = (err as Error).message;
    return {
      title: "",
      description: "",
      content: `Failed to fetch URL: ${message}. The site might be blocking access (e.g., 401/403) or timed out. Try relying on search results instead.`,
      author: "",
      published: "",
      source: url,
      url,
      error: message,
    };
  }
}
