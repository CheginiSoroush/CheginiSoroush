-- d1-fa-autocards.sql — Persian backfill for the untranslated Project cards.
--
-- Background: 15 cards had title = titleEn and description = descriptionEn
-- (English on both fields), so in FA mode the UI showed English text — e.g.
-- the Ubuntu Optimizer card stayed English after switching the site to فارسی.
--   * 14 are auto-synced cards (order >= 1000, created by scripts/auto-sync.ts
--     from GitHub repo metadata),
--   * 1 is "ubuntu-optimizer" (order 0) whose row reached production with an
--     English placeholder before prisma/add-repo-projects.ts content landed.
-- 6 of them (ubuntu-optimizer, projdump, flash-panel, flash-wizard,
-- obsidian-project-quest, obsidian-sync-scripts) already had owner-grade
-- bilingual copy written in prisma/add-repo-projects.ts (Task 40) — that copy
-- is used here; the Persian texts were verified alive on GitHub Pages.
--
-- This script is IDEMPOTENT and NON-DESTRUCTIVE:
--   * content UPDATE only fires while "title" = "titleEn" (still untranslated)
--     — once Persian is in place it never touches the row again,
--   * icon fixes only fire while the icon still equals the known-bad value,
--   * demoUrl fills only fire while "demoUrl" IS NULL (never overwrites),
--   * titleEn / descriptionEn are NEVER modified.
-- Safe to run on every deploy; self-heals a card if the sync ever recreates
-- it in English.

-- ── 1) Persian titles + descriptions (copy from add-repo-projects.ts) ────

UPDATE "Project" SET
  "title" = 'بهینه‌ساز اوبونتو',
  "description" = 'جعبه‌ابزار همه‌کاره‌ی بهینه‌سازی، مدیریت اپلیکیشن و تعمیر اوبونتو — ۲۳ ابزار منوی تعاملی، بیش از ۶۰ گزینه‌ی CLI، پیش‌نمایش dry-run صادقانه و برگرداندن تغییرات با یک دستور. پروفایل آماده برای لپ‌تاپ و سرور، گزارش سیستمی JSON و نصب هوشمند tar.gz با تشخیص خودکار وابستگی‌ها.'
WHERE "slug" = 'ubuntu-optimizer' AND "title" = "titleEn";

UPDATE "Project" SET
  "title" = 'پراج‌دامپ — کانتکست آماده هوش مصنوعی',
  "description" = 'کل کدبیس — درخت پروژه، سورس‌ها و آمار — را در یک فایل Markdown/XML/JSON هم‌اندازه‌ی بودجه‌ی توکن مدل می‌ریزد تا مستقیم به Claude و ChatGPT و Gemini بدهی. صددرصد لوکال و بدون وابستگی جز Bash؛ اسکنر دسته‌ای نسخه ۲، ۷ تا ۲۵ برابر سریع‌تر است.'
WHERE "slug" = 'projdump' AND "title" = "titleEn";

UPDATE "Project" SET
  "title" = 'فلش پنل',
  "description" = 'پنل پراکسی پرسرعت و بدون‌سرور برای Cloudflare Workers — VLESS و Trojan و WARP با هسته‌ی کاملاً بازنویسی‌شده (پارس بدون کپی، کش احراز هویت، جلوگیری از stampede)، اشتراک‌های ۹۴٪ کوچک‌تر با ETag، محدودسازی ورود و کنترل کامل با ربات تلگرام.'
WHERE "slug" = 'flash-panel' AND "title" = "titleEn";

UPDATE "Project" SET
  "title" = 'فلش ویزارد',
  "description" = 'ویزارد نصب یک‌کلیکی Flash Panel داخل مرورگر — ساخت KV، آپلود ورکر و اتصال دامنه‌ی اختصاصی در حدود ۶۰ ثانیه. توکن API هرگز از مرورگر خارج نمی‌شود و رابط فارسی راست‌چین دارد.'
WHERE "slug" = 'flash-wizard' AND "title" = "titleEn";

UPDATE "Project" SET
  "title" = 'پروژه کوئست اوبسیدین — پروژه‌هات را بازی کن',
  "description" = 'ولت آماده‌ی اوبسیدین به سبک دولینگو که کار کردن روی پروژه‌ها را بازی می‌کند — XP، سطح، استریک، ۱۸ نشان خودکار، بورد کانبان و داشبوردهای زنده؛ کاملاً لوکال روی فایل‌های Markdown و دوزبانه (فارسی/انگلیسی) با چک‌لیست لانچ ۴۰+ مرحله‌ای برای هر پروژه.'
WHERE "slug" = 'obsidian-project-quest' AND "title" = "titleEn";

UPDATE "Project" SET
  "title" = 'اسکریپت‌های سینک اوبسیدین',
  "description" = 'همگام‌سازی جاافتاده‌ی Obsidian با گیت‌هاب از طریق یک اسکریپت Bash برای سه پلتفرم — گیت خودترمیم، تایم‌اوت روی هر عملیات ریموت، بکاپ تأییدشده با SHA-256 قبل از هر تغییر مخرب و ترمیم اتمیک دوفازی؛ ساخته‌شده برای محیط خصمانه‌ی حافظه‌ی اشتراکی اندروید (Termux) و به‌ همان خوبی روی لینوکس و مک.'
WHERE "slug" = 'obsidian-sync-scripts' AND "title" = "titleEn";

-- ── 2) Persian titles + descriptions (new translations) ─────────────────

