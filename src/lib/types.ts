export type Project = {
  id: string;
  slug: string;
  title: string;
  repo: string;
  description: string;
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
  excerpt: string;
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

export type ViewName = "home" | "projects" | "writing" | "contact";

export const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  bots: { label: "ربات‌های تلگرام", icon: "🤖" },
  web: { label: "وب و فروشگاه", icon: "🌐" },
  "3d": { label: "سه‌بعدی و تعاملی", icon: "🪐" },
  tools: { label: "ابزارهای توسعه", icon: "🛠️" },
};
