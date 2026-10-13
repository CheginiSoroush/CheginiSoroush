/**
 * Data-access contract shared by both store drivers.
 *
 * Rows are plain JSON-safe objects: dates are ISO strings and booleans are
 * real booleans, regardless of the underlying driver (Prisma/SQLite locally,
 * Cloudflare D1 in production). This keeps API responses byte-identical
 * between the two runtimes.
 */

export type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  repo: string;
  description: string;
  descriptionEn: string | null;
  category: string;
  /** JSON-encoded string[] — routes parse it, same as the legacy Prisma shape. */
  tags: string;
  icon: string;
  featured: boolean;
  views: number;
  order: number;
  createdAt: string;
};

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  excerpt: string;
  excerptEn: string | null;
  content: string;
  category: string;
  icon: string;
  readTime: number;
  views: number;
  likes: number;
  publishedAt: string;
};

export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type CommentRow = {
  id: string;
  articleSlug: string;
  name: string;
  body: string;
  createdAt: string;
};

export type SubscriberRow = {
  email: string;
  createdAt: string;
};

export type TopProjectRow = {
  slug: string;
  title: string;
  titleEn: string | null;
  icon: string;
  views: number;
  category: string;
};

export type TopArticleRow = {
  slug: string;
  title: string;
  titleEn: string | null;
  icon: string;
  views: number;
  likes: number;
};

export type AdminStats = {
  totals: {
    visits: number;
    projectViews: number;
    projects: number;
    articles: number;
    messages: number;
    unread: number;
    messagesLastWeek: number;
    likes: number;
    comments: number;
    subscribers: number;
  };
  topProjects: TopProjectRow[];
  topArticles: TopArticleRow[];
};

export type ListProjectsOpts = {
  category: string;
  q: string;
  featured: boolean;
  sort: "default" | "views";
};

export type ListMessagesOpts = {
  page: number;
  pageSize: number;
  unreadOnly: boolean;
};

export type SnapshotTable = "RepoSnapshot" | "GithubSnapshot";
