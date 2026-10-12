import type { Dict } from "../dict-type";

/** Home content area: about, content map (radar), category rows, featured projects, writing teaser, GitHub card + heatmap. */
export const homeDict: Dict = {
  fa: {
    // ---------- about ----------
    "about.aria": "درباره من",
    "about.chip": "درباره من",
    "about.photoAlt": "تصویر هنری از دنیای دیجیتال سروش",
    "about.badge.projects": "پروژه متن‌باز",
    "about.badge.dev": "توسعه‌دهنده و نویسنده",
    "about.location": "تهران، ایران",
    "about.title.pre": "کُد می‌نویسم، ",
    "about.title.grad": "داستان",
    "about.title.post": " می‌سازم",
    "about.bio1.a":
      "من سروش چگینی هستم؛ توسعه‌دهنده‌ای که مرز بین مهندسی و خلاقیت را جدی نمی‌گیرد! از ربات‌های هوش مصنوعی سرورلس تا شبیه‌سازهای منظومه شمسی با تکسچر واقعی ناسا — همه‌چیز را از صفر خودم ساخته‌ام و باور دارم بهترین راه یادگیری، ",
    "about.bio1.strong": "ساختن",
    "about.bio1.b": " است.",
    "about.bio2":
      "وقتی کد نمی‌زنم، درباره روانشناسی رفتار و علوم ورزشی می‌نویسم؛ چون فکر می‌کنم یک مهندس خوب باید هم ذهنش را بفهمد، هم بدنش را.",
    "about.timeline.aria": "مسیر من",
    "about.t1.title": "شروع مسیر",
    "about.t1.desc": "یادگیری مبانی برنامه‌نویسی، C++ و عاشق شدن به حل مسئله",
    "about.t2.title": "ساخت ربات‌های تلگرام",
    "about.t2.desc": "از اتوماسیون ساده تا ناوگان ۱۶ ربات حرفه‌ای با هوش مصنوعی",
    "about.t3.title": "معماری بدون سرور",
    "about.t3.desc": "مهاجرت کامل به Cloudflare Workers و دیتابیس‌های لبه (D1, KV)",
    "about.t4.title": "تجربه‌های سه‌بعدی",
    "about.t4.desc": "شبیه‌سازها و پورتفولیوهای تعاملی با Three.js و WebGL",
    "about.t5.title": "نوشتن و کاوش",
    "about.t5.desc": "روانشناسی رفتار، نوروساینس اراده و علوم ورزشی به زبان ساده",
    "about.stack.aria": "تکنولوژی‌های پرکاربرد",
    "about.cta.github": "دنبال کردن در گیت‌هاب",
    "about.cta.talk": "گفت‌وگو با من",

    // ---------- content map / radar ----------
    "map.aria": "نقشه محتوای سایت",
    "map.badge": "نقشه محتوا",
    "map.title": "من چه می‌سازم؟",
    "map.desc":
      "نمودار راداری زنده، توزیع واقعی محتوای سایت را نشان می‌دهد — مستقیم از دیتابیس. روی هر محور نگه دارید تا مقدار دقیق را ببینید.",
    "radar.bots": "ربات‌ها",
    "radar.web": "وب",
    "radar.3d": "سه‌بعدی",
    "radar.tools": "ابزارها",
    "radar.articles": "نوشته‌ها",
    "radar.aria": "نمودار تمرکز محتوا: {items}",

    // ---------- category rows (labels come from core cat.*) ----------
    "cat.bots.blurb":
      "ناوگانی از ربات‌های سرورلس روی Cloudflare Workers با هوش مصنوعی، صف‌بندی هوشمند و اتوماسیون کامل کانال‌ها.",
    "cat.web.blurb":
      "از فروشگاه‌های تعاملی با تم‌های خلاقانه تا لندینگ‌پیج‌های شیشه‌ای و اپلیکیشن‌های روان‌شناسی.",
    "cat.3d.blurb":
      "شبیه‌سازهای منظومه شمسی با تکسچر ناسا، کره‌های رویه‌ای با شیدرهای سفارشی و پورتفولیوهای فضایی.",
    "cat.tools.blurb":
      "ابزارهای OpenCV، اسکریپت‌های Bash، چیت‌شیت‌های تعاملی و ماشین‌حساب‌های ++C برای کارِ سریع‌تر.",

    // ---------- featured projects ----------
    "featured.aria": "پروژه‌های منتخب",
    "featured.title": "پروژه‌های منتخب",
    "featured.viewAll": "مشاهده همه پروژه‌ها",

    // ---------- writing teaser ----------
    "teaser.aria": "نوشته‌ها",
    "teaser.title": "آخرین نوشته‌ها",
    "teaser.self.title": "توسعه فردی",
    "teaser.self.desc":
      "نقشه راه غلبه بر تنبلی، مهندسی عادت‌های اتمی و علم نوروساینس اراده — روانشناسی رفتار به زبان کد.",
    "teaser.sports.title": "علوم ورزشی",
    "teaser.sports.desc":
      "مربی هوشمند تناسب اندام با Gemini؛ تکرار بالا یا پایین؟ پاسخ علمی با نمودارهای تعاملی.",
    "teaser.cta": "{n} نوشته — مطالعه",

    // ---------- github card ----------
    "github.aria": "آمار زنده گیت‌هاب",
    "github.avatarAlt": "آواتار گیت‌هاب {name}",
    "github.title": "گیت‌هاب زنده",
    "github.loading": "در حال دریافت...",
    "github.refresh": "به‌روزرسانی آمار گیت‌هاب",
    "github.error": "فعلاً نتونستم به گیت‌هاب وصل بشم 🛰️",
    "github.retry": "تلاش دوباره",
    "github.stat.repos": "ریپوی عمومی",
    "github.stat.stars": "ستاره",
    "github.stat.forks": "فورک",
    "github.stat.followers": "دنبال‌کننده",
    "github.topRepos": "پرستاره‌ترین ریپوها",

    // ---------- contribution heatmap ----------
    "heatmap.title": "نقشه فعالیت یک سال گذشته",
    "heatmap.total": "{n} مشارکت",
    "heatmap.aria": "نقشه فعالیت گیت‌هاب با {n} مشارکت در یک سال گذشته",
    "heatmap.day.none": "بدون فعالیت — {date}",
    "heatmap.day.some": "{n} فعالیت در {date}",
    "heatmap.activeDays": "{n} روز فعال از {m} روز",
    "heatmap.record": "· رکورد: {n} در یک روز 🏆",
    "heatmap.less": "کم",
    "heatmap.more": "زیاد",
  },
  en: {
    // ---------- about ----------
    "about.aria": "About me",
    "about.chip": "About me",
    "about.photoAlt": "Artistic view of Soroush's digital world",
    "about.badge.projects": "Open-source projects",
    "about.badge.dev": "Developer & Writer",
    "about.location": "Tehran, Iran",
    "about.title.pre": "I write ",
    "about.title.grad": "code",
    "about.title.post": ", I build stories",
    "about.bio1.a":
      "I'm Soroush Chegini — a developer who doesn't take the line between engineering and creativity too seriously! From serverless AI bots to solar-system simulators with real NASA textures — everything here is built from scratch, and I believe the best way to learn is ",
    "about.bio1.strong": "building",
    "about.bio1.b": ".",
    "about.bio2":
      "When I'm not coding, I write about behavioral psychology and sports science — because I believe a good engineer should understand both the mind and the body.",
    "about.timeline.aria": "My journey",
    "about.t1.title": "Where it started",
    "about.t1.desc": "Learning programming fundamentals and C++ — and falling in love with problem-solving",
    "about.t2.title": "Building Telegram bots",
    "about.t2.desc": "From simple automation to a fleet of 16 professional AI-powered bots",
    "about.t3.title": "Going serverless",
    "about.t3.desc": "A full migration to Cloudflare Workers and edge databases (D1, KV)",
    "about.t4.title": "3D experiences",
    "about.t4.desc": "Simulators and interactive portfolios with Three.js and WebGL",
    "about.t5.title": "Writing & exploring",
    "about.t5.desc": "Behavioral psychology, the neuroscience of willpower and sports science — in plain language",
    "about.stack.aria": "Frequently used technologies",
    "about.cta.github": "Follow on GitHub",
    "about.cta.talk": "Talk to me",

    // ---------- content map / radar ----------
    "map.aria": "Site content map",
    "map.badge": "Content map",
    "map.title": "What do I build?",
    "map.desc":
      "A live radar chart showing the real distribution of the site's content — straight from the database. Hover any axis to see the exact value.",
    "radar.bots": "Bots",
    "radar.web": "Web",
    "radar.3d": "3D",
    "radar.tools": "Tools",
    "radar.articles": "Articles",
    "radar.aria": "Content focus chart: {items}",

    // ---------- category rows (labels come from core cat.*) ----------
    "cat.bots.blurb":
      "A fleet of serverless bots on Cloudflare Workers with AI, smart queuing and full channel automation.",
    "cat.web.blurb":
      "From interactive stores with creative themes to glassy landing pages and psychology apps.",
    "cat.3d.blurb":
      "Solar-system simulators with NASA textures, procedural spheres with custom shaders and space-themed portfolios.",
    "cat.tools.blurb":
      "OpenCV tools, Bash scripts, interactive cheat sheets and C++ calculators for getting things done faster.",

    // ---------- featured projects ----------
    "featured.aria": "Featured projects",
    "featured.title": "Featured Projects",
    "featured.viewAll": "View all projects",

    // ---------- writing teaser ----------
    "teaser.aria": "Writing",
    "teaser.title": "Latest Articles",
    "teaser.self.title": "Self Development",
    "teaser.self.desc":
      "A roadmap to beating procrastination, atomic-habit engineering and the neuroscience of willpower — behavioral psychology written in code.",
    "teaser.sports.title": "Sports Science",
    "teaser.sports.desc":
      "A Gemini-powered fitness coach; high reps or low? The scientific answer, with interactive charts.",
    "teaser.cta": "{n} articles — read",

    // ---------- github card ----------
    "github.aria": "Live GitHub stats",
    "github.avatarAlt": "GitHub avatar of {name}",
    "github.title": "Live GitHub",
    "github.loading": "Loading...",
    "github.refresh": "Refresh GitHub stats",
    "github.error": "Can't reach GitHub right now 🛰️",
    "github.retry": "Try again",
    "github.stat.repos": "Public repos",
    "github.stat.stars": "Stars",
    "github.stat.forks": "Forks",
    "github.stat.followers": "Followers",
    "github.topRepos": "Most starred repos",

    // ---------- contribution heatmap ----------
    "heatmap.title": "Activity map — past year",
    "heatmap.total": "{n} contributions",
    "heatmap.aria": "GitHub activity map with {n} contributions over the past year",
    "heatmap.day.none": "No activity — {date}",
    "heatmap.day.some": "{n} contributions on {date}",
    "heatmap.activeDays": "{n} active days out of {m}",
    "heatmap.record": "· Best day: {n} in a single day 🏆",
    "heatmap.less": "Less",
    "heatmap.more": "More",
  },
};
