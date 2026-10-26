import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: [
      ["dc:date", "dcDate"],
      ["atom:updated", "atomUpdated"],
      ["atom:published", "atomPublished"],
      ["pubdate", "pubdate"],
      ["date", "date"],
    ],
  },
});

function parseItemDate(item) {
  const rawDate =
    item.isoDate ||
    item.pubDate ||
    item.dcDate ||
    item["dc:date"] ||
    item.atomUpdated ||
    item.atomPublished ||
    item.date ||
    item.pubdate;

  if (rawDate) {
    const d = new Date(rawDate);

    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  return null;
}

function extractText(value) {
  if (!value) return "";

  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(extractText).find(Boolean) || "";

  if (typeof value === "object") {
    if (typeof value._ === "string") return value._.trim();

    for (const nestedValue of Object.values(value)) {
      const text = extractText(nestedValue);
      if (text) return text;
    }
  }

  return "";
}

function extractCategories(categories) {
  if (!categories) return "";

  if (Array.isArray(categories)) {
    return categories.map(extractText).filter(Boolean).join(", ");
  }

  return extractText(categories);
}

/**
 * Fetches and streams articles from an RSS/Atom feed.
 *
 * For detailed compatibility documentation, see docs/METADATA_DEVELOPMENT_LOG.md.
 *
 * Previous positional parameter patterns:
 * - 3 arguments (topic scanners): fetchRSSStream(sourceName, sourceCountry, feedUrl)
 * - 5 arguments (legacy ingestion): fetchRSSStream(sourceName, sourceCountry, sourceOrigin, sourceType, feedUrl)
 *
 * Current 7-argument signature:
 */
export default async function* fetchRSSStream(
  sourceName,
  sourceCountry,
  sourceType,
  feedUrl,
  biasGroup,
  coverageScope,
  publisherSlug = null,
) {
  let url = feedUrl;
  let country = sourceCountry;
  let type = sourceType;
  let bias = biasGroup;
  let scope = coverageScope;

  if (arguments.length === 3) {
    url = arguments[2];
    type = null;
    bias = null;
    scope = null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept:
          "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    const feed = await parser.parseString(xml);

    const countryText = country ? ` (${country})` : "";
    console.log(
      `Fetched ${feed.items.length} items from ${sourceName}${countryText}`,
    );

    for (const item of feed.items) {
      const itemDate = parseItemDate(item);

      yield {
        title: extractText(item.title),
        url: item.link,
        contentSnippet: item.contentSnippet || item.content || "",
        source: sourceName,
        sourceCountry: country,
        sourceType: type,
        biasGroup: bias,
        coverageScope: scope,
        publisherSlug: publisherSlug,
        category: extractCategories(item.categories),
        publishedAt: itemDate,
      };
    }
  } catch (err) {
    console.log(`[RSS Stream Error] ${sourceName}`, err);
  }
}
