/**
 * sync-projects.ts — one-shot (idempotent) sync of the Project catalog with
 * the live GitHub repository list (/api/repos: public AND private).
 *
 * Why: the Projects view was curated before several repos were renamed on
 * GitHub and before ~16 newer repos (profile README, Obsidian tooling, Flash
 * companion tools, interactive web apps, …) existed — so Projects showed 39
 * while Repos showed 55. This script:
 *
 *   1. Updates `repo` fields of existing projects whose GitHub name changed.
 *   2. Creates Project rows for every repo still missing (bilingual curated
 *      copy; falls back to the API's merged GitHub/REPO_META descriptions).
 *   3. Back-fills empty description/descriptionEn on old rows.
 *
 * Re-runnable: every step checks current state before writing.
 *
 * Usage: bun scripts/sync-projects.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const API = "http://localhost:3000/api/repos";

type ApiRepo = {
  name: string;
  url: string;
  description: string | null;
  descriptionFa: string | null;
  language: string | null;
  topics: string[];
  isPrivate: boolean;
};

/** Existing rows whose GitHub repo was renamed — map old repo field → current name. */
const RENAMES: Record<string, string> = {
  "CheginiSoroush/VampSole": "VampSole-WebSite",
  "CheginiSoroush/StylePlus-Ecommerce": "style-plus-ecommerce-ui",
  "CheginiSoroush/Portfolio-Nebula": "portfolio-nebula-theme",
  "CheginiSoroush/ArgusVPN": "argus-vpn-landing",
  "CheginiSoroush/AuroraVPN": "aurora-vpn-landing",
  "CheginiSoroush/Telegram-Channel-Manager": "telegram-channel-manager-bot",
  "CheginiSoroush/Audio-Queue-Bot": "Audio-Queue-Telegram-Bot",
  "CheginiSoroush/Unsplash-Photos": "unsplashphotos",
};

/** Curated catalog entries for repos with no Project row yet. */
const NEW_PROJECTS: Record<
  string,
  {
    title: string;
    titleEn: string;
    category: "bots" | "web" | "3d" | "tools";
    icon: string;
    desc: string;
    descEn?: string; // falls back to the GitHub description
    fa: string;
    faEn?: string;
  }
