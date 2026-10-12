import { db } from "@/lib/db";
import { SiteShell } from "@/components/site/site-shell";
import type { Article, Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  let projects: Project[] = [];
  let articles: Article[] = [];

  try {
    const [rawProjects, rawArticles] = await Promise.all([
      db.project.findMany({ orderBy: [{ featured: "desc" }, { order: "asc" }] }),
      db.article.findMany({ orderBy: { publishedAt: "asc" } }),
    ]);

    projects = rawProjects.map((p) => ({ ...p, tags: JSON.parse(p.tags) as string[] }));
    articles = rawArticles;
  } catch (error) {
    console.error("Failed to load initial data:", error);
  }

  return <SiteShell initialProjects={projects} initialArticles={articles} />;
}
