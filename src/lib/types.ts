export type Project = {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  repo: string;
  /** Live site / GitHub Pages URL — null when the project has no website. */
  demoUrl?: string | null;
  description: string;
  descriptionEn?: string | null;
  category: string;
  tags: string[];
  icon: string;
  featured: boolean;
  views: number;
  order: number;
  /** Latest GitHub release tag (auto-sync). */
  latestTag?: string | null;
  latestTagAt?: string | null;
  /** Weekly commit counts, oldest → newest (auto-sync). */
  commitActivity?: number[];
  /** null = unknown / not a pinged host; true = up; false = down. */
  demoOk?: boolean | null;
  /** Top-3 most-viewed catalog rows. */
  trending?: boolean;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  excerpt: string;
  excerptEn?: string | null;
  content: string;
  category: string;
  icon: string;
  readTime: number;
  views: number;
  likes: number;
  publishedAt: string;
  /** Live interactive demo of the app this article documents (nullable). */
  demoUrl?: string | null;
};

export type SiteStats = {
  visits: number;
  projectViews: number;
  projects: number;
  articles: number;
  messages: number;
};

/** Aggregate GitHub numbers — GET /api/repos?meta=1 (hero stat tiles). */
export type RepoMeta = {
  count: number;
  publicCount: number;
  privateCount: number;
  stars: number;
  forks: number;
  languages: number;
  pages: number;
};

export type Comment = {
  id: string;
  articleSlug: string;
  name: string;
  body: string;
  createdAt: string;
};

export type ViewName = "home" | "projects" | "writing" | "repos" | "contact";

export type GitHubRepo = {
  name: string;
  url: string;
  description: string | null;
  /** Persian description (curated) used when GitHub has none. */
  descriptionFa?: string | null;
  language: string | null;
  stars: number;
  forks: number;
  isFork: boolean;
  /** True for private repos (listed via authenticated server-side fetch). */
  isPrivate?: boolean;
  archived: boolean;
  topics: string[];
  homepage: string | null;
  pushedAt: string;
  updatedAt: string;
  /** Latest GitHub release tag (auto-sync, optional). */
  latestTag?: string | null;
  latestTagAt?: string | null;
  /** Weekly commit counts, oldest → newest (auto-sync, optional). */
  commitActivity?: number[];
  /** Demo-host health from the last uptime ping — null when unknown. */
  demoOk?: boolean | null;
};

export const CATEGORY_LABELS: Record<string, { label: string; en: string; icon: string }> = {
  bots: { label: "ربات‌های تلگرام", en: "Telegram Bots", icon: "🤖" },
  web: { label: "وب و فروشگاه", en: "Web & E-commerce", icon: "🌐" },
  "3d": { label: "سه‌بعدی و تعاملی", en: "3D & Interactive", icon: "🪐" },
  tools: { label: "ابزارهای توسعه", en: "Developer Tools", icon: "🛠️" },
};
