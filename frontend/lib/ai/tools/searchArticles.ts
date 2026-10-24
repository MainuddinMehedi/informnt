import { tool, zodSchema } from "ai";
import { z } from "zod";
import { searchArticlesSemantic } from "@/queries/semanticSearch";

export const searchArticlesTool = tool({
  description:
    "Search informnt's internal archive of indexed global and regional news articles across 10 categories (geopolitics, politics, society, economy, technology, environment, sports, etc.). Use this to find specific news articles, quotes, policy reporting (e.g. immigration, visas, demography), societal trends, or granular coverage. If the query is about a macro event or crisis, check search_stories first. If returned articles do not answer the query, autonomously escalate to web_search.",
  inputSchema: zodSchema(
    z.object({
      query: z
        .string()
        .describe("The search query to look up in the informnt news archive"),
    }),
  ),
  execute: async ({ query }) => {
    const response = await searchArticlesSemantic(query);

    if (!response.success) {
      return {
        success: false,
        count: 0,
        results: [],
        error: response.error || "Failed to search internal database.",
      };
    }

    if (response.results.length === 0) {
      return {
        success: true,
        count: 0,
        results: [],
        message:
          "No matching articles found in informnt's indexed news archive for this query. If looking for a specific entity, company, website, platform, person, or external topic, proceed to call the web_search tool.",
      };
    }

    return {
      success: true,
      count: response.results.length,
      results: response.results.map((r, idx) => ({
        index: idx + 1,
        ...r,
      })),
    };
  },
});
