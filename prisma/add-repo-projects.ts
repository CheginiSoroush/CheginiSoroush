/**
 * One-off content sync (Task 40): inserts the 6 flagship public repos that
 * were missing from the Projects catalog, with bilingual descriptions
 * sourced from each repo's README, plus their GitHub Pages demo URL.
 * Idempotent — upserts on slug, safe to re-run.
 *
 * Run:  bun prisma/add-repo-projects.ts
 */
import { Database } from "bun:sqlite";
import { join } from "node:path";

const dbPath = join(import.meta.dir, "..", "db", "custom.db");
const db = new Database(dbPath);

type NewProject = {
  slug: string;
  title: string;
  titleEn: string;
  repo: string;
  demoUrl: string | null;
  description: string;
  descriptionEn: string;
  tags: string[];
  icon: string;
  featured: boolean;
};

const NEW_PROJECTS: NewProject[] = [
  {
    slug: "ubuntu-optimizer",
    title: "بهینه‌ساز اوبونتو",
    titleEn: "Ubuntu Optimizer & Fixer",
    repo: "CheginiSoroush/ubuntu-optimizer",
    demoUrl: "https://cheginisoroush.github.io/ubuntu-optimizer/",
    description:
      "جعبه‌ابزار همه‌کاره‌ی بهینه‌سازی، مدیریت اپلیکیشن و تعمیر اوبونتو — ۲۳ ابزار منوی تعاملی، بیش از ۶۰ گزینه‌ی CLI، پیش‌نمایش dry-run صادقانه و برگرداندن تغییرات با یک دستور. پروفایل آماده برای لپ‌تاپ و سرور، گزارش سیستمی JSON و نصب هوشمند tar.gz با تشخیص خودکار وابستگی‌ها.",
    descriptionEn:
      "All-in-one Ubuntu optimization, app-management and repair toolkit — 23 interactive menu tools, 60+ CLI options, honest dry-run previews and one-command undo. Ships laptop/server profiles, a machine-readable JSON system report, and smart tar.gz installs with automatic dependency resolution.",
    tags: ["Bash", "CLI", "System Tools", "ShellCheck"],
    icon: "🐧",
    featured: true,
  },
  {
    slug: "projdump",
    title: "پراج‌دامپ — کانتکست آماده هوش مصنوعی",
    titleEn: "projdump — LLM-ready codebase dumps",
    repo: "CheginiSoroush/projdump",
    demoUrl: "https://cheginisoroush.github.io/projdump/",
    description:
      "کل کدبیس — درخت پروژه، سورس‌ها و آمار — را در یک فایل Markdown/XML/JSON هم‌اندازه‌ی بودجه‌ی توکن مدل می‌ریزد تا مستقیم به Claude و ChatGPT و Gemini بدهی. صددرصد لوکال و بدون وابستگی جز Bash؛ اسکنر دسته‌ای نسخه ۲، ۷ تا ۲۵ برابر سریع‌تر است.",
    descriptionEn:
      "Dumps an entire codebase — directory tree, sources and stats — into a single Markdown, XML or JSON file sized to your token budget, ready to paste into Claude, ChatGPT, DeepSeek or Gemini. 100% local, no dependencies beyond bash; the v2 batch scanner is 7–25× faster.",
    tags: ["Bash", "CLI", "LLM", "Developer Tools"],
    icon: "📦",
    featured: true,
  },
  {
    slug: "flash-panel",
    title: "فلش پنل",
    titleEn: "Flash Panel",
    repo: "CheginiSoroush/flash-panel",
    demoUrl: "https://cheginisoroush.github.io/flash-panel/",
    description:
      "پنل پراکسی پرسرعت و بدون‌سرور برای Cloudflare Workers — VLESS و Trojan و WARP با هسته‌ی کاملاً بازنویسی‌شده (پارس بدون کپی، کش احراز هویت، جلوگیری از stampede)، اشتراک‌های ۹۴٪ کوچک‌تر با ETag، محدودسازی ورود و کنترل کامل با ربات تلگرام.",
    descriptionEn:
      "High-performance serverless proxy panel for Cloudflare Workers — VLESS, Trojan and WARP with a rewritten protocol core (zero-copy parsing, cached auth, anti-stampede KV cache), ETag subscriptions 94% smaller, login rate-limiting and full Telegram-bot control.",
    tags: ["TypeScript", "Cloudflare Workers", "VLESS", "Telegram Bot"],
    icon: "⚡",
    featured: false,
  },
  {
    slug: "flash-wizard",
    title: "فلش ویزارد",
    titleEn: "Flash Wizard",
    repo: "CheginiSoroush/flash-wizard",
    demoUrl: "https://cheginisoroush.github.io/flash-wizard/",
    description:
      "ویزارد نصب یک‌کلیکی Flash Panel داخل مرورگر — ساخت KV، آپلود ورکر و اتصال دامنه‌ی اختصاصی در حدود ۶۰ ثانیه. توکن API هرگز از مرورگر خارج نمی‌شود و رابط فارسی راست‌چین دارد.",
    descriptionEn:
      "Browser-based one-click deployment wizard for Flash Panel — creates KV storage, uploads the worker and attaches your custom domain in about 60 seconds. Your API token never leaves the browser; Persian RTL interface built in.",
    tags: ["JavaScript", "Cloudflare API", "Browser"],
    icon: "🪄",
    featured: false,
  },
  {
    slug: "obsidian-project-quest",
    title: "پروژه کوئست اوبسیدین — پروژه‌هات را بازی کن",
    titleEn: "Obsidian Project Quest",
    repo: "CheginiSoroush/obsidian-project-quest",
    demoUrl: "https://cheginisoroush.github.io/obsidian-project-quest/",
    description:
      "ولت آماده‌ی اوبسیدین به سبک دولینگو که کار کردن روی پروژه‌ها را بازی می‌کند — XP، سطح، استریک، ۱۸ نشان خودکار، بورد کانبان و داشبوردهای زنده؛ کاملاً لوکال روی فایل‌های Markdown و دوزبانه (فارسی/انگلیسی) با چک‌لیست لانچ ۴۰+ مرحله‌ای برای هر پروژه.",
    descriptionEn:
      "A ready-to-use Duolingo-style Obsidian vault that turns real project work into a game — XP, levels, streaks, 18 auto-unlocking badges, Kanban boards and live charts; 100% local on plain Markdown, fully bilingual (EN/FA) with a 40+ item launch checklist for every new project.",
    tags: ["Obsidian", "Dataview", "Gamification", "Bilingual"],
    icon: "🦉",
    featured: false,
  },
  {
    slug: "obsidian-sync-scripts",
    title: "اسکریپت‌های سینک اوبسیدین",
    titleEn: "Obsidian Sync Scripts (ob-sync)",
    repo: "CheginiSoroush/obsidian-sync-scripts",
    demoUrl: "https://cheginisoroush.github.io/obsidian-sync-scripts/",
    description:
      "همگام‌سازی جاافتاده‌ی Obsidian با گیت‌هاب از طریق یک اسکریپت Bash برای سه پلتفرم — گیت خودترمیم، تایم‌اوت روی هر عملیات ریموت، بکاپ تأییدشده با SHA-256 قبل از هر تغییر مخرب و ترمیم اتمیک دوفازی؛ ساخته‌شده برای محیط خصمانه‌ی حافظه‌ی اشتراکی اندروید (Termux) و به‌ همان خوبی روی لینوکس و مک.",
    descriptionEn:
      "Battle-hardened Obsidian ↔ GitHub sync in one Bash script across three platforms — self-healing git, watchdog timeouts on every remote call, SHA-256 verified backups before any mutation, and atomic two-phase repair; engineered for Android's hostile shared storage (Termux) and equally at home on Linux and macOS.",
    tags: ["Bash", "Git", "Termux", "Backup"],
    icon: "🔄",
    featured: false,
  },
];

