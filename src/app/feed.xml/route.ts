import { store } from "@/lib/store";

/**
 * RSS 2.0 feed for the articles — /feed.xml.
 *
 * The site is a hash-routed SPA (single HTML document), so every article
 * permalink is `https://imsoroush.ir/#/writing/<slug>` — the same deep-link
 * format the reader UI and the share buttons use. Titles/excerpts prefer the
 * English translation with a Persian fallback, matching the site's default
 * language. Served as `application/rss+xml` with a 30-minute CDN window.
 */

export const dynamic = "force-dynamic";

const SITE_URL = "https://imsoroush.ir";
const MAX_ITEMS = 20;

/** Minimal XML escaping for text nodes. */
const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export async function GET() {
  try {
    const articles = await store.listArticles("all");
    const items = [...articles]
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
      .slice(0, MAX_ITEMS);

    const entries = items
      .map((a) => {
        const title = a.titleEn ?? a.title;
        const excerpt = a.excerptEn ?? a.excerpt;
        const url = `${SITE_URL}/#/writing/${encodeURIComponent(a.slug)}`;
        const pubDate = new Date(a.publishedAt).toUTCString();
        return `    <item>
      <title>${esc(title)}</title>
      <link>${url}</link>
      <guid isPermaLink="false">${esc(a.slug)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${esc(excerpt)}</description>
    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Soroush Chegini — Articles</title>
    <link>${SITE_URL}</link>
    <description>Articles on software development, automation bots and 3D experiences by Soroush Chegini.</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${entries}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800",
      },
    });
  } catch (error) {
    console.error("GET /feed.xml error:", error);
    return new Response("Feed temporarily unavailable", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
