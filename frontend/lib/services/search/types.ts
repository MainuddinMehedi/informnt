export interface WebSearchResult {
  index?: number;
  title: string;
  url: string;
  snippet: string;
  source?: string;
  published?: string;
}

export interface WebSearchResponse {
  engine: string;
  results: WebSearchResult[];
}
