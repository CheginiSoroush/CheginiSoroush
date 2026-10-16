import { store } from "@/lib/store";
import { SiteShell } from "@/components/site/site-shell";
import type { Article, Project } from "@/lib/types";

export const dynamic = "force-dynamic";

const SITE_URL = "https://imsoroush.ir";

/** Persian script detection — used for per-article inLanguage hints. */
const isPersian = (s: string) => /[\u0600-\u06FF]/.test(s);

/**
 * Blog + latest-articles JSON-LD (complements the Person/WebSite graph that
 * the root layout renders). Permalinks are the server-rendered article pages
 * `/writing/<slug>` (the Option-1 SEO decision) — the same URLs the sitemap,
 * RSS feed and social shares use.
 */
function blogJsonLd(articles: Article[]) {
  if (articles.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/#blog`,
    name: "Soroush Chegini — Articles",
    url: `${SITE_URL}/#/writing`,
    publisher: { "@id": `${SITE_URL}/#person` },
    inLanguage: ["en", "fa-IR"],
    blogPost: articles.slice(0, 10).map((a) => ({
      "@type": "BlogPosting",
      headline: a.titleEn ?? a.title,
      alternativeHeadline: a.titleEn ? a.title : undefined,
      url: `${SITE_URL}/writing/${encodeURIComponent(a.slug)}`,
      datePublished: a.publishedAt,
      inLanguage: isPersian(a.title) ? "fa-IR" : "en",
      author: { "@id": `${SITE_URL}/#person` },
    })),
  };
}

export default async function Page() {
  let projects: Project[] = [];
  let articles: Article[] = [];

  try {
    const [rawProjects, rawArticles] = await Promise.all([
      store.listProjects({ category: "all", q: "", featured: false, sort: "default" }),
      store.listArticles("all"),
    ]);

    projects = rawProjects.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      titleEn: p.titleEn,
      repo: p.repo,
      demoUrl: p.demoUrl,
      description: p.description,
      descriptionEn: p.descriptionEn,
      category: p.category,
      tags: JSON.parse(p.tags) as string[],
      icon: p.icon,
      featured: p.featured,
      views: p.views,
      order: p.order,
    }));
    articles = rawArticles.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      titleEn: a.titleEn,
      excerpt: a.excerpt,
      excerptEn: a.excerptEn,
      content: a.content,
      category: a.category,
      icon: a.icon,
      readTime: a.readTime,
      views: a.views,
      likes: a.likes,
      publishedAt: a.publishedAt,
      demoUrl: a.demoUrl,
    }));
  } catch (error) {
    console.error("Failed to load initial data:", error);
  }

  const blogLd = blogJsonLd(articles);

  return (
    <>
      {blogLd && (
        <script
          type="application/ld+json"
          // `<` escaping keeps article titles from closing the script tag
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(blogLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <SiteShell initialProjects={projects} initialArticles={articles} />
    </>
  );
}
