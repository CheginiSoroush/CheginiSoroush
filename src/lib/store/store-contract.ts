import type {
  AdminStats,
  ArticleRow,
  ContactMessageRow,
  ListMessagesOpts,
  ListProjectsOpts,
  ProjectRow,
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

  // NOTE: the Comment table remains in the Prisma schema (data preserved) but
  // no store/API/UI surface exists for it in the product.

  // ---------- Subscribers ----------
  countSubscribers(): Promise<number>;
  subscriberExists(email: string): Promise<boolean>;
  addSubscriber(email: string): Promise<void>;
  listSubscribers(): Promise<SubscriberRow[]>;

  // ---------- GitHub snapshots (single-row caches) ----------
  getSnapshot(table: SnapshotTable): Promise<{ payloadJson: string; updatedAt: string } | null>;
  putSnapshot(table: SnapshotTable, payloadJson: string): Promise<void>;

  // ---------- Admin dashboard ----------
  adminStats(): Promise<AdminStats>;
}
