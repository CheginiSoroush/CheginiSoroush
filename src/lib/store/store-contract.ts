import type {
  AdminCommentRow,
  AdminStats,
  ArticleRow,
  CommentRow,
  ContactMessageRow,
  DemoHealthRow,
  ListMessagesOpts,
  ListProjectsOpts,
  ProjectRow,
  RepoDemoRow,
  RepoMetaRow,
  SnapshotTable,
  SubscriberRow,
} from "./types";

/**
 * The single data-access interface used by every API route and the root
 * server component. Two implementations exist:
 *
 *  - `prisma-store.ts` → local dev / Node (SQLite file via Prisma)
 *  - `d1-store.ts`     → Cloudflare Workers production (D1 binding, raw SQL)
 *
 * The correct driver is chosen once, at module load, by runtime detection —
 * no per-request branching anywhere else in the codebase.
 */
export interface DataStore {
  // ---------- Projects ----------
  listProjects(opts: ListProjectsOpts): Promise<ProjectRow[]>;
  /** Returns the new view count, or null when the slug does not exist. */
  incrProjectViews(slug: string): Promise<number | null>;
  bumpProjectViewsStat(): Promise<void>;

  // ---------- Articles ----------
  listArticles(category: string): Promise<ArticleRow[]>;
  getArticle(slug: string): Promise<ArticleRow | null>;
  getArticleLikes(slug: string): Promise<number | null>;
  setArticleLikes(slug: string, likes: number): Promise<void>;
  /** Returns the new view count, or null when the slug does not exist. */
  incrArticleViews(slug: string): Promise<number | null>;

  // ---------- Site stats ----------
  readStats(): Promise<{
    visits: number;
    projectViews: number;
    projects: number;
    articles: number;
    messages: number;
  }>;
  incrVisits(): Promise<void>;

  // ---------- Contact messages ----------
  createMessage(m: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<string>;
  listMessages(
    opts: ListMessagesOpts
  ): Promise<{ messages: ContactMessageRow[]; total: number; unread: number }>;
  setMessageRead(id: string, read: boolean): Promise<ContactMessageRow | null>;
  deleteMessage(id: string): Promise<void>;

  // ---------- Article comments (public, per-article) ----------
  /** Chronological (oldest → newest) comments for one article. */
  listComments(articleSlug: string): Promise<CommentRow[]>;
  createComment(c: {
    articleSlug: string;
    name: string;
    body: string;
  }): Promise<CommentRow>;
  // ---------- Article comments (admin moderation) ----------
  /** Newest-first comments across all articles, joined with article meta. */
  listAllComments(): Promise<AdminCommentRow[]>;
  /** Returns false when the comment does not exist. */
  deleteComment(id: string): Promise<boolean>;

  // ---------- Subscribers ----------
  countSubscribers(): Promise<number>;
  subscriberExists(email: string): Promise<boolean>;
  addSubscriber(email: string): Promise<void>;
  listSubscribers(): Promise<SubscriberRow[]>;

  // ---------- GitHub snapshots (single-row caches) ----------
  getSnapshot(table: SnapshotTable): Promise<{ payloadJson: string; updatedAt: string } | null>;
  putSnapshot(table: SnapshotTable, payloadJson: string): Promise<void>;

  // ---------- Auto-sync data (repo demos / meta / demo health) ----------
  listRepoDemos(): Promise<RepoDemoRow[]>;
  listRepoMeta(): Promise<RepoMetaRow[]>;
  listDemoHealth(): Promise<DemoHealthRow[]>;

  // ---------- Admin dashboard ----------
  adminStats(): Promise<AdminStats>;

  // ---------- Rate limiting (public POST protection) ----------
  /**
   * Atomically bumps the fixed-window counter for `key`/`windowStart` and
   * returns the new count. `cleanupBefore` (epoch sec) lazily prunes stale
   * windows whenever a fresh window begins.
   */
  incrementRateLimit(key: string, windowStart: number, cleanupBefore: number): Promise<number>;
}
