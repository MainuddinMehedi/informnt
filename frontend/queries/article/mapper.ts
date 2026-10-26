import { Article } from "@/types/article";
import { getPublisherRegion } from "@/utils/regions";
import { Prisma } from "@news/db/client";

export type RawArticleData = Prisma.ProcessedArticleGetPayload<{
  include: {
    rawArticle: {
      include: {
        publisher: true;
      };
    };
    categories: true;
  };
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

  const publisher = (rawArticle as any).publisher || null;

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
    sourceCountry: publisher?.publisherCountry ?? rawArticle.sourceCountry ?? null,
    sourceOrigin: publisher?.sourceRegion ?? getPublisherRegion(rawArticle.sourceCountry),
    sourceType: publisher?.ownershipType ?? rawArticle.sourceType ?? null,
    biasGroup: publisher?.politicalLeaning ?? rawArticle.biasGroup ?? null,
    coverageScope: publisher?.coverageScope ?? rawArticle.coverageScope ?? null,
    slug: rawArticle.slug ?? null,
    publisherSlug: rawArticle.publisherSlug ?? publisher?.slug ?? null,
    publisher: publisher
      ? {
          slug: publisher.slug,
          name: publisher.name,
          website: publisher.website,
          publisherCountry: publisher.publisherCountry,
          sourceRegion: publisher.sourceRegion,
          ownershipType: publisher.ownershipType,
          publisherType: publisher.publisherType,
          editorialStyle: publisher.editorialStyle,
          coverageScope: publisher.coverageScope,
          originality: publisher.originality,
          politicalLeaning: publisher.politicalLeaning,
          economicPerspective: publisher.economicPerspective,
          reliability: publisher.reliability,
          reliabilityConfidence: publisher.reliabilityConfidence,
          stateFunded: publisher.stateFunded,
        }
      : null,
  };
}

export const mapProcessedArticleToArticle = mapArticle;
