import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function readStats() {
  const [visits, projectViews, projects, articles, messages] = await Promise.all([
    db.siteStat.findUnique({ where: { key: "visits" } }),
    db.siteStat.findUnique({ where: { key: "projectViews" } }),
    db.project.count(),
    db.article.count(),
    db.contactMessage.count(),
  ]);

  return {
    visits: visits?.value ?? 0,
    projectViews: projectViews?.value ?? 0,
    projects,
    articles,
    messages,
  };
}

export async function GET() {
  try {
    return NextResponse.json(await readStats());
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "خطا در دریافت آمار" }, { status: 500 });
  }
}

// Increment site visits (called once per session from the client)
export async function POST() {
  try {
    await db.siteStat.upsert({
      where: { key: "visits" },
      update: { value: { increment: 1 } },
      create: { key: "visits", value: 1 },
    });
    return NextResponse.json(await readStats());
  } catch (error) {
    console.error("POST /api/stats error:", error);
    return NextResponse.json({ error: "خطا در ثبت بازدید" }, { status: 500 });
  }
}
