# استقرار خودکار روی Cloudflare Workers — راهنما

> **وضعیت فعلی:** استقرار **کاملاً خودکار** شده است. زیرساخت (OpenNext + D1 + CI) از قبل در ریپو تنظیم و بازبینی شده — سازگاری OpenNext با Next.js 16 به‌صورت رسمی تأیید شده است. فقط یک بار دو Secret باید در گیت‌هاب اضافه شود. بعد از آن، **هر push به `main` یعنی دیپلوی خودکار**.
>
> اجزای آماده: `wrangler.jsonc` (Worker با binding دیتابیس D1) · `open-next.config.ts` · دو-درایور `src/lib/store/` (لوکال Prisma / پروداکشن D1) · `prisma/d1-schema.sql` + `prisma/d1-seed.sql` (مایگریشن و محتوا، هر دو idempotent) · `deploy/github-actions-deploy.yml` (workflow دیپلوی).

---

## چرا سایت هنوز قدیمی است؟

`imsoroush.ir` هنوز **نسخهٔ استاتیک قدیمی** را سرو می‌کند، چون نسخهٔ Next.js هرگز روی Cloudflare مستقر نشده بود. کد سایت سالم است (لокال و پیش‌نمایش درست کار می‌کند) — مشکل فقط استقرار بود.

Workers نمی‌تواند فایل SQLite محلی (`db/custom.db`) را بخواند، بنابراین:

- داده‌ها به **Cloudflare D1** (SQLite سازگار) منتقل شده‌اند — `prisma/d1-schema.sql` + `prisma/d1-seed.sql`
- کد به‌صورت **دو-درایوری** بازنویسی شده: لوکال همان Prisma قبلی (`src/lib/store/prisma-store.ts`)، پروداکشن D1 (`src/lib/store/d1-store.ts`) — انتخاب خودکار با تشخیص زمان اجرا (`src/lib/store/index.ts`)
- پس از هر دیپلوی، اسکیما و محتوا **idempotent** به D1 اعمال می‌شود (محتوای جدید خودکار می‌آید؛ آمار/لایک‌های پروداکشن دست نمی‌خورد)

---

## راه‌اندازی یک‌باره (تنها کار دستی شما)

۱. یک API Token در Cloudflare بسازید:
   [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) → **Create Token** → قالب **"Edit Cloudflare Workers"** (شامل دسترسی D1 هم هست) → Create.

۲. Account ID را از داشبورد Cloudflare (سمت راست صفحهٔ اصلی) کپی کنید.

   > دامنهٔ `imsoroush.ir` را می‌توانید همین‌جا به اکانت اضافه کنید (Add a Site) تا مرحلهٔ اتصال دامنه در پایین بدون دردسر پیش برود.

۳. در گیت‌هاب: `CheginiSoroush/CheginiSoroush` → **Settings → Secrets and variables → Actions → New repository secret** و این دو را اضافه کنید:

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | توکن ساخت‌شده در مرحلهٔ ۱ |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID مرحلهٔ ۲ |

۴. (اختیاری اما توصیه‌شده) دو Secret دیگر:

| Name | توضیح |
|---|---|
| `ADMIN_KEY` | کلید پنل مدیریت (اگر نباشد مقدار پیش‌فرض استفاده می‌شود) |
| `GH_PAT` | توکن گیت‌هاب برای آمار زنده و **ریپوهای خصوصی** (`/api/github` و `/api/repos`) |

۵. **فعال‌سازی اکشن دیپلوی (یک بار):** توکن فعلی اجازهٔ push فایل زیر `.github/workflows` را ندارد؛ پس فایل [`deploy/github-actions-deploy.yml`](deploy/github-actions-deploy.yml) را دستی نصب کنید:
   در گیت‌هاب → تب **Actions** → «set up a workflow yourself» → کل محتوای فایل بالا را کپی و به‌عنوان `.github/workflows/deploy.yml` ذخیره کنید.

   > این workflow فقط یک **پوستهٔ نازک** است؛ تمام منطق دیپلوی در [`deploy/ci-deploy.sh`](deploy/ci-deploy.sh) است که با push عادی آپدیت می‌شود — یعنی اصلاحات بعدی بدون نیاز به کپی-پیست مجدد از سمت شما اعمال می‌شوند.

