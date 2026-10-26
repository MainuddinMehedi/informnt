import { prisma } from "../db/prisma.js";

/** Returns only feeds where `enabled` is true across all defaults or DB config. */
export async function getActiveFeeds() {
  const allFeeds = await getAllFeeds();
  return allFeeds.filter((f) => f.enabled);
}

/** Returns all feeds regardless of enabled status from database FeedSource, including parent Publisher. */
export async function getAllFeeds() {
  const systemFeeds = await prisma.feedSource.findMany({
    include: {
      publisher: true,
    },
  });

  const feedsMap = new Map();

  for (const f of systemFeeds) {
    feedsMap.set(f.url, {
      name: f.name,
      url: f.url,
      enabled: f.enabled,
      publisherSlug: f.publisherSlug || f.publisher?.slug || null,
      publisher: f.publisher || null,
      category: f.category || null,
      feedType: f.feedType || "RSS 2.0",
      sourceCountry: f.sourceCountry || f.publisher?.publisherCountry || "Global",
      sourceType: f.sourceType || f.publisher?.ownershipType || "Commercial Publisher",
      biasGroup: f.biasGroup || f.publisher?.politicalLeaning || "Centrist",
      coverageScope: f.coverageScope || f.publisher?.coverageScope || "Global",
    });
  }

  return Array.from(feedsMap.values());
}
