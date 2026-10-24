import { tool, zodSchema } from "ai";
import { z } from "zod";
import {
  searchStoryClustersByKeywords,
  getStoryIntelligence,
} from "@/queries/storySearch";

const searchStoriesInputSchema = zodSchema(
  z.object({
    query: z
      .string()
      .describe(
        "1-3 keywords or entity names to search for in story cluster titles and themes (e.g., 'Taiwan', 'Inflation', 'Red Sea')",
      ),
  }),
);

export const searchStoriesTool = tool({
  description:
    "Search informnt's tracked multi-article Story Clusters ('Emerging Narratives'). Check this tool first for any general event, crisis, conflict, natural disaster, political situation, or macro news topic (e.g. 'Nepal flood', 'Middle East conflict', 'Taiwan elections') to check if informnt is already tracking an active narrative. Returns high-level metadata (slug, title, status, articleCount, themes). If a matching story cluster is found, call get_story_details to retrieve its full timeline intelligence.",
  inputSchema: searchStoriesInputSchema,
  execute: async ({ query }) => {
    const response = await searchStoryClustersByKeywords(query);

    if (!response.success) {
      return {
        success: false,
        count: 0,
        stories: [],
        error: response.error || "Failed to search story clusters.",
      };
    }

    if (response.stories.length === 0) {
      return {
        success: true,
        count: 0,
        stories: [],
        message:
          "No tracked story clusters found for this query in informnt's archive. Proceed to search individual articles with search_articles.",
      };
    }

    return {
      success: true,
      count: response.count,
      stories: response.stories.map((s, idx) => ({
        index: idx + 1,
        ...s,
      })),
    };
  },
});

const getStoryDetailsInputSchema = zodSchema(
  z.object({
    slugOrId: z
      .string()
      .describe("The slug or ID of the story cluster from search_stories"),
  }),
);

export const getStoryDetailsTool = tool({
  description:
    "Retrieve synthesized intelligence details and key articles for a specific Story Cluster (summary, why it matters, key developments timeline, top sources, and indexed articles). Call this whenever a relevant Story Cluster is identified in search_stories to ground your synthesis.",
  inputSchema: getStoryDetailsInputSchema,
  execute: async ({ slugOrId }) => {
    const response = await getStoryIntelligence(slugOrId);

    if (!response.success || !response.story) {
      return {
        success: false,
        error:
          response.error ||
          `Story cluster '${slugOrId}' not found in informnt archive.`,
      };
    }

    return {
      success: true,
      story: response.story,
    };
  },
});