const maxOrder = (db.prepare(`SELECT MAX("order") AS m FROM Project`).get() as { m: number | null }).m ?? -1;
let order = maxOrder + 1;
const now = Date.now();
let inserted = 0;
let updated = 0;

const stmt = db.prepare(`
  INSERT INTO Project ("id", "slug", "title", "titleEn", "repo", "demoUrl", "description", "descriptionEn", "category", "tags", "icon", "featured", "views", "order", "createdAt")
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'tools', ?, ?, ?, 0, ?, ?)
  ON CONFLICT("slug") DO UPDATE SET
    "title" = excluded."title",
    "titleEn" = excluded."titleEn",
    "repo" = excluded."repo",
    "demoUrl" = excluded."demoUrl",
    "description" = excluded."description",
    "descriptionEn" = excluded."descriptionEn",
    "tags" = excluded."tags",
    "icon" = excluded."icon",
    "featured" = excluded."featured",
    "order" = excluded."order"
`);

for (const p of NEW_PROJECTS) {
  const existing = db.prepare(`SELECT id FROM Project WHERE slug = ?`).get(p.slug) as { id: string } | null;
  const id = existing?.id ?? `cmr${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  stmt.run(
    id,
    p.slug,
    p.title,
    p.titleEn,
    p.repo,
    p.demoUrl,
    p.description,
    p.descriptionEn,
    JSON.stringify(p.tags),
    p.icon,
    p.featured ? 1 : 0,
    order++,
    now
  );
  if (existing) updated++; else inserted++;
}

const total = (db.prepare(`SELECT COUNT(*) AS c FROM Project`).get() as { c: number }).c;
console.log(`done: ${inserted} inserted, ${updated} updated, total projects = ${total}`);
db.close();
