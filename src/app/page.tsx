import { store } from "@/lib/store";
import { SiteShell } from "@/components/site/site-shell";
import type { Article, Project } from "@/lib/types";

export const dynamic = "force-dynamic";

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

  return <SiteShell initialProjects={projects} initialArticles={articles} />;
}
