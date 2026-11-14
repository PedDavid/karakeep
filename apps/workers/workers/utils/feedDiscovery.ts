import * as cheerio from "cheerio";

// Only XML feed types: rss-parser can't read JSON Feed.
const FEED_TYPES = new Set(["application/rss+xml", "application/atom+xml"]);

/**
 * Returns the feed URLs an HTML page advertises through
 * `<link rel="alternate" type="application/rss+xml|atom+xml" href="...">`,
 * resolved against the page URL, in document order and without duplicates.
 */
export function discoverFeedUrls(html: string, pageUrl: string): string[] {
  const $ = cheerio.load(html);
  const baseHref = $("base[href]").first().attr("href");
  let baseUrl = pageUrl;
  if (baseHref) {
    try {
      baseUrl = new URL(baseHref, pageUrl).toString();
    } catch {
      // Keep the page URL when <base> is malformed.
    }
  }

  const urls: string[] = [];
  $("link[rel][type][href]").each((_, el) => {
    const link = $(el);
    const rels = (link.attr("rel") ?? "").toLowerCase().split(/\s+/);
    const type = (link.attr("type") ?? "").toLowerCase().split(";")[0].trim();
    if (!rels.includes("alternate") || !FEED_TYPES.has(type)) {
      return;
    }

    let url: URL;
    try {
      url = new URL(link.attr("href")!.trim(), baseUrl);
    } catch {
      return;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return;
    }
    if (!urls.includes(url.toString())) {
      urls.push(url.toString());
    }
  });
  return urls;
}
