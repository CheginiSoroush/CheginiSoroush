export type Project = {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  repo: string;
  description: string;
  descriptionEn?: string | null;
  category: string;
  tags: string[];
  icon: string;
  featured: boolean;
  views: number;
  order: number;
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
};

export type SiteStats = {
  visits: number;
  projectViews: number;
  projects: number;
  articles: number;
  messages: number;
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
  language: string | null;
  stars: number;
  forks: number;
  isFork: boolean;
  archived: boolean;
  topics: string[];
  homepage: string | null;
  pushedAt: string;
  updatedAt: string;
};

export const CATEGORY_LABELS: Record<string, { label: string; en: string; icon: string }> = {
  bots: { label: "ربات‌های تلگرام", en: "Telegram Bots", icon: "🤖" },
  web: { label: "وب و فروشگاه", en: "Web & E-commerce", icon: "🌐" },
  "3d": { label: "سه‌بعدی و تعاملی", en: "3D & Interactive", icon: "🪐" },
  tools: { label: "ابزارهای توسعه", en: "Developer Tools", icon: "🛠️" },
};