۶. تمام! اکشن **«Deploy to Cloudflare Workers»** حالا (یا با push بعدی) اجرا می‌شود:
   ساخت D1 → مایگریشن + Seed → Build با OpenNext → `wrangler deploy` → تنظیم Secrets.

---

## عیب‌یابی

**خطای «Could not resolve D1 database id» (ران‌های قدیمی):** توکن Cloudflare دسترسی D1 ندارد یا Account ID اشتباه است. workflow جدید هر دو را شفاف بررسی می‌کند؛ فقط مطمئن شوید توکن این دسترسی را دارد:
   داشبورد Cloudflare → profile/api-tokens → توکن را ویرایش کنید → **Add permission: Account → D1 → Edit** → Save.
   (اگر Account ID غلط باشد، لاگ اکشن لیست اکانت‌های قابل‌دسترس را نشان می‌دهد.)

**خطا در مرحلهٔ Build (OpenNext):** آخرین کامیت ریپو را ببینید؛ منطق Build داخل `deploy/ci-deploy.sh` است و رفعش فقط یک push عادی است — نیازی به ویرایش workflow نیست.

**ورکر قدیمی روی همان اکانت دارید؟** مشکلی نیست؛ اگر اسمش `imsoroush` باشد جایگزین می‌شود و اگر اسم دیگری دارد، هر دو با هم می‌مانند تا سوییچ دامنه.

---

## اتصال دامنهٔ imsoroush.ir (یک بار)

داشبورد Cloudflare → **Workers & Pages** → `imsoroush` → **Settings → Domains & Routes** → **Add Custom Domain** → `imsoroush.ir` (و `www.imsoroush.ir`). چون دامنه روی همان اکانت است، DNS خودکار تنظیم می‌شود.

> نسخهٔ قدیمی استاتیک سایت قبل از سوییچ دامنه دست‌نخورده باقی می‌ماند؛ سوییچ یعنی فقط رکورد دامنه به Worker جدید اشاره کند.

---

## چک‌لیست پس از اولین دیپلوی

- [ ] اکشن گیت‌هاب سبز است (تب Actions → Deploy to Cloudflare Workers)
- [ ] آدرس `https://imsoroush.<subdomain>.workers.dev` بالا می‌آید (از خروجی اکشن یا داشبورد Workers قابل مشاهده است)
- [ ] Activity map و کارت آمار گیت‌هاب زنده‌اند (نیاز به `GH_PAT`)
- [ ] ریپوها (عمومی + خصوصی) در نمای Repos می‌آیند (نیاز به `GH_PAT`)
- [ ] فرم تماس و خبرنامه در D1 ذخیره می‌شوند و در Inbox پنل ادمین دیده می‌شوند
- [ ] پنل مدیریت (قفل فوتر) با Secret `ADMIN_KEY` باز می‌شود — اگر این Secret ست نشود، کلید پیش‌فرض کد (`imsoroush-admin`) فعال است؛ حتماً ست کنید
- [ ] جستجوی سایت (Ctrl/⌘+K) و سوئیچ زبان (پیش‌فرض انگلیسی) کار می‌کنند

## نکات

1. **Seed محتوا:** `prisma/d1-seed.sql` با اسکریپت `bun prisma/gen-d1-seed.ts` از `db/custom.db` تولید می‌شود؛ هر بار محتوای لوکال عوض شد، همین اسکریپت را اجرا و commit کنید تا دیپلوی بعدی خودش اعمالش کند (مایگریشن/Seed در CI اجرا می‌شوند، فایل SQL کامیت‌شده منبعِ حقیقت است).
2. **کش:** کارت گیت‌هاب کش ۱۰ دقیقه‌ای در حافظهٔ Worker دارد.
3. **اسکیمای D1:** `prisma/d1-schema.sql` با `prisma/schema.prisma` همگام است؛ هر تغییر اسکیما باید به هر دو اعمال شود.
