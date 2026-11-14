import { describe, expect, test } from "vitest";

import { discoverFeedUrls } from "./feedDiscovery";

const page = (head: string) =>
  `<!doctype html><html><head>${head}</head><body></body></html>`;

describe("discoverFeedUrls", () => {
  test("finds RSS and Atom alternate links in document order", () => {
    const html = page(`
      <link rel="alternate" type="application/atom+xml" href="https://example.com/atom.xml">
      <link rel="alternate" type="application/rss+xml" href="https://example.com/rss.xml">
    `);

    expect(discoverFeedUrls(html, "https://example.com/blog")).toEqual([
      "https://example.com/atom.xml",
      "https://example.com/rss.xml",
    ]);
  });

  test("resolves relative hrefs against the page URL", () => {
    const html = page(
      `<link rel="alternate" type="application/rss+xml" href="?format=rss">`,
    );

    expect(discoverFeedUrls(html, "https://example.com/blog")).toEqual([
      "https://example.com/blog?format=rss",
    ]);
  });

  test("resolves relative hrefs against <base> when present", () => {
    const html = page(`
      <base href="https://cdn.example.com/site/">
      <link rel="alternate" type="application/rss+xml" href="feed.xml">
    `);

    expect(discoverFeedUrls(html, "https://example.com/")).toEqual([
      "https://cdn.example.com/site/feed.xml",
    ]);
  });

  test("matches rel and type case-insensitively and with extra tokens", () => {
    const html = page(
      `<link rel="Alternate home" type="Application/RSS+XML; charset=utf-8" href="/feed">`,
    );

    expect(discoverFeedUrls(html, "https://example.com/")).toEqual([
      "https://example.com/feed",
    ]);
  });

  test("ignores non-feed links, JSON Feed and non-http URLs", () => {
    const html = page(`
      <link rel="stylesheet" type="text/css" href="/style.css">
      <link rel="alternate" type="text/html" hreflang="pt" href="/pt/">
      <link rel="alternate" type="application/feed+json" href="/feed.json">
      <link rel="feed" type="application/rss+xml" href="/not-alternate.xml">
      <link rel="alternate" type="application/rss+xml" href="javascript:alert(1)">
    `);

    expect(discoverFeedUrls(html, "https://example.com/")).toEqual([]);
  });

  test("deduplicates feeds that resolve to the same URL", () => {
    const html = page(`
      <link rel="alternate" type="application/rss+xml" href="/rss/">
      <link rel="alternate" type="application/rss+xml" href="https://example.com/rss/">
    `);

    expect(discoverFeedUrls(html, "https://example.com/")).toEqual([
      "https://example.com/rss/",
    ]);
  });

  test("returns nothing for a page without feeds", () => {
    expect(
      discoverFeedUrls(page("<title>x</title>"), "https://example.com/"),
    ).toEqual([]);
  });
});
