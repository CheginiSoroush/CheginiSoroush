import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { DataStore } from "./store-contract";
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
  SubscriberRow,
} from "./types";

/* ------------------------------------------------------------------ */
/* Minimal structural typing for the D1 binding (no workers-types dep) */
/* ------------------------------------------------------------------ */

interface D1StmtLike {
  bind(...values: unknown[]): D1StmtLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

interface D1DatabaseLike {
  prepare(sql: string): D1StmtLike;
}

function d1(): D1DatabaseLike {
  const ctx = getCloudflareContext() as unknown as { env?: { DB?: D1DatabaseLike } };
  const database = ctx?.env?.DB;
  if (!database) {
    throw new Error("D1 binding `DB` is not available in this environment");
  }
  return database;
}

/* --------------------------- helpers ------------------------------ */

const nowIso = () => new Date().toISOString();

/**
 * Normalize a stored datetime to an ISO string.
 * D1 seeds historically inserted `publishedAt` as raw epoch millis
 * (SQLite DATETIME), which `new Date("1791814409419")` cannot parse —
 * the UI rendered "Invalid Date". Accepts epoch millis (number or
 * numeric string) or any parseable date string; ISO passthrough otherwise.
 */
function toIso(value: unknown): string {
  if (typeof value === "number") return new Date(value).toISOString();
  const s = String(value);
  if (/^\d{12,15}$/.test(s)) return new Date(Number(s)).toISOString();
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? nowIso() : d.toISOString();
}

const newId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

/** Escape LIKE wildcards so user search input behaves like Prisma `contains`. */
const likeParam = (q: string): string => `%${q.replace(/([\\%_])/g, "\\$1")}%`;

const ESCAPE_CLAUSE = " ESCAPE '\\'";

function mapProject(r: Record<string, unknown>): ProjectRow {
  return {
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    titleEn: (r.titleEn as string | null) ?? null,
    repo: String(r.repo),
    demoUrl: (r.demoUrl as string | null) ?? null,
    description: String(r.description),
    descriptionEn: (r.descriptionEn as string | null) ?? null,
    category: String(r.category),
    tags: String(r.tags ?? "[]"),
    icon: String(r.icon ?? "📦"),
    featured: !!r.featured,
    views: Number(r.views ?? 0),
    order: Number(r.order ?? 0),
    createdAt: toIso(r.createdAt ?? nowIso()),
  };
}

function mapArticle(r: Record<string, unknown>): ArticleRow {
  return {
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    titleEn: (r.titleEn as string | null) ?? null,
    excerpt: String(r.excerpt),
    excerptEn: (r.excerptEn as string | null) ?? null,
    content: String(r.content),
    category: String(r.category),
    icon: String(r.icon ?? "📝"),
    readTime: Number(r.readTime ?? 5),
    views: Number(r.views ?? 0),
    likes: Number(r.likes ?? 0),
    publishedAt: toIso(r.publishedAt ?? nowIso()),
    demoUrl: (r.demoUrl as string | null) ?? null,
  };
}

function mapMessage(r: Record<string, unknown>): ContactMessageRow {
  return {
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    subject: String(r.subject),
    message: String(r.message),
    read: !!r.read,
    createdAt: toIso(r.createdAt ?? nowIso()),
  };
}

function mapComment(r: Record<string, unknown>): CommentRow {
  return {
    id: String(r.id),
    articleSlug: String(r.articleSlug),
    name: String(r.name),
    body: String(r.body),
    createdAt: toIso(r.createdAt ?? nowIso()),
  };
}

function mapAdminComment(r: Record<string, unknown>): AdminCommentRow {
  return {
    ...mapComment(r),
    articleTitle: (r.articleTitle as string) ?? String(r.articleSlug ?? ""),
    articleTitleEn: (r.articleTitleEn as string | null) ?? null,
    articleIcon: (r.articleIcon as string) ?? "📝",
  };
}

/* --------------------------- the driver ---------------------------- */

/* ------------------- per-isolate read cache ------------------------ */

/**
 * Tiny TTL cache with serve-stale-on-error semantics.
 *
 * Why: D1's free-tier row-read quota is ACCOUNT-WIDE, and any other Worker
 * on the same Cloudflare account can exhaust it — every query then fails
 * until midnight UTC (observed 2026-10-16: whole site rendered empty).
 *
 * The hot public reads below run on every SSR render + API request, so they
 * are cached briefly (45s fresh) and keep serving the last known good value
 * for another 15 minutes while D1 rejects queries. Bounded key space
 * (categories × slugs), per-isolate — no cross-worker coordination needed.
 */
type CacheEntry = { value: unknown; freshUntil: number; staleUntil: number };
const readCache = new Map<string, CacheEntry>();

const FRESH_MS = 45_000;
const STALE_MS = 15 * 60_000;

/**
 * L2: the Workers Cache API (free, edge-persistent, does NOT burn D1 quota).
 * Every successful read is written through, so cold isolates (and whole
 * colos) can recover real content even while D1 rejects every query.
 * Synthetic URLs on the site's own zone — they are never fetched, only used
 * as cache keys.
 */
interface CacheLike {
  put(key: RequestInfo, res: Response): Promise<void>;
  match(key: RequestInfo): Promise<Response | undefined>;
}
const CACHE_API: CacheLike | undefined =
  typeof caches !== "undefined"
    ? (caches as unknown as { default?: CacheLike }).default
    : undefined;

const L2_PREFIX = "https://imsoroush.ir/__d1-l2/";

async function l2Put(key: string, value: unknown): Promise<void> {
  if (!CACHE_API) return;
  try {
    await CACHE_API.put(
      `${L2_PREFIX}${encodeURIComponent(key)}`,
      new Response(JSON.stringify(value), {
        headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" },
      })
    );
  } catch {
    /* best effort — the memory cache still works */
  }
}

async function l2Get<T>(key: string): Promise<T | null> {
  if (!CACHE_API) return null;
  try {
    const hit = await CACHE_API.match(`${L2_PREFIX}${encodeURIComponent(key)}`);
    if (!hit) return null;
    return (await hit.json()) as T;
  } catch {
    return null;
  }
}

async function cachedRead<T>(key: string, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = readCache.get(key);
  if (hit && hit.freshUntil > now) return hit.value as T;
  try {
    const value = await load();
    readCache.set(key, {
      value,
      freshUntil: now + FRESH_MS,
      staleUntil: now + FRESH_MS + STALE_MS,
    });
    void l2Put(key, value); // fire-and-forget write-through
    return value;
  } catch (error) {
    if (hit && hit.staleUntil > now) return hit.value as T; // D1 down → last known good (RAM)
    const l2 = await l2Get<T>(key); // D1 down + cold isolate → edge cache
    if (l2 !== null) {
      readCache.set(key, {
        value: l2,
        freshUntil: now + FRESH_MS,
        staleUntil: now + FRESH_MS + STALE_MS,
      });
      return l2;
    }
    throw error;
  }
}

export const d1Store: DataStore = {
  // ---------- Projects ----------
  async listProjects(opts: ListProjectsOpts): Promise<ProjectRow[]> {
    return cachedRead(
      `projects:${opts.category}:${opts.q}:${opts.featured}:${opts.sort}`,
      async () => {
        const conds: string[] = [];
        const params: unknown[] = [];

        if (opts.category && opts.category !== "all") {
          conds.push(`"category" = ?`);
          params.push(opts.category);
        }
        if (opts.featured) conds.push(`"featured" = 1`);
        if (opts.q) {
          const like = likeParam(opts.q);
          conds.push(
            `("title" LIKE ?${ESCAPE_CLAUSE} OR "description" LIKE ?${ESCAPE_CLAUSE} OR "repo" LIKE ?${ESCAPE_CLAUSE} OR "tags" LIKE ?${ESCAPE_CLAUSE})`
          );
          params.push(like, like, like, like);
        }

        const whereSql = conds.length ? ` WHERE ${conds.join(" AND ")}` : "";
        const orderSql =
          opts.sort === "views"
            ? ` ORDER BY "views" DESC, "featured" DESC, "order" ASC`
            : ` ORDER BY "featured" DESC, "order" ASC`;

        const stmt = d1().prepare(`SELECT * FROM "Project"${whereSql}${orderSql}`).bind(...params);
        const { results } = await stmt.all<Record<string, unknown>>();
        return results.map(mapProject);
      }
    );
  },

  async incrProjectViews(slug: string): Promise<number | null> {
    const row = await d1()
      .prepare(`UPDATE "Project" SET "views" = "views" + 1 WHERE "slug" = ? RETURNING "views"`)
      .bind(slug)
      .first<{ views: number }>();
    return row ? Number(row.views) : null;
  },

  async bumpProjectViewsStat(): Promise<void> {
    await d1()
      .prepare(
        `INSERT INTO "SiteStat" ("key", "value", "updatedAt") VALUES ('projectViews', 1, ?)
         ON CONFLICT("key") DO UPDATE SET "value" = "SiteStat"."value" + 1, "updatedAt" = excluded."updatedAt"`
      )
      .bind(nowIso())
      .run();
  },

  // ---------- Articles ----------
  async listArticles(category: string): Promise<ArticleRow[]> {
    return cachedRead(`articles:${category}`, async () => {
      const stmt =
        category && category !== "all"
          ? d1()
              .prepare(`SELECT * FROM "Article" WHERE "category" = ? ORDER BY "publishedAt" DESC`)
              .bind(category)
          : d1().prepare(`SELECT * FROM "Article" ORDER BY "publishedAt" DESC`);
      const { results } = await stmt.all<Record<string, unknown>>();
      return results.map(mapArticle);
    });
  },

  async getArticle(slug: string): Promise<ArticleRow | null> {
    return cachedRead(`article:${slug}`, async () => {
      const row = await d1()
        .prepare(`SELECT * FROM "Article" WHERE "slug" = ?`)
        .bind(slug)
        .first<Record<string, unknown>>();
      return row ? mapArticle(row) : null;
    });
  },

  async getArticleLikes(slug: string): Promise<number | null> {
    const row = await d1()
      .prepare(`SELECT "likes" FROM "Article" WHERE "slug" = ?`)
      .bind(slug)
      .first<{ likes: number }>();
    return row ? Number(row.likes) : null;
  },

  async setArticleLikes(slug: string, likes: number): Promise<void> {
    await d1()
      .prepare(`UPDATE "Article" SET "likes" = ? WHERE "slug" = ?`)
      .bind(likes, slug)
      .run();
  },

  async incrArticleViews(slug: string): Promise<number | null> {
    const row = await d1()
      .prepare(`UPDATE "Article" SET "views" = "views" + 1 WHERE "slug" = ? RETURNING "views"`)
      .bind(slug)
      .first<{ views: number }>();
    return row ? Number(row.views) : null;
  },

  // ---------- Site stats ----------
  async readStats() {
    return cachedRead("stats", async () => {
      const database = d1();
      const [visits, projectViews, projects, articles, messages] = await Promise.all([
        database.prepare(`SELECT "value" FROM "SiteStat" WHERE "key" = 'visits'`).first<{ value: number }>(),
        database
          .prepare(`SELECT "value" FROM "SiteStat" WHERE "key" = 'projectViews'`)
          .first<{ value: number }>(),
        database.prepare(`SELECT COUNT(*) AS c FROM "Project"`).first<{ c: number }>(),
        database.prepare(`SELECT COUNT(*) AS c FROM "Article"`).first<{ c: number }>(),
        database.prepare(`SELECT COUNT(*) AS c FROM "ContactMessage"`).first<{ c: number }>(),
      ]);
      return {
        visits: visits ? Number(visits.value) : 0,
        projectViews: projectViews ? Number(projectViews.value) : 0,
        projects: Number(projects?.c ?? 0),
        articles: Number(articles?.c ?? 0),
        messages: Number(messages?.c ?? 0),
      };
    });
  },

  async incrVisits(): Promise<void> {
    await d1()
      .prepare(
        `INSERT INTO "SiteStat" ("key", "value", "updatedAt") VALUES ('visits', 1, ?)
         ON CONFLICT("key") DO UPDATE SET "value" = "SiteStat"."value" + 1, "updatedAt" = excluded."updatedAt"`
      )
      .bind(nowIso())
      .run();
  },

  // ---------- Contact messages ----------
  async createMessage(m: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<string> {
    const id = newId();
    await d1()
      .prepare(
        `INSERT INTO "ContactMessage" ("id", "name", "email", "subject", "message", "read", "createdAt")
         VALUES (?, ?, ?, ?, ?, 0, ?)`
      )
      .bind(id, m.name, m.email, m.subject, m.message, nowIso())
      .run();
    return id;
  },

  async listMessages(opts: ListMessagesOpts) {
    const database = d1();
    const whereSql = opts.unreadOnly ? ` WHERE "read" = 0` : "";
    const [rows, totalRow, unreadRow] = await Promise.all([
      database
        .prepare(
          `SELECT * FROM "ContactMessage"${whereSql} ORDER BY "createdAt" DESC LIMIT ? OFFSET ?`
        )
        .bind(opts.pageSize, (opts.page - 1) * opts.pageSize)
        .all<Record<string, unknown>>(),
      database
        .prepare(`SELECT COUNT(*) AS c FROM "ContactMessage"${whereSql}`)
        .first<{ c: number }>(),
      database
        .prepare(`SELECT COUNT(*) AS c FROM "ContactMessage" WHERE "read" = 0`)
        .first<{ c: number }>(),
    ]);
    return {
      messages: rows.results.map(mapMessage),
      total: Number(totalRow?.c ?? 0),
      unread: Number(unreadRow?.c ?? 0),
    };
  },

  async setMessageRead(id: string, read: boolean): Promise<ContactMessageRow | null> {
    const row = await d1()
      .prepare(`UPDATE "ContactMessage" SET "read" = ? WHERE "id" = ? RETURNING *`)
      .bind(read ? 1 : 0, id)
      .first<Record<string, unknown>>();
    return row ? mapMessage(row) : null;
  },

  async deleteMessage(id: string): Promise<void> {
    await d1().prepare(`DELETE FROM "ContactMessage" WHERE "id" = ?`).bind(id).run();
  },

  // ---------- Article comments ----------
  async listComments(articleSlug: string): Promise<CommentRow[]> {
    const { results } = await d1()
      .prepare(`SELECT * FROM "Comment" WHERE "articleSlug" = ? ORDER BY "createdAt" ASC LIMIT 200`)
      .bind(articleSlug)
      .all<Record<string, unknown>>();
    return results.map(mapComment);
  },

  async createComment(c: {
    articleSlug: string;
    name: string;
    body: string;
  }): Promise<CommentRow> {
    const row = await d1()
      .prepare(
        `INSERT INTO "Comment" ("id", "articleSlug", "name", "body", "createdAt")
         VALUES (?, ?, ?, ?, ?) RETURNING *`
      )
      .bind(newId(), c.articleSlug, c.name, c.body, nowIso())
      .first<Record<string, unknown>>();
    if (!row) throw new Error("Failed to insert comment");
    return mapComment(row);
  },

  async listAllComments(): Promise<AdminCommentRow[]> {
    // LEFT JOIN keeps orphaned comments (article later removed) visible so the
    // owner can still delete them; title falls back to the raw slug in the mapper.
    const { results } = await d1()
      .prepare(
        `SELECT c.*, a."title" AS "articleTitle", a."titleEn" AS "articleTitleEn", a."icon" AS "articleIcon"
         FROM "Comment" c LEFT JOIN "Article" a ON a."slug" = c."articleSlug"
         ORDER BY c."createdAt" DESC LIMIT 500`
      )
      .all<Record<string, unknown>>();
    return results.map(mapAdminComment);
  },

  async deleteComment(id: string): Promise<boolean> {
    const row = await d1()
      .prepare(`DELETE FROM "Comment" WHERE "id" = ? RETURNING "id"`)
      .bind(id)
      .first<{ id: string }>();
    return !!row;
  },

  // ---------- Subscribers ----------
  async countSubscribers(): Promise<number> {
    const row = await d1()
      .prepare(`SELECT COUNT(*) AS c FROM "Subscriber"`)
      .first<{ c: number }>();
    return Number(row?.c ?? 0);
  },

  async subscriberExists(email: string): Promise<boolean> {
    const row = await d1()
      .prepare(`SELECT 1 AS ok FROM "Subscriber" WHERE "email" = ?`)
      .bind(email)
      .first<{ ok: number }>();
    return !!row;
  },

  async addSubscriber(email: string): Promise<void> {
    await d1()
      .prepare(`INSERT INTO "Subscriber" ("id", "email", "createdAt") VALUES (?, ?, ?)`)
      .bind(newId(), email, nowIso())
      .run();
  },

  async listSubscribers(): Promise<SubscriberRow[]> {
    const { results } = await d1()
      .prepare(`SELECT "email", "createdAt" FROM "Subscriber" ORDER BY "createdAt" DESC`)
      .all<Record<string, unknown>>();
    return results.map((r) => ({
      email: String(r.email),
      createdAt: String(r.createdAt ?? nowIso()),
    }));
  },

  async deleteSubscriber(email: string): Promise<boolean> {
    const row = await d1()
      .prepare(`DELETE FROM "Subscriber" WHERE "email" = ? RETURNING "email"`)
      .bind(email)
      .first<{ email: string }>();
    return !!row;
  },

  // ---------- GitHub snapshots ----------
  async getSnapshot(table): Promise<{ payloadJson: string; updatedAt: string } | null> {
    return cachedRead(`snap:${table}`, async () => {
      const row = await d1()
        .prepare(`SELECT "payloadJson", "updatedAt" FROM "${table}" WHERE "id" = 1`)
        .first<{ payloadJson: string; updatedAt: string }>();
      return row ? { payloadJson: row.payloadJson, updatedAt: String(row.updatedAt) } : null;
    });
  },

  async putSnapshot(table, payloadJson: string): Promise<void> {
    await d1()
      .prepare(
        `INSERT INTO "${table}" ("id", "payloadJson", "updatedAt") VALUES (1, ?, ?)
         ON CONFLICT("id") DO UPDATE SET "payloadJson" = excluded."payloadJson", "updatedAt" = excluded."updatedAt"`
      )
      .bind(payloadJson, nowIso())
      .run();
  },

  // ---------- Auto-sync data (repo demos / meta / demo health) ----------
  async listRepoDemos(): Promise<RepoDemoRow[]> {
    return cachedRead("repodemos", async () => {
      const { results } = await d1()
        .prepare(`SELECT "repo", "url", "source", "updatedAt" FROM "RepoDemo"`)
        .all<Record<string, unknown>>();
      return results.map((r) => ({
        repo: String(r.repo),
        url: String(r.url),
        source: String(r.source ?? "cloudflare"),
        updatedAt: String(r.updatedAt ?? nowIso()),
      }));
    });
  },

  async listRepoMeta(): Promise<RepoMetaRow[]> {
    return cachedRead("repometas", async () => {
      const { results } = await d1()
        .prepare(
          `SELECT "repo", "latestTag", "latestTagAt", "commitActivity", "openIssues", "fetchedAt" FROM "RepoMeta"`
        )
        .all<Record<string, unknown>>();
      return results.map((r) => ({
        repo: String(r.repo),
        latestTag: (r.latestTag as string | null) ?? null,
        latestTagAt: (r.latestTagAt as string | null) ?? null,
        commitActivity: String(r.commitActivity ?? "[]"),
        openIssues: Number(r.openIssues ?? 0),
        fetchedAt: String(r.fetchedAt ?? nowIso()),
      }));
    });
  },

  async listDemoHealth(): Promise<DemoHealthRow[]> {
    return cachedRead("demohealth", async () => {
      const { results } = await d1()
        .prepare(`SELECT "host", "ok", "latencyMs", "lastChecked" FROM "DemoHealth"`)
        .all<Record<string, unknown>>();
      return results.map((r) => ({
        host: String(r.host),
        ok: !!r.ok,
        latencyMs: Number(r.latencyMs ?? 0),
        lastChecked: String(r.lastChecked ?? nowIso()),
      }));
    });
  },

  // ---------- Admin dashboard ----------
  async adminStats(): Promise<AdminStats> {
    const database = d1();
    const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [visits, projectViews, projects, articles, messages, unread, messagesLastWeek, likeRow, comments, subscribers, topProjects, topArticles] =
      await Promise.all([
        database.prepare(`SELECT "value" FROM "SiteStat" WHERE "key" = 'visits'`).first<{ value: number }>(),
        database
          .prepare(`SELECT "value" FROM "SiteStat" WHERE "key" = 'projectViews'`)
          .first<{ value: number }>(),
        database.prepare(`SELECT COUNT(*) AS c FROM "Project"`).first<{ c: number }>(),
        database.prepare(`SELECT COUNT(*) AS c FROM "Article"`).first<{ c: number }>(),
        database.prepare(`SELECT COUNT(*) AS c FROM "ContactMessage"`).first<{ c: number }>(),
        database
          .prepare(`SELECT COUNT(*) AS c FROM "ContactMessage" WHERE "read" = 0`)
          .first<{ c: number }>(),
        database
          .prepare(`SELECT COUNT(*) AS c FROM "ContactMessage" WHERE "createdAt" >= ?`)
          .bind(weekAgoIso)
          .first<{ c: number }>(),
        database.prepare(`SELECT COALESCE(SUM("likes"), 0) AS s FROM "Article"`).first<{ s: number }>(),
        database.prepare(`SELECT COUNT(*) AS c FROM "Comment"`).first<{ c: number }>(),
        database.prepare(`SELECT COUNT(*) AS c FROM "Subscriber"`).first<{ c: number }>(),
        database
          .prepare(
            `SELECT "slug", "title", "titleEn", "icon", "views", "category"
             FROM "Project" ORDER BY "views" DESC LIMIT 5`
          )
          .all<Record<string, unknown>>(),
        database
          .prepare(
            `SELECT "slug", "title", "titleEn", "icon", "views", "likes"
             FROM "Article" ORDER BY "views" DESC LIMIT 4`
          )
          .all<Record<string, unknown>>(),
      ]);

    return {
      totals: {
        visits: visits ? Number(visits.value) : 0,
        projectViews: projectViews ? Number(projectViews.value) : 0,
        projects: Number(projects?.c ?? 0),
        articles: Number(articles?.c ?? 0),
        messages: Number(messages?.c ?? 0),
        unread: Number(unread?.c ?? 0),
        messagesLastWeek: Number(messagesLastWeek?.c ?? 0),
        likes: Number(likeRow?.s ?? 0),
        comments: Number(comments?.c ?? 0),
        subscribers: Number(subscribers?.c ?? 0),
      },
      topProjects: topProjects.results.map((r) => ({
        slug: String(r.slug),
        title: String(r.title),
        titleEn: (r.titleEn as string | null) ?? null,
        icon: String(r.icon ?? "📦"),
        views: Number(r.views ?? 0),
        category: String(r.category),
      })),
      topArticles: topArticles.results.map((r) => ({
        slug: String(r.slug),
        title: String(r.title),
        titleEn: (r.titleEn as string | null) ?? null,
        icon: String(r.icon ?? "📝"),
        views: Number(r.views ?? 0),
        likes: Number(r.likes ?? 0),
      })),
    };
  },

  async incrementRateLimit(
    key: string,
    windowStart: number,
    cleanupBefore: number
  ): Promise<number> {
    const row = await d1()
      .prepare(
        `INSERT INTO "RateLimit" ("key", "windowStart", "count") VALUES (?, ?, 1)
         ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "count" + 1
         RETURNING "count"`
      )
      .bind(key, windowStart)
      .first<{ count: number }>();
    const count = Number(row?.count ?? 1);
    if (count === 1) {
      // A new window just started → good moment to prune stale counters.
      d1()
        .prepare(`DELETE FROM "RateLimit" WHERE "windowStart" < ?`)
        .bind(cleanupBefore)
        .run()
        .catch(() => {});
    }
    return count;
  },
};
