import { generateQueryEmbedding } from "@/lib/ai/embeddings";
import { compactText } from "@/utils/formatters";
import prisma from "@/lib/prisma";
import { z } from "zod";

export interface SemanticArticleResult {
  id: string;
  title: string;
  url: string;
  source: string;
  snippet: string;
  biasNote: string | null;
  sentimentScore: number | null;
  published: string;
  publishedAt: string;
  score: string;
}

const rawArticleQueryResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  source: z.string(),
  contentSnippet: z.string(),
  biasNote: z.string().nullable(),
  sentimentScore: z.number().nullable(),
  publishedAt: z
    .union([z.date(), z.string()])
    .transform((val) => new Date(val)),
  distance: z.number(),
});

/**
 * Searches the ProcessedArticle archive using cosine vector distance embeddings.
 * Prunes noise with a distance threshold < 0.65 (cosine similarity > 0.35).
 */
export async function searchArticlesSemantic(
  query: string,
  limit: number = 10,
): Promise<{
  success: boolean;
  results: SemanticArticleResult[];
  error?: string;
}> {
  try {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return {
        success: true,
        results: [],
      };
    }

    const queryEmbedding = await generateQueryEmbedding(trimmedQuery);
    const vectorStr = `[${queryEmbedding.join(",")}]`;

    const rawResults = await prisma.$queryRaw<unknown[]>`
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
      LIMIT ${limit};
    `;

    const parsedResults = z
      .array(rawArticleQueryResultSchema)
      .safeParse(rawResults);

    if (!parsedResults.success) {
      console.error(
        "❌ Database query results did not match expected schema:",
        parsedResults.error,
      );
      return {
        success: false,
        results: [],
        error: "Database schema mismatch during article retrieval.",
      };
    }

    // Filter by cosine distance threshold (< 0.48 corresponds to cosine similarity > 0.52)
    // to prune ambient noise matches when a topic or entity does not exist in the archive.
    const relevant = parsedResults.data.filter((r) => r.distance < 0.48);

    return {
      success: true,
      results: relevant.map((r) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        source: r.source,
        snippet: compactText(r.contentSnippet, 300),
        biasNote: r.biasNote,
        sentimentScore: r.sentimentScore,
        published: r.publishedAt.toISOString(),
        publishedAt: r.publishedAt.toISOString(),
        score: (1 - r.distance).toFixed(4),
      })),
    };
  } catch (error) {
    console.error("❌ Failed to execute semantic article search:", error);
    return {
      success: false,
      results: [],
      error: "Failed to search internal database.",
    };
  }
}
