import type { Dict } from "../dict-type";

/** Core chrome: header, nav, hero shell, footer, headings, shortcuts, categories. */
export const coreDict: Dict = {
  fa: {
    // ---------- nav ----------
    "nav.home": "خانه",
    "nav.projects": "پروژه‌ها",
    "nav.writing": "نوشته‌ها",
    "nav.contact": "تماس",
    "nav.repos": "ریپوها",
    "aria.mainNav": "ناوبری اصلی",
    "aria.dockNav": "ناوبری موبایل",
    "aria.backHome": "بازگشت به خانه",
    "aria.search": "جستجوی سراسری (Ctrl+K)",
    "aria.searchShort": "جستجو...",
    "aria.themeToggle": "تغییر تم روشن/تاریک",
    "aria.langToggle": "Switch language to English",
    "aria.scrollToExplore": "رفتن به بخش بعدی",

    // ---------- hero ----------
    "hero.name.first": "سروش",
    "hero.name.last": "چگینی",
    "hero.role.0": "توسعه‌دهنده نرم‌افزار",
    "hero.role.1": "سازنده ربات‌های تلگرام",
    "hero.role.2": "خالق تجربه‌های سه‌بعدی",
    "hero.role.3": "نویسنده و کاوشگر",
    "hero.desc":
      "به دنیای دیجیتال من خوش آمدید؛ جایی که کد، خلاقیت و یادگیری مستمر به هم می‌رسند. از ربات‌های هوش مصنوعی تا شبیه‌سازهای سه‌بعدی — همه‌چیز را خودم ساخته‌ام.",
    "hero.cta.projects": "کاوش در پروژه‌ها",
    "hero.cta.github": "گیت‌هاب",
    "hero.stats.projects": "پروژه",
    "hero.stats.articles": "نوشته",
    "hero.stats.domains": "حوزه تخصصی",
    // (hero.stats.visits removed — no traffic numbers in the public UI)
    "hero.scroll": "اسکرول کنید",
    "hero.logoAlt": "لوگوی شخصی سروش",

    // ---------- section headings ----------
    "heading.projects.title": "کارنامه پروژه‌ها",
    "heading.projects.sub":
      "{n} پروژه واقعی؛ از ربات‌های سرورلس و وب‌اپ‌های تعاملی تا شبیه‌سازهای سه‌بعدی. جستجو کنید، فیلتر کنید و جزئیات هر پروژه را ببینید.",
    "heading.writing.title": "نوشته‌ها و کاوش‌ها",
    "heading.writing.sub":
      "روانشناسی رفتار، نوروساینس اراده و علوم ورزشی — هر مقاله همراه با یک پروژه تعاملی واقعی.",
    "heading.contact.title": "ارتباط با من",
    "heading.contact.sub": "خوشحال می‌شم نظرات، پیشنهادات یا ایده‌های همکاری‌تون رو بشنوم.",
    "heading.repos.title": "ریپازیتوری‌های گیت‌هاب",
    "heading.repos.sub":
      "کل آرشیو گیت‌هاب من — عمومی و خصوصی — مستقیم و زنده از گیت‌هاب؛ کد، ستاره‌ها و آخرین فعالیت‌ها.",

    // ---------- footer ----------
    "footer.social": "شبکه‌های اجتماعی",
    "footer.github": "گیت‌هاب",
    "footer.linkedin": "لینکدین",
    // Shown as the disabled button's tooltip until a real profile exists (LINKEDIN_URL in site-config.ts)
    "footer.linkedinSoon": "پروفایل لینکدین به‌زودی فعال می‌شود",
    "footer.email": "ایمیل",
    // (footer.visits removed — no traffic numbers in the public UI)
    "footer.madeWith": "ساخته شده با",
    "footer.love": "علاقه",
    "footer.andCode": "و کد",
    "footer.copyright": "© {year} سروش چگینی",
    "aria.admin": "پنل مدیریت پیام‌ها",
    "aria.shortcuts": "میان‌برهای صفحه‌کلید",
    "footer.shortcutsTitle": "میان‌برهای صفحه‌کلید (؟)",

    // ---------- shortcuts dialog ----------
    "sc.title": "میان‌برهای صفحه‌کلید",
    "sc.desc": "سریع‌تر بین بخش‌ها جابه‌جا شوید.",
    "sc.palette": "جستجوی سراسری (پالت فرمان)",
    "sc.home": "خانه",
    "sc.projects": "پروژه‌ها",
    "sc.writing": "نوشته‌ها",
    "sc.repos": "ریپازیتوری‌ها",
    "sc.contact": "تماس",
    "sc.searchProjects": "جستجوی پروژه‌ها",
    "sc.theme": "تغییر تم روشن/تاریک",
    "sc.lang": "تغییر زبان (فارسی/English)",
    "sc.help": "نمایش همین راهنما",

    // ---------- categories ----------
    "cat.bots": "ربات‌های تلگرام",
    "cat.web": "وب و فروشگاه",
    "cat.3d": "سه‌بعدی و تعاملی",
    "cat.tools": "ابزارهای توسعه",
    "wcat.self": "توسعه فردی",
    "wcat.sports": "علوم ورزشی",

    // ---------- meta ----------
    "meta.title": "سروش | توسعه‌دهنده نرم‌افزار و نویسنده",
  },
  en: {
    // ---------- nav ----------
    "nav.home": "Home",
    "nav.projects": "Projects",
    "nav.writing": "Writing",
    "nav.contact": "Contact",
    "nav.repos": "Repos",
    "aria.mainNav": "Main navigation",
    "aria.dockNav": "Mobile navigation",
    "aria.backHome": "Back to home",
    "aria.search": "Global search (Ctrl+K)",
    "aria.searchShort": "Search...",
    "aria.themeToggle": "Toggle light/dark theme",
    "aria.langToggle": "تغییر زبان به فارسی",
    "aria.scrollToExplore": "Scroll to next section",

    // ---------- hero ----------
    "hero.name.first": "Soroush",
    "hero.name.last": "Chegini",
    "hero.role.0": "Software Developer",
    "hero.role.1": "Telegram Bot Builder",
    "hero.role.2": "Creator of 3D Experiences",
    "hero.role.3": "Writer & Explorer",
    "hero.desc":
      "Welcome to my digital world — where code, creativity and continuous learning meet. From AI-powered bots to 3D simulators, everything here is built by hand.",
    "hero.cta.projects": "Explore Projects",
    "hero.cta.github": "GitHub",
    "hero.stats.projects": "Projects",
    "hero.stats.articles": "Articles",
    "hero.stats.domains": "Domains",
    // (hero.stats.visits removed — no traffic numbers in the public UI)
    "hero.scroll": "Scroll",
    "hero.logoAlt": "Soroush's personal logo",

    // ---------- section headings ----------
    "heading.projects.title": "Project Portfolio",
    "heading.projects.sub":
      "{n} real projects — from serverless bots and interactive web apps to 3D simulators. Search, filter and inspect every detail.",
    "heading.writing.title": "Writing & Explorations",
    "heading.writing.sub":
      "Behavioral psychology, the neuroscience of willpower and sports science — every article paired with a real interactive project.",
    "heading.contact.title": "Get in Touch",
    "heading.contact.sub": "I'd love to hear your feedback, suggestions or collaboration ideas.",
    "heading.repos.title": "GitHub Repositories",
    "heading.repos.sub":
      "My full GitHub archive — public and private — live from GitHub: code, stars and the latest activity.",

    // ---------- footer ----------
    "footer.social": "Social links",
    "footer.github": "GitHub",
    "footer.linkedin": "LinkedIn",
    // Tooltip of the disabled LinkedIn button until a real profile exists (LINKEDIN_URL in site-config.ts)
    "footer.linkedinSoon": "LinkedIn profile coming soon",
    "footer.email": "Email",
    // (footer.visits removed — no traffic numbers in the public UI)
    "footer.madeWith": "Built with",
    "footer.love": "love",
    "footer.andCode": "and code",
    "footer.copyright": "© {year} Soroush Chegini",
    "aria.admin": "Admin messages panel",
    "aria.shortcuts": "Keyboard shortcuts",
    "footer.shortcutsTitle": "Keyboard shortcuts (?)",

    // ---------- shortcuts dialog ----------
    "sc.title": "Keyboard Shortcuts",
    "sc.desc": "Move between sections faster.",
    "sc.palette": "Global search (command palette)",
    "sc.home": "Home",
    "sc.projects": "Projects",
    "sc.writing": "Writing",
    "sc.repos": "Repositories",
    "sc.contact": "Contact",
    "sc.searchProjects": "Search projects",
    "sc.theme": "Toggle light/dark theme",
    "sc.lang": "Switch language (فارسی/English)",
    "sc.help": "Show this guide",

    // ---------- categories ----------
    "cat.bots": "Telegram Bots",
    "cat.web": "Web & E-commerce",
    "cat.3d": "3D & Interactive",
    "cat.tools": "Developer Tools",
    "wcat.self": "Self Development",
    "wcat.sports": "Sports Science",

    // ---------- meta ----------
    "meta.title": "Soroush | Software Developer & Writer",
  },
};