UPDATE "Project" SET
  "title" = 'پروفایل گیت‌هاب',
  "description" = 'ری‌دمی پروفایل گیت‌هاب — صفحهٔ اصلی و شناسنامهٔ این اکانت.'
WHERE "slug" = 'cheginisoroush' AND "title" = "titleEn";

UPDATE "Project" SET
  "title" = 'خزانهٔ Obsidian',
  "description" = 'خزانهٔ (Vault) آمادهٔ Obsidian برای سازمان‌دهی یادداشت‌ها و پروژه‌ها — پروژه‌ای متن‌باز از سروش چگینی.'
WHERE "slug" = 'obsidian-vault' AND "title" = "titleEn";

UPDATE "Project" SET
  "title" = 'علم اراده (aMCC)',
  "description" = 'تحلیلی تعاملی و علمی از عصب‌شناسی اراده — داشبوردی برای قشر میانی‌جلویی قدامی (aMCC) در تقابل با ذهنیت سختِ دیوید گوگینز.'
WHERE "slug" = 'willpower-science-amcc' AND "title" = "titleEn";

UPDATE "Project" SET
  "title" = 'نقشهٔ راه غلبه بر تنبلی',
  "description" = 'وب‌اپ تعاملی بر پایهٔ روان‌شناسی رفتاری و مهندسی عادت — برنامهٔ ۳۰ روزهٔ غلبه بر تنبلی با محوریت قانون دو دقیقه.'
WHERE "slug" = 'overcoming-laziness-roadmap' AND "title" = "titleEn";

UPDATE "Project" SET
  "title" = 'عادت‌های اتمی تعاملی',
  "description" = 'شبیه‌سازی تصویری جاوااسکریپتی از روان‌شناسی رفتاری و اثر مرکب — کاووش حلقهٔ چهارمرحله‌ای عادت و تأثیر رشد روزانهٔ ۱٪.'
WHERE "slug" = 'atomic-habits-interactive' AND "title" = "titleEn";

UPDATE "Project" SET
  "title" = 'مربی هوشمند تناسب اندام',
  "description" = 'وب‌اپ تعاملی علم ورزش — مناظرهٔ تکرار بالا یا تکرار کم در وزنه‌زدن، به زبان تصویر.'
WHERE "slug" = 'smart-fitness-planner' AND "title" = "titleEn";

UPDATE "Project" SET
  "title" = 'ربات Gemini روی Cloudflare Workers',
  "description" = 'ربات هوش مصنوعی Google Gemini روی Cloudflare Workers — سرورلس و دوستدار پلن رایگان.'
WHERE "slug" = 'gemini-telegram-worker' AND "title" = "titleEn";

UPDATE "Project" SET
  "title" = 'زمین بازی اندروید',
  "description" = 'آزمایش‌ها و زمین بازی موبایل اندروید.'
WHERE "slug" = 'android' AND "title" = "titleEn";

UPDATE "Project" SET
  "title" = 'وب‌سایت پیشین سروش',
  "description" = 'نسل پیشین imsoroush.ir — وب‌سایت شخصی استاتیکِ نخست.'
WHERE "slug" = 'soroush-website' AND "title" = "titleEn";

-- ── 3) Demo URLs (GitHub Pages, HEAD-verified 200 on 2026-04) — fill only
--       when the card has no demo at all ──────────────────────────────────

UPDATE "Project" SET "demoUrl" = 'https://cheginisoroush.github.io/ubuntu-optimizer/'
WHERE "slug" = 'ubuntu-optimizer' AND "demoUrl" IS NULL;

UPDATE "Project" SET "demoUrl" = 'https://cheginisoroush.github.io/projdump/'
WHERE "slug" = 'projdump' AND "demoUrl" IS NULL;

UPDATE "Project" SET "demoUrl" = 'https://cheginisoroush.github.io/flash-panel/'
WHERE "slug" = 'flash-panel' AND "demoUrl" IS NULL;

UPDATE "Project" SET "demoUrl" = 'https://cheginisoroush.github.io/flash-wizard/'
WHERE "slug" = 'flash-wizard' AND "demoUrl" IS NULL;

UPDATE "Project" SET "demoUrl" = 'https://cheginisoroush.github.io/obsidian-project-quest/'
WHERE "slug" = 'obsidian-project-quest' AND "demoUrl" IS NULL;

UPDATE "Project" SET "demoUrl" = 'https://cheginisoroush.github.io/obsidian-sync-scripts/'
WHERE "slug" = 'obsidian-sync-scripts' AND "demoUrl" IS NULL;

-- ── 4) Icon fixes (auto-classifier picked wrong emoji) ──────────────────

UPDATE "Project" SET "icon" = '📦' WHERE "slug" = 'projdump'              AND "icon" = '🗃️';
UPDATE "Project" SET "icon" = '⚡' WHERE "slug" = 'flash-panel'           AND "icon" = '🧯';
UPDATE "Project" SET "icon" = '🪄' WHERE "slug" = 'flash-wizard'          AND "icon" = '📷';
UPDATE "Project" SET "icon" = '🦉' WHERE "slug" = 'obsidian-project-quest' AND "icon" = '👗';
UPDATE "Project" SET "icon" = '🔄' WHERE "slug" = 'obsidian-sync-scripts' AND "icon" = '🐧';
UPDATE "Project" SET "icon" = '💪' WHERE "slug" = 'smart-fitness-planner' AND "icon" = '🧠';
UPDATE "Project" SET "icon" = '📱' WHERE "slug" = 'android'               AND "icon" = '🌐';
