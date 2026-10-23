export interface WebSearchResult {
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
