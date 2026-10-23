import prisma from "@/lib/prisma";

export interface StoryClusterSummary {
  slug: string;
  title: string;
  status: string;
  articleCount: number;
  lastActivity?: string;
  themes: string[];
}

export interface StoryClusterDetail {
  slug: string;
  title: string;
  url: string;
  status: string;
  summary: string;
  whyItMatters: string | null;
  keyDevelopments: unknown;
  topSources: string[];
  articleCount: number;
  lastActivity?: string;
  regions: string[];
  themes: string[];
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "what",
  "how",
  "why",
  "when",
  "where",
  "who",
  "tell",
  "me",
  "about",
  "latest",
  "news",
  "story",
  "stories",
  "happening",
  "update",
  "updates",
  "any",
  "some",
]);

/**
 * Searches active Story Clusters by keyword tokens matching titles or summaries.
 */
export async function searchStoryClustersByKeywords(
  query: string,
  limit: number = 5,
): Promise<{
  success: boolean;
  count: number;
  stories: StoryClusterSummary[];
  error?: string;
}> {
  try {
    const trimmed = query.trim();
    if (!trimmed) {
      return { success: true, count: 0, stories: [] };
    }

    const cleanWords = trimmed
      .split(/\s+/)
      .map((w) => w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    const searchWords =
      cleanWords.length > 0 ? cleanWords : trimmed.split(/\s+/).filter(Boolean);

    const clusters = await prisma.storyCluster.findMany({
      where: {
        isActive: true,
        OR: searchWords.flatMap((word) => [
          { title: { contains: word, mode: "insensitive" as const } },
          { summary: { contains: word, mode: "insensitive" as const } },
        ]),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        articleCount: true,
        impactScore: true,
        lastActivityAt: true,
        themes: true,
        regions: true,
      },
      orderBy: [{ lastActivityAt: "desc" }, { momentumScore: "desc" }],
      take: limit,
    });

    return {
      success: true,
      count: clusters.length,
      stories: clusters.map((c) => ({
        slug: c.slug,
        title: c.title,
        status: c.status || "DEVELOPING",
        articleCount: c.articleCount,
        lastActivity: c.lastActivityAt
          ? c.lastActivityAt.toISOString()
          : undefined,
        themes: c.themes.slice(0, 3),
      })),
    };
  } catch (error) {
    console.error("❌ Failed to query story clusters by keywords:", error);
    return {
      success: false,
      count: 0,
      stories: [],
      error: "Failed to search story clusters.",
    };
  }
}

/**
 * Retrieves full synthesized intelligence for a single Story Cluster by slug, id, or exact title.
 */
export async function getStoryIntelligence(
  slugOrId: string,
): Promise<{ success: boolean; story?: StoryClusterDetail; error?: string }> {
  try {
    const identifier = slugOrId.trim();
    if (!identifier) {
      return { success: false, error: "No story slug or id provided." };
    }

    const story = await prisma.storyCluster.findFirst({
      where: {
        isActive: true,
        OR: [
          { slug: identifier },
          { id: identifier },
          { title: { equals: identifier, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        summary: true,
        whyItMatters: true,
        keyDevelopments: true,
        impact: true,
        impactScore: true,
        articleCount: true,
        topSources: true,
        lastActivityAt: true,
        themes: true,
        regions: true,
      },
    });

    if (!story) {
      return {
        success: false,
        error: `Story cluster '${identifier}' not found in informnt archive.`,
      };
    }

    return {
      success: true,
      story: {
        slug: story.slug,
        title: story.title,
        url: `/stories/${story.slug}`,
        status: story.status || "DEVELOPING",
        summary: story.summary,
        whyItMatters: story.whyItMatters,
        keyDevelopments: story.keyDevelopments,
        topSources: story.topSources,
        articleCount: story.articleCount,
        lastActivity: story.lastActivityAt?.toISOString(),
        regions: story.regions,
        themes: story.themes,
      },
    };
  } catch (error) {
    console.error("❌ Failed to query story cluster intelligence:", error);
    return {
      success: false,
      error: "Failed to load story details.",
    };
  }
}
