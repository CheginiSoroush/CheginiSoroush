import type { MetadataRoute } from "next";
import { store } from "@/lib/store";

/**
 * Sitemap — the homepage plus one real URL per article.
 *
 * Every article has a server-rendered permalink at `/writing/<slug>` (the
 * Option-1 SEO decision), so each one is listed individually with its own
 * `lastModified` (publish date — real content freshness). The `/` entry keeps
 * the newest-article date. All dates are derived from real data instead of
 * `new Date()`, which would otherwise advertise a change on every crawl and
 * teach crawlers to distrust the signal.
 *
 * Dynamic (per-request) like the root page; falls back to "now" when the
 * datastore is unreachable so the route can never 500.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://imsoroush.ir";
  let lastModified = new Date();
  let articles: Awaited<ReturnType<typeof store.listArticles>> = [];

  try {
    articles = await store.listArticles("all");
    const stamps = articles
      .map((a) => Date.parse(a.publishedAt))
      .filter((n) => Number.isFinite(n));
    if (stamps.length > 0) {
      lastModified = new Date(Math.max(...stamps));
    }
  } catch {
    // datastore unavailable — keep the fallback
  }

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => {
    const stamp = Date.parse(a.publishedAt);
    return {
      url: `${base}/writing/${encodeURIComponent(a.slug)}`,
      lastModified: Number.isFinite(stamp) ? new Date(stamp) : lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    };
  });

  return [
    {
      url: base,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...articleEntries,
  ];
}
