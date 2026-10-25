/**
 * Lightweight publication date extractor for articles from feeds that lack <pubDate> in XML.
 * Streams only the opening chunk (~45KB) of the article HTML to parse Schema.org JSON-LD
 * or standard OpenGraph/HTML meta tags, avoiding downloading full article assets.
 *
 * @param {string} url - The article URL.
 * @param {number} [timeoutMs=4000] - Request timeout in milliseconds.
 * @returns {Promise<Date|null>} - The parsed Date object or null if unresolvable.
 */
export async function extractArticleDate(url, timeoutMs = 4000) {
  if (!url || typeof url !== "string") return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) return null;

    const reader = res.body.getReader();
    let text = "";
    const decoder = new TextDecoder("utf-8");

    // Read only up to ~45KB of the HTML stream (head and opening metadata tags)
    while (text.length < 45000) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      // Early exit if datePublished or article:published_time found and head tag is passed
      if (
        (text.includes('"datePublished"') || text.includes("article:published_time")) &&
        text.includes("</head>")
      ) {
        break;
      }
    }
    reader.cancel().catch(() => {});

    // 1. JSON-LD datePublished (Schema.org NewsArticle standard)
    const jsonLdMatch = text.match(/"datePublished"\s*:\s*"([^"]+)"/i);
    if (jsonLdMatch && jsonLdMatch[1]) {
      const d = new Date(jsonLdMatch[1]);
      if (!isNaN(d.getTime())) return d;
    }

    // 2. OpenGraph & Semantic HTML Meta Tags
    const metaPatterns = [
      /<meta[^>]+(?:property|name)=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']article:published_time["']/i,
      /<meta[^>]+(?:property|name)=["'](?:date|pubdate|publishdate|parsely-pub-date|sailthru\.date|dc\.date|dc\.date\.issued)["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:date|pubdate|publishdate|parsely-pub-date|sailthru\.date|dc\.date|dc\.date\.issued)["']/i,
      /<time[^>]+datetime=["']([^"']+)["']/i,
    ];

    for (const pattern of metaPatterns) {
      const m = text.match(pattern);
      if (m && m[1]) {
        const d = new Date(m[1]);
        if (!isNaN(d.getTime())) return d;
      }
    }

    // 3. JSON-LD dateModified (fallback if published date is not provided)
    const jsonLdMod = text.match(/"dateModified"\s*:\s*"([^"]+)"/i);
    if (jsonLdMod && jsonLdMod[1]) {
      const d = new Date(jsonLdMod[1]);
      if (!isNaN(d.getTime())) return d;
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default extractArticleDate;
