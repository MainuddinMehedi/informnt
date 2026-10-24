import { tool, zodSchema } from "ai";
import { z } from "zod";
import { extractUrlContent } from "@/lib/services/extractor";

const fetchUrlInputSchema = zodSchema(
  z.object({
    url: z.string().url().describe("The URL to fetch and extract content from"),
  }),
);

export const fetchUrlTool = tool({
  description:
    "Fetch and extract the main content (title, text, author, etc.) from a given URL. Use this when the user provides a link they want you to read or analyze.",
  inputSchema: fetchUrlInputSchema,
  execute: async ({ url }) => {
    return extractUrlContent(url);
  },
});
