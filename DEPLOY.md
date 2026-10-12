# استقرار سایت روی Cloudflare — راهنمای گام‌به‌گام

این سند نحوهٔ انتشار نسخهٔ Next.js سایت شخصی (imsoroush.ir) روی Cloudflare را توضیح می‌دهد.
وضعیت فعلی: سایت روی Cloudflare با دامنهٔ `imsoroush.ir` متصل است و نسخهٔ قدیمی استاتیک (HTML خالص) را سرو می‌کند. برای انتشار نسخهٔ جدید Next.js یکی از دو مسیر زیر را انتخاب کنید.

---

## گزینهٔ ۱ — Cloudflare Workers با OpenNext (توصیه‌شده)

ادپتر رسمی OpenNext از App Router، مسیرهای API و OpenGraph پویا پشتیبانی می‌کند.

### ۱. نصب ابزارها

```bash
bun add -D @opennextjs/cloudflare wrangler
```

### ۲. ساخت فایل `wrangler.jsonc` در ریشهٔ پروژه

```jsonc
{
  "name": "imsoroush",
  "main": ".open-next/worker.js",
  "compatibility_date": "2025-03-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "vars": {
    "ADMIN_KEY": "CHANGE_ME_admin_key",
    "GITHUB_TOKEN": "CHANGE_ME_github_token"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "imsoroush-db",
      "database_id": "<بعد از ساخت در داشبورد پر می‌شود>"
    }
  ]
}
```

### ۳. مهاجرت دیتابیس SQLite به D1

پروژه فعلی از Prisma + SQLite (`db/custom.db`) استفاده می‌کند. دو راه دارید:

**راه سریع (توصیه‌شده برای همین پروژه):** چون دیتابیس فقط چند جدول ساده دارد، اسکیمای D1 را دستی بسازید:

```bash
# ساخت دیتابیس D1
wrangler d1 create imsoroush-db

# اجرای مایگریشن — فایل sql زیر را از روی prisma/schema.prisma تولید کنید
wrangler d1 execute imsoroush-db --remote --file=./prisma/d1-schema.sql
```

سپس در کد، به‌جای Prisma از `env.DB` (binding دیتابیس D1) با کوئری‌های خام یا Drizzle D1 استفاده کنید. تمام کوئری‌های پروژه ساده‌اند (SELECT/INSERT/UPDATE/COUNT) و مهاجرت مستقیم دارند.

**راه دوم:** استفاده از Prisma با `@prisma/adapter-wasm` + D1 — سنگین‌تر اما بدون تغییر کوئری‌ها.

### ۴. بیلد و دیپلوی

```bash
bunx opennextjs-cloudflare build
bunx wrangler deploy
```

### ۵. اتصال دامنهٔ imsoroush.ir

- داشبورد Cloudflare → Workers & Pages → `imsoroush` → Settings → Domains & Routes
- Custom Domain را روی `imsoroush.ir` و `www.imsoroush.ir` تنظیم کنید
- رکوردهای DNS قبلی که به Pages/Worker نسخهٔ استاتیک اشاره می‌کنند را حذف یا به Worker جدید تغییر دهید

### ۶. تنظیم Secrets (امن‌تر از vars)

```bash
wrangler secret put ADMIN_KEY
wrangler secret put GITHUB_TOKEN
```

> نکته: `ADMIN_KEY` فعلی در `.env` نگه‌داری شده — همین مقدار را در Secret بگذارید تا پنل مدیریت بعد از دیپلوی هم کار کند.

---

## گزینهٔ ۲ — Cloudflare Pages با next-on-pages (ساده‌تر، محدودتر)

سریع‌تر راه می‌افتد اما بعضی قابلیت‌های Edge Runtime را باید تک‌تک فعال کنید.

### ۱. نصب و بیلد

```bash
bun add -D @cloudflare/next-on-pages wrangler
bunx next-on-pages
```

در تمام فایل‌های `route.ts` و `opengraph-image.tsx` این خط را بالای فایل اضافه کنید:

```ts
export const runtime = "edge";
```

### ۲. دیپلوی

```bash
bunx wrangler pages deploy .vercel/output/static --project-name imsoroush
```

یا از طریق Git integration: داشبورد → Pages → Create project → Connect to Git →
Build command: `bunx next-on-pages` — Output directory: `.vercel/output/static`

### ۳. متغیرهای محیطی

داشبورد Pages → Settings → Environment variables:

| کل | مقدار |
|---|---|
| `ADMIN_KEY` | کلید پنل مدیریت |
| `GITHUB_TOKEN` | توکن گیت‌هاب برای آمار زنده |

---

## چک‌لیست پس از استقرار

- [ ] صفحهٔ اصلی (`/`) و چهار نما (#projects / #writing / #contact) بالا می‌آیند
- [ ] `POST /api/stats` شمارندهٔ بازدید را افزایش می‌دهد
- [ ] کارت گیت‌هاب دادهٔ زنده نشان می‌دهد (توکن معتبر)
- [ ] فرم تماس پیام را در D1 ذخیره می‌کند
- [ ] پنل مدیریت (قفل فوتر) با ADMIN_KEY باز می‌شود
- [ ] `opengraph-image` تصویر OG را برمی‌گرداند (برای پیش‌نمایش لینک در تلگرام/توییتر)
- [ ] `sitemap.xml` و `robots.txt` در دسترس‌اند
- [ ] Lighthouse موبایل بالای ۹۰

## نکات مهم

1. **دیتابیس:** Prisma روی Workers با SQLite محلی کار نمی‌کند؛ مسیر عملی D1 + Drizzle است (کوئری‌ها ساده‌اند).
2. **OG Image:** `next/og` روی edge runtime کار می‌کند اما حجم باندل را چک کنید.
3. **کش:** کارت گیت‌هاب کش ۱۰ دقیقه‌ای در حافظهٔ Worker دارد — در محیط چند-instance شدن، هر instance کش خودش را می‌سازد (اشکالی ندارد).
4. **نسخهٔ قدیمی سایت:** قبل از سوییچ دامنه، از فایل‌های نسخهٔ استاتیک فعلی بکاپ بگیرید (`wrangler pages download` یا clone از repo).