> = {
  "ubuntu-optimizer": {
    title: "بهینه‌ساز اوبونتو",
    titleEn: "Ubuntu Optimizer",
    category: "tools",
    icon: "🐧",
    desc: "اسکریپت بهینه‌سازی اوبونتو بعد از نصب — حذف بسته‌های زائد و افزایش سرعت در یک مرحله.",
    descEn: "Post-install Ubuntu optimizer — debloat, tweaks and speed-ups in one script.",
    fa: "ubuntu-optimizer",
  },
  "cheginisoroush": {
    title: "ریپازیتوری پروفایل گیت‌هاب",
    titleEn: "GitHub Profile README",
    category: "web",
    icon: "👤",
    desc: "صفحه معرفی پروفایل گیت‌هاب — ویترین اصلی اکانت با آمار و معرفی مهارت‌ها.",
    descEn: "GitHub profile README — the landing page of this account.",
    fa: "cheginisoroush",
  },
  projdump: {
    title: "پروج‌دامپ",
    titleEn: "ProjDump",
    category: "tools",
    icon: "🧰",
    desc: "ابزار خط فرمان برای تبدیل کل یک پروژه به کانتکست آماده برای مدل‌های زبانی (ChatGPT/Claude).",
    descEn: "CLI tool that dumps a whole project into LLM-ready context for ChatGPT/Claude chats.",
    fa: "projdump",
  },
  obsidian: {
    title: "گنجینه دانش اوبسیدین",
    titleEn: "Obsidian Vault",
    category: "tools",
    icon: "💠",
    desc: "والت شخصی اوبسیدین — یادداشت‌ها و پایگاه دانش شخصی.",
    descEn: "Personal Obsidian vault — notes and knowledge base.",
    fa: "obsidian",
  },
  "obsidian-sync-scripts": {
    title: "اسکریپت‌های همگام‌سازی اوبسیدین",
    titleEn: "Obsidian Sync Scripts",
    category: "tools",
    icon: "🔄",
    desc: "یک اسکریپت Bash برای همگام‌سازی مطمئن والات اوبسیدین بین سه پلتفرم.",
    descEn: "One Bash script. Three platforms. Battle-tested Obsidian vault synchronization.",
    fa: "obsidian-sync-scripts",
  },
  "obsidian-project-quest": {
    title: "پروژه کوئست",
    titleEn: "Obsidian Project Quest",
    category: "tools",
    icon: "🦉",
    desc: "تبدیل مدیریت پروژه به بازی دوزبانه (فارسی/انگلیسی) داخل اوبسیدین با Dataview و رابط شبیه دوانگو.",
    descEn: "Turn your projects into a game! A bilingual (EN/FA) gamified task tracker inside Obsidian.",
    fa: "obsidian-project-quest",
  },
  "flash-panel": {
    title: "پنل مدیریت فلش",
    titleEn: "Flash Admin Panel",
    category: "bots",
    icon: "📊",
    desc: "پنل مدیریت پروژه Flash — کنترل آمار، کاربران و تنظیمات ربات.",
    descEn: "Admin panel of the Flash project.",
    fa: "flash-panel",
  },
  "flash-wizard": {
    title: "ویزارد راه‌اندازی فلش",
    titleEn: "Flash Setup Wizard",
    category: "bots",
    icon: "🧙",
    desc: "ویزارد تعاملی راه‌اندازی و پیکربندی پروژه Flash در چند مرحله ساده.",
    descEn: "Interactive setup wizard for the Flash project.",
    fa: "flash-wizard",
  },
  "willpower-science-amcc": {
    title: "علم اراده (aMCC)",
    titleEn: "Willpower Science (aMCC)",
    category: "web",
    icon: "🧠",
    desc: "تحلیل تعاملی و علمی از نوروساینس اراده و بخش aMCC مغز — همراه با داده‌ها و منابع.",
    descEn: "An interactive, scientific analysis of the neuroscience of willpower (aMCC).",
    fa: "willpower-science-amcc",
  },
  "overcoming-laziness-roadmap": {
    title: "نقشه راه غلبه بر تنبلی",
    titleEn: "Overcoming Laziness Roadmap",
    category: "web",
    icon: "🗺️",
    desc: "وب‌اپ تعاملی مبتنی بر روانشناسی رفتاری برای شناخت و غلبه گام‌به‌گام بر تنبلی.",
    descEn: "An interactive web app built on behavioral psychology to beat laziness step by step.",
    fa: "overcoming-laziness-roadmap",
  },
  "atomic-habits-interactive": {
    title: "عادت‌های اتمی تعاملی",
    titleEn: "Atomic Habits Interactive",
    category: "web",
    icon: "⚛️",
    desc: "شبیه‌سازی بصری روانشناسی رفتار و اثر مرکب — کشف چرخه چهار مرحله‌ای عادت و تأثیر رشد ۱٪ روزانه.",
    descEn: "A visual JavaScript simulation of behavioral psychology — the habit loop and 1% compounding.",
    fa: "atomic-habits-interactive",
  },
  "aiflash-showcase-web": {
    title: "وب‌سایت معرفی AiFlash",
    titleEn: "AiFlash Showcase Website",
    category: "web",
    icon: "🌐",
    desc: "وب‌سایت معرفی ربات هوش مصنوعی AiFlash — قابلیت‌ها، دمو و راهنمای راه‌اندازی.",
    descEn: "Showcase website for the AiFlash AI Telegram bot — features, demos and setup guides.",
    fa: "aiflash-showcase-web",
  },
  "smart-fitness-planner": {
    title: "برنامه‌ریز هوشمند تناسب اندام",
    titleEn: "Smart Fitness Planner",
    category: "web",
    icon: "🏋️",
    desc: "وب‌اپ تعاملی علوم ورزشی — برنامه تمرینی هوشمند بر پایه پژوهش‌های علمی.",
    descEn: "Interactive sports-science web app — a smart training planner built on research.",
    fa: "smart-fitness-planner",
  },
  "gemini-telegram-worker": {
    title: "ورکر تلگرام جمنای",
    titleEn: "Gemini Telegram Worker",
    category: "bots",
    icon: "🤖",
    desc: "ربات هوش مصنوعی Google Gemini مستقر روی Cloudflare Workers به‌صورت بدون سرور.",
    descEn: "Google Gemini AI bot deployed serverless on Cloudflare Workers.",
    fa: "gemini-telegram-worker",
  },
  android: {
    title: "زمین بازی اندروید",
    titleEn: "Android Playground",
    category: "tools",
    icon: "🤳",
    desc: "آزمایش‌های اندروید و زمین بازی موبایلی برای یادگیری و نمونه‌سازی.",
    descEn: "Android experiments and mobile playground.",
    fa: "android",
  },
  "soroush-website": {
    title: "وب‌سایت سروش (نسل قبلی)",
    titleEn: "Soroush Website (Legacy)",
    category: "web",
    icon: "🏛️",
    desc: "نسل قبلی imsoroush.ir — نسخه اصلی سایت شخصی، نگه‌داری‌شده به‌عنوان آرشیو.",
    descEn: "The previous generation of imsoroush.ir — original personal site, kept as archive.",
    fa: "soroush-website",
  },
};

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function main() {
  const res = await fetch(API);
  if (!res.ok) throw new Error(`/api/repos responded ${res.status}`);
  const { repos } = (await res.json()) as { repos: ApiRepo[] };
  const byName = new Map(repos.map((r) => [r.name.toLowerCase(), r]));

  let renamed = 0;
  for (const [oldRepo, newName] of Object.entries(RENAMES)) {
    const current = `CheginiSoroush/${newName}`;
    if (!byName.has(newName.toLowerCase())) continue; // rename target must exist on GitHub
    const row = await db.project.findFirst({ where: { repo: oldRepo } });
    if (row && row.repo !== current) {
      await db.project.update({ where: { id: row.id }, data: { repo: current } });
      renamed++;
      console.log(`renamed: ${row.slug}  ${oldRepo} → ${current}`);
    }
  }

  const projects = await db.project.findMany();
  const covered = new Set(projects.map((p) => p.repo.split("/").pop()!.toLowerCase()));
  const maxOrder = projects.reduce((m, p) => Math.max(m, p.order), 0);

  let created = 0;
  let order = maxOrder;
  for (const repo of repos) {
    const key = repo.name.toLowerCase();
    if (covered.has(key)) {
      // back-fill missing bilingual copy on old rows
      const own = projects.find((p) => p.repo.split("/").pop()!.toLowerCase() === key)!;
      const patch: Record<string, string> = {};
      if (!own.descriptionEn && repo.description) patch.descriptionEn = repo.description;
      if (!own.description && repo.descriptionFa) patch.description = repo.descriptionFa;
      if (Object.keys(patch).length) {
        await db.project.update({ where: { id: own.id }, data: patch });
        console.log(`back-filled copy: ${own.slug}`);
      }
      continue;
    }
    const meta = NEW_PROJECTS[key];
    if (!meta) {
      console.warn(`⚠ no curated entry for repo "${repo.name}" — skipped`);
      continue;
    }
    order += 1;
    const tags = repo.topics.slice(0, 4);
    await db.project.create({
      data: {
        slug: slugify(repo.name),
        title: meta.title,
        titleEn: meta.titleEn,
        repo: `CheginiSoroush/${repo.name}`,
        description: meta.fa || repo.descriptionFa || repo.description || meta.title,
        descriptionEn: repo.description || meta.descEn || meta.titleEn,
        category: meta.category,
        tags: JSON.stringify(tags),
        icon: meta.icon,
        featured: false,
        order,
      },
    });
    created++;
    console.log(`created: ${slugify(repo.name)}  (${meta.category}, ${meta.icon})`);
  }

  const total = await db.project.count();
  console.log(`\ndone — renamed ${renamed}, created ${created}, total projects: ${total}`);
  if (total !== repos.length) {
    console.warn(`⚠ coverage mismatch: repos=${repos.length} projects=${total}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
