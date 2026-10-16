import type { PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
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

type Prisma = Pick<
  PrismaClient,
  | "project"
  | "article"
  | "contactMessage"
  | "comment"
  | "subscriber"
  | "siteStat"
  | "repoSnapshot"
  | "githubSnapshot"
  | "repoDemo"
  | "repoMeta"
  | "demoHealth"
>;

const iso = (d: Date | string): string => (d instanceof Date ? d.toISOString() : String(d));

/**
 * Local/dev driver — the original Prisma logic, extracted verbatim behind the
 * DataStore contract. Dates are normalized to ISO strings so both drivers
 * return identical JSON.
 */
export function createPrismaStore(client: Prisma = db): DataStore {
  const pdb = client;

  const store: DataStore = {
    // ---------- Projects ----------
    async listProjects(opts: ListProjectsOpts): Promise<ProjectRow[]> {
      const where: {
        category?: string;
        featured?: boolean;
        OR?: Array<
          | { title: { contains: string } }
          | { description: { contains: string } }
          | { repo: { contains: string } }
          | { tags: { contains: string } }
        >;
      } = {};

      if (opts.category && opts.category !== "all") where.category = opts.category;
      if (opts.featured) where.featured = true;
      if (opts.q) {
        where.OR = [
          { title: { contains: opts.q } },
          { description: { contains: opts.q } },
          { repo: { contains: opts.q } },
          { tags: { contains: opts.q } },
        ];
      }

      const rows = await pdb.project.findMany({
        where,
        orderBy:
          opts.sort === "views"
            ? [{ views: "desc" }, { featured: "desc" }, { order: "asc" }]
            : [{ featured: "desc" }, { order: "asc" }],
      });

      return rows.map((p) => ({ ...p, createdAt: iso(p.createdAt) }));
    },

    async incrProjectViews(slug: string): Promise<number | null> {
      const found = await pdb.project.findUnique({ where: { slug }, select: { views: true } });
      if (!found) return null;
      const updated = await pdb.project.update({
        where: { slug },
        data: { views: { increment: 1 } },
        select: { views: true },
      });
      return updated.views;
    },

    async bumpProjectViewsStat(): Promise<void> {
      await pdb.siteStat.upsert({
        where: { key: "projectViews" },
        update: { value: { increment: 1 } },
        create: { key: "projectViews", value: 1 },
      });
    },

    // ---------- Articles ----------
    async listArticles(category: string): Promise<ArticleRow[]> {
      const rows = await pdb.article.findMany({
        where: category && category !== "all" ? { category } : undefined,
        orderBy: { publishedAt: "desc" },
      });
      return rows.map((a) => ({ ...a, publishedAt: iso(a.publishedAt) }));
    },

    async getArticle(slug: string): Promise<ArticleRow | null> {
      const row = await pdb.article.findUnique({ where: { slug } });
      return row ? { ...row, publishedAt: iso(row.publishedAt) } : null;
    },

    async getArticleLikes(slug: string): Promise<number | null> {
      const row = await pdb.article.findUnique({ where: { slug }, select: { likes: true } });
      return row ? row.likes : null;
    },

    async setArticleLikes(slug: string, likes: number): Promise<void> {
      await pdb.article.update({ where: { slug }, data: { likes } });
    },

    async incrArticleViews(slug: string): Promise<number | null> {
      const found = await pdb.article.findUnique({ where: { slug }, select: { views: true } });
      if (!found) return null;
      const updated = await pdb.article.update({
        where: { slug },
        data: { views: { increment: 1 } },
        select: { views: true },
      });
      return updated.views;
    },

    // ---------- Site stats ----------
    async readStats() {
      const [visits, projectViews, projects, articles, messages] = await Promise.all([
        pdb.siteStat.findUnique({ where: { key: "visits" } }),
        pdb.siteStat.findUnique({ where: { key: "projectViews" } }),
        pdb.project.count(),
        pdb.article.count(),
        pdb.contactMessage.count(),
      ]);
      return {
        visits: visits?.value ?? 0,
        projectViews: projectViews?.value ?? 0,
        projects,
        articles,
        messages,
      };
    },

    async incrVisits(): Promise<void> {
      await pdb.siteStat.upsert({
        where: { key: "visits" },
        update: { value: { increment: 1 } },
        create: { key: "visits", value: 1 },
      });
    },

    // ---------- Contact messages ----------
    async createMessage(m: {
      name: string;
      email: string;
      subject: string;
      message: string;
    }): Promise<string> {
      const saved = await pdb.contactMessage.create({ data: m });
      return saved.id;
    },

    async listMessages(opts: ListMessagesOpts) {
      const where = opts.unreadOnly ? { read: false } : {};
      const [messages, total, unread] = await Promise.all([
        pdb.contactMessage.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (opts.page - 1) * opts.pageSize,
          take: opts.pageSize,
        }),
        pdb.contactMessage.count({ where }),
        pdb.contactMessage.count({ where: { read: false } }),
      ]);
      return {
        messages: messages.map((m) => ({ ...m, createdAt: iso(m.createdAt) })),
        total,
        unread,
      };
    },

    async setMessageRead(id: string, read: boolean): Promise<ContactMessageRow | null> {
      try {
        const updated = await pdb.contactMessage.update({
          where: { id },
          data: { read },
        });
        return { ...updated, createdAt: iso(updated.createdAt) };
      } catch {
        return null;
      }
    },

    async deleteMessage(id: string): Promise<void> {
      await pdb.contactMessage.delete({ where: { id } });
    },

    // ---------- Article comments ----------
    async listComments(articleSlug: string): Promise<CommentRow[]> {
      const rows = await pdb.comment.findMany({
        where: { articleSlug },
        orderBy: { createdAt: "asc" },
        take: 200,
      });
      return rows.map((c) => ({ ...c, createdAt: iso(c.createdAt) }));
    },

    async createComment(c: {
      articleSlug: string;
      name: string;
      body: string;
    }): Promise<CommentRow> {
      const saved = await pdb.comment.create({ data: c });
      return { ...saved, createdAt: iso(saved.createdAt) };
    },

    async listAllComments(): Promise<AdminCommentRow[]> {
      const [rows, articles] = await Promise.all([
        pdb.comment.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
        pdb.article.findMany({
          select: { slug: true, title: true, titleEn: true, icon: true },
        }),
      ]);
      const bySlug = new Map(articles.map((a) => [a.slug, a]));
      return rows.map((c) => {
        const a = bySlug.get(c.articleSlug);
        return {
          ...c,
          createdAt: iso(c.createdAt),
          articleTitle: a?.title ?? c.articleSlug,
          articleTitleEn: a?.titleEn ?? null,
          articleIcon: a?.icon ?? "📝",
        };
      });
    },

    async deleteComment(id: string): Promise<boolean> {
      try {
        await pdb.comment.delete({ where: { id } });
        return true;
      } catch {
        return false;
      }
    },

    // ---------- Subscribers ----------
    async countSubscribers(): Promise<number> {
      return pdb.subscriber.count();
    },

    async subscriberExists(email: string): Promise<boolean> {
      const row = await pdb.subscriber.findUnique({ where: { email } });
      return !!row;
    },

    async addSubscriber(email: string): Promise<void> {
      await pdb.subscriber.create({ data: { email } });
    },

    async listSubscribers(): Promise<SubscriberRow[]> {
      const rows = await pdb.subscriber.findMany({
        orderBy: { createdAt: "desc" },
        select: { email: true, createdAt: true },
      });
      return rows.map((s) => ({ email: s.email, createdAt: iso(s.createdAt) }));
    },

    // ---------- GitHub snapshots ----------
    async getSnapshot(table): Promise<{ payloadJson: string; updatedAt: string } | null> {
      if (table === "RepoSnapshot") {
        const row = await pdb.repoSnapshot.findUnique({ where: { id: 1 } });
        return row ? { payloadJson: row.payloadJson, updatedAt: iso(row.updatedAt) } : null;
      }
      const row = await pdb.githubSnapshot.findUnique({ where: { id: 1 } });
      return row ? { payloadJson: row.payloadJson, updatedAt: iso(row.updatedAt) } : null;
    },

    async putSnapshot(table, payloadJson: string): Promise<void> {
      if (table === "RepoSnapshot") {
        await pdb.repoSnapshot.upsert({
          where: { id: 1 },
          update: { payloadJson },
          create: { id: 1, payloadJson },
        });
        return;
      }
      await pdb.githubSnapshot.upsert({
        where: { id: 1 },
        update: { payloadJson },
        create: { id: 1, payloadJson },
      });
    },

    // ---------- Auto-sync data (repo demos / meta / demo health) ----------
    async listRepoDemos(): Promise<RepoDemoRow[]> {
      const rows = await pdb.repoDemo.findMany({ orderBy: { repo: "asc" } });
      return rows.map((r) => ({
        repo: r.repo,
        url: r.url,
        source: r.source,
        updatedAt: iso(r.updatedAt),
      }));
    },

    async listRepoMeta(): Promise<RepoMetaRow[]> {
      const rows = await pdb.repoMeta.findMany({ orderBy: { repo: "asc" } });
      return rows.map((r) => ({
        repo: r.repo,
        latestTag: r.latestTag,
        latestTagAt: r.latestTagAt ? iso(r.latestTagAt) : null,
        commitActivity: r.commitActivity,
        openIssues: r.openIssues,
        fetchedAt: iso(r.fetchedAt),
      }));
    },

    async listDemoHealth(): Promise<DemoHealthRow[]> {
      const rows = await pdb.demoHealth.findMany({ orderBy: { host: "asc" } });
      return rows.map((r) => ({
        host: r.host,
        ok: r.ok,
        latencyMs: r.latencyMs,
        lastChecked: iso(r.lastChecked),
      }));
    },

    // ---------- Admin dashboard ----------
    async adminStats(): Promise<AdminStats> {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        visits,
        projectViews,
        projects,
        articles,
        messages,
        unread,
        messagesLastWeek,
        likeAgg,
        comments,
        subscribers,
        topProjects,
        topArticles,
      ] = await Promise.all([
        pdb.siteStat.findUnique({ where: { key: "visits" } }),
        pdb.siteStat.findUnique({ where: { key: "projectViews" } }),
        pdb.project.count(),
        pdb.article.count(),
        pdb.contactMessage.count(),
        pdb.contactMessage.count({ where: { read: false } }),
        pdb.contactMessage.count({ where: { createdAt: { gte: weekAgo } } }),
        pdb.article.aggregate({ _sum: { likes: true } }),
        pdb.comment.count(),
        pdb.subscriber.count(),
        pdb.project.findMany({
          orderBy: { views: "desc" },
          take: 5,
          select: { slug: true, title: true, titleEn: true, icon: true, views: true, category: true },
        }),
        pdb.article.findMany({
          orderBy: { views: "desc" },
          take: 4,
          select: { slug: true, title: true, titleEn: true, icon: true, views: true, likes: true },
        }),
      ]);

      return {
        totals: {
          visits: visits?.value ?? 0,
          projectViews: projectViews?.value ?? 0,
          projects,
          articles,
          messages,
          unread,
          messagesLastWeek,
          likes: likeAgg._sum.likes ?? 0,
          comments,
          subscribers,
        },
        topProjects,
        topArticles,
      };
    },
  };

  return store;
}

export const prismaStore: DataStore = createPrismaStore();

// Re-exported so route modules can keep a single import site.
export type { ContactMessageRow, ProjectRow, SubscriberRow };
