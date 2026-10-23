import { tool, zodSchema } from "ai";
import { z } from "zod";
import { searchArticlesSemantic } from "@/queries/semanticSearch";

export const searchArticlesTool = tool({
  description:
    "Search informnt's internal archive of indexed global and regional news articles. Use this first when querying for news, geopolitics, or events tracked by the platform. If the returned articles do not contain or answer the query, autonomously escalate to web_search.",
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
        error: response.error || "Failed to search internal database.",
      };
    }

    if (response.results.length === 0) {
      return {
        success: true,
        results: [],
        message:
          "No matching articles found in informnt's indexed news archive for this query. If looking for a specific entity, company, website, platform, person, or external topic, proceed to call the web_search tool.",
      };
    }

    return {
      success: true,
      results: response.results,
    };
  },
});
