export interface PublisherInfo {
  slug: string;
  name: string;
  website: string | null;
  publisherCountry: string;
  sourceRegion: string;
  ownershipType: string;
  publisherType: string;
  editorialStyle: string | null;
  coverageScope: string;
  originality: string | null;
  politicalLeaning: string | null;
  economicPerspective: string | null;
  reliability: string | null;
  reliabilityConfidence: number | null;
  stateFunded: boolean;
  profile?: any;
}

export interface Article {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  contentSnippet: string;
  extractedContent: string | null;
  biasNote: string | null;
  eventRegion: string | null;
  sentimentScore: number | null;
  url: string;
  categories: { id: string; name: string }[];
  entities: string[];
  sourceCountry: string | null;
  sourceOrigin: string | null;
  sourceType: string | null;
  biasGroup: string | null;
  coverageScope: string | null;
  slug: string | null;
  publisherSlug?: string | null;
  publisher?: PublisherInfo | null;
}
