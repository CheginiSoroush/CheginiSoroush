import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function isAdminRequest(request: NextRequest): boolean {
  const expected = process.env.ADMIN_KEY || "imsoroush-admin";
  const provided = request.headers.get("x-admin-key") ?? "";
  return provided.length > 0 && provided === expected;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      visits,
      projectViews,
      projects,
      articles,
      messages,
      unread,
      messagesLastWeek,
      likeSum,
      comments,
      subscribers,
      topProjects,
      topArticles,
    ] = await Promise.all([
      db.siteStat.findUnique({ where: { key: "visits" } }),
      db.siteStat.findUnique({ where: { key: "projectViews" } }),
      db.project.count(),
      db.article.count(),
      db.contactMessage.count(),
      db.contactMessage.count({ where: { read: false } }),
      db.contactMessage.count({ where: { createdAt: { gte: weekAgo } } }),
      db.article.aggregate({ _sum: { likes: true } }),
      db.comment.count(),
      db.subscriber.count(),
      db.project.findMany({
        orderBy: { views: "desc" },
        take: 5,
        select: { slug: true, title: true, icon: true, views: true, category: true },
      }),
      db.article.findMany({
        orderBy: { views: "desc" },
        take: 4,
        select: { slug: true, title: true, icon: true, views: true, likes: true },
      }),
    ]);

    return NextResponse.json({
      totals: {
        visits: visits?.value ?? 0,
        projectViews: projectViews?.value ?? 0,
        projects,
        articles,
        messages,
        unread,
        messagesLastWeek,
        likes: likeSum._sum.likes ?? 0,
        comments,
        subscribers,
      },
      topProjects,
      topArticles,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "خطا در دریافت آمار" }, { status: 500 });
  }
}
