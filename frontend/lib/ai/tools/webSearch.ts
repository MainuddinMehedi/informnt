import { tool, zodSchema } from "ai";
import { z } from "zod";
import { executeWebSearch } from "@/lib/services/search";

const webSearchInputSchema = zodSchema(
  z.object({
    query: z.string().describe("The search query to look up online"),
  }),
);

export const webSearchTool = tool({
  description:
    "Search the live web for current information, websites, entities, companies, or breaking news. Use this when the query is not found or adequately covered in informnt's indexed news archive, or when looking up external websites, platforms, organizations, or real-time web facts.",
  inputSchema: webSearchInputSchema,
  execute: async ({ query }, { abortSignal }) => {
    return executeWebSearch(query, 10, abortSignal);
  },
});
