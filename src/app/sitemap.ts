import type { MetadataRoute } from "next";
import { store } from "@/lib/store";

/**
 * Sitemap — the site is a hash-routed SPA, so `/` is the only crawlable URL.
 * `lastModified` is derived from the newest article's publish date (real
 * content freshness) instead of `new Date()`, which would otherwise advertise
 * a change on every crawl and teach crawlers to distrust the signal.
 *
 * Dynamic (per-request) like the root page; falls back to "now" when the
 * datastore is unreachable so the route can never 500.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://imsoroush.ir";
  let lastModified = new Date();

  try {
    const articles = await store.listArticles("all");
    const stamps = articles
      .map((a) => Date.parse(a.publishedAt))
      .filter((n) => Number.isFinite(n));
    if (stamps.length > 0) {
      lastModified = new Date(Math.max(...stamps));
    }
  } catch {
    // datastore unavailable — keep the fallback
  }

  return [
    {
      url: base,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
