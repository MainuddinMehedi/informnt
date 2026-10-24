import { Article } from "@/types/article";
import { getPublisherRegion } from "@/utils/regions";
import { Prisma } from "@news/db/client";

export type RawArticleData = Prisma.ProcessedArticleGetPayload<{
  include: { rawArticle: true; categories: true };
}>;

export type ProcessedArticleWithRaw = RawArticleData;

export function mapArticle(raw: RawArticleData): Article {
  if (!raw) {
    throw new Error("Cannot map null or undefined article");
  }

  const rawArticle = raw.rawArticle;
  if (!rawArticle) {
    throw new Error("Raw article data is missing; cannot perform mapping");
  }

  return {
    id: raw.id,
    title: rawArticle.title,
    source: rawArticle.source,
    publishedAt:
      rawArticle.publishedAt instanceof Date
        ? rawArticle.publishedAt.toISOString()
        : String(rawArticle.publishedAt),
    contentSnippet: rawArticle.contentSnippet || "",
    extractedContent: rawArticle.extractedContent ?? null,
    biasNote: raw.biasNote ?? null,
    eventRegion: raw.eventRegion ?? null,
    sentimentScore: raw.sentimentScore ?? null,
    url: rawArticle.url,
    categories: raw.categories || [],
    entities: raw.entities || [],
    sourceCountry: rawArticle.sourceCountry ?? null,
    sourceOrigin: getPublisherRegion(rawArticle.sourceCountry),
    sourceType: rawArticle.sourceType ?? null,
    biasGroup: rawArticle.biasGroup ?? null,
    coverageScope: rawArticle.coverageScope ?? null,
    slug: rawArticle.slug ?? null,
  };
}

export const mapProcessedArticleToArticle = mapArticle;
