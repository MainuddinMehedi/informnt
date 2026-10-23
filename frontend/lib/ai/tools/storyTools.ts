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
    "Lightweight search of informnt's tracked multi-article Story Clusters. Returns ONLY high-level metadata (slug, title, status, article count, themes). Use this to check if an ongoing or developing story exists. If a deep breakdown is needed, call get_story_details with the story slug.",
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
          "No tracked story clusters found for this query in informnt's archive.",
      };
    }

    return {
      success: true,
      count: response.count,
      stories: response.stories,
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
    "Retrieve full intelligence details for a specific Story Cluster (summary, why it matters, key developments, and top sources). Only call this when the user explicitly asked for this story breakdown or answered 'yes' to hearing more about it.",
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
