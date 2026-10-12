// Seed data extracted from the original CheginiSoroush/CheginiSoroush static site
// 39 computer projects + 4 articles

export type SeedProject = {
  slug: string;
  title: string;
  titleEn?: string;
  repo: string;
  description: string;
  descriptionEn?: string;
  category: string;
  tags: string[];
  icon: string;
  featured?: boolean;
};

export const PROJECT_CATEGORIES = [
  { id: "bots", label: "ربات‌های تلگرام", icon: "🤖" },
  { id: "web", label: "وب و فروشگاه", icon: "🌐" },
  { id: "3d", label: "سه‌بعدی و تعاملی", icon: "🪐" },
  { id: "tools", label: "ابزارهای توسعه", icon: "🛠️" },
] as const;

export const seedProjects: SeedProject[] = [
  // ---------- BOTS (16) ----------
  {
    slug: "membership-bot",
    title: "ربات تلگرام: قفل کانال",
    titleEn: "Telegram Bot: Channel Lock",
    repo: "CheginiSoroush/Membership-Button-Builder-Telegram-Bot",
    description:
      "توسعه یک ربات Serverless با Cloudflare Workers و دیتابیس D1 برای مدیریت پست‌های ویژه با شرط عضویت.",
    descriptionEn:
      "Serverless Telegram bot built on Cloudflare Workers with a D1 database to manage premium posts gated by channel membership.",
    category: "bots",
    tags: ["Cloudflare Workers", "D1 Database", "TypeScript", "Telegram API"],
    icon: "🔐",
    featured: true,
  },
  {
    slug: "persian-gemini-bot",
    title: "دستیار هوش مصنوعی Gemini",
    titleEn: "Gemini AI Assistant",
    repo: "CheginiSoroush/Persian-Gemini-Telegram-Bot",
    description:
      "ربات تلگرامی متصل به هوش مصنوعی گوگل با قابلیت چت هوشمند، استخراج متن از تصویر (OCR) و پنل مدیریت.",
    descriptionEn:
      "Telegram bot connected to Google's AI, offering smart chat, OCR text extraction from images, and an admin panel.",
    category: "bots",
    tags: ["Google Gemini", "OCR", "Telegram API", "AI"],
    icon: "✨",
    featured: true,
  },
  {
    slug: "aiflash",
    title: "ربات هوش مصنوعی AiFlash",
    titleEn: "AiFlash AI Bot",
    repo: "CheginiSoroush/AiFlash",
    description:
      "دستیار تلگرامی چندوجهی متصل به Google Gemini، توسعه یافته بر بستر Cloudflare Workers بدون سرور.",
    descriptionEn:
      "Multimodal Telegram assistant powered by Google Gemini, built serverless on Cloudflare Workers.",
    category: "bots",
    tags: ["Cloudflare Workers", "Google Gemini", "Serverless", "AI"],
    icon: "⚡",
  },
  {
    slug: "cloudflare-telegram-bot",
    title: "ربات Serverless تلگرام",
    titleEn: "Serverless Telegram Bot",
    repo: "CheginiSoroush/Cloudflare-Telegram-Bot",
    description:
      "ربات تلگرامی با معماری بدون سرور روی Cloudflare Workers، مجهز به دیتابیس D1، سیستم KV و Rate Limiting.",
    descriptionEn:
      "Telegram bot with a serverless architecture on Cloudflare Workers, backed by a D1 database, KV storage, and rate limiting.",
    category: "bots",
    tags: ["Cloudflare Workers", "D1", "KV Store", "Rate Limiting"],
    icon: "☁️",
  },
  {
    slug: "kv-dumper",
    title: "سیستم صف ربات تلگرام",
    titleEn: "Telegram Bot Queue System",
    repo: "CheginiSoroush/KV-Dumper",
    description:
      "ربات مدیریت صف ارسال محتوا با تاخیر هوشمند، متصل به دیتابیس Cloudflare D1 برای جلوگیری از Flood Limit تلگرام.",
    descriptionEn:
      "Content queue-management bot with smart delays, backed by Cloudflare D1 to prevent Telegram flood limits.",
    category: "bots",
    tags: ["Cloudflare D1", "Queue System", "Automation"],
    icon: "📋",
  },
  {
    slug: "unsplash-photos",
    title: "اتوماسیون تصاویر Unsplash",
    titleEn: "Unsplash Photo Automation",
    repo: "CheginiSoroush/Unsplash-Photos",
    description:
      "ربات سرورلس تلگرام مجهز به CRON Jobs برای دریافت تصاویر باکیفیت از Unsplash API و انتشار زمان‌بندی‌شده.",
    descriptionEn:
      "Serverless Telegram bot using CRON jobs to fetch high-quality images from the Unsplash API and publish them on a schedule.",
    category: "bots",
    tags: ["CRON Jobs", "Unsplash API", "Serverless", "Cloudflare"],
    icon: "📷",
  },
  {
    slug: "heartadminbot",
    title: "مدیریت ناوگان ربات‌ها",
    titleEn: "Bot Fleet Management",
    repo: "CheginiSoroush/heartadminbot",
    description:
      "سیستم Serverless برای مدیریت متمرکز ده‌ها ربات تلگرامی جهت ثبت خودکار ری‌اکشن در کانال‌ها با Cloudflare D1.",
    descriptionEn:
      "Serverless system for centrally managing dozens of Telegram bots that auto-register reactions in channels, built on Cloudflare D1.",
    category: "bots",
    tags: ["Fleet Management", "Cloudflare D1", "Serverless", "Automation"],
    icon: "🛰️",
  },
  {
    slug: "proxy-config-bot",
    title: "ربات پروکسی و کانفیگ",
    titleEn: "Proxy Config Bot",
    repo: "CheginiSoroush/Proxy-Config-Bot",
    description:
      "سیستم توزیع منابع شبکه مبتنی بر Cloudflare Workers، مجهز به دیتابیس D1، عضویت اجباری و آپدیت خودکار.",
    descriptionEn:
      "Network resource distribution system on Cloudflare Workers with a D1 database, forced membership, and automatic updates.",
    category: "bots",
    tags: ["Cloudflare Workers", "D1", "Network", "Telegram API"],
    icon: "🛡️",
  },
  {
    slug: "config-to-channel",
    title: "ربات توزیع کانفیگ",
    titleEn: "Config Distribution Bot",
    repo: "CheginiSoroush/ConfigToChannel",
    description:
      "موتور Serverless برای استخراج، مدیریت و زمان‌بندی هوشمندِ ارسال کانفیگ‌های V2Ray به چندین کانال تلگرامی.",
    descriptionEn:
      "Serverless engine for extracting, managing, and smartly scheduling V2Ray config delivery across multiple Telegram channels.",
    category: "bots",
    tags: ["V2Ray", "Serverless", "Scheduling", "Telegram API"],
    icon: "📡",
  },
  {
    slug: "audio-queue-bot",
    title: "ربات صف صوتی",
    titleEn: "Audio Queue Bot",
    repo: "CheginiSoroush/Audio-Queue-Bot",
    description:
      "اتوماسیون انتشار موسیقی در کانال‌های تلگرامی با معماری Serverless، مجهز به زمان‌بندی پویا و دیتابیس D1.",
    descriptionEn:
      "Music publishing automation for Telegram channels with a serverless architecture, dynamic scheduling, and a D1 database.",
    category: "bots",
    tags: ["Audio Publishing", "Dynamic Scheduling", "D1", "Serverless"],
    icon: "🎧",
  },
  {
    slug: "ghost-curator",
    title: "ربات کیوریتور (Ghost)",
    titleEn: "Ghost Curator Bot",
    repo: "CheginiSoroush/Ghost-Curator-Telegram-Bot",
    description:
      "ابزار هوشمند ادمین کانال برای ذخیره، پاکسازی خودکار متن‌ها و ارسال زمان‌بندی‌شده محتوا در تلگرام.",
    descriptionEn:
      "Smart channel-admin tool for saving and auto-cleaning text and publishing scheduled content on Telegram.",
    category: "bots",
    tags: ["Curation", "Text Processing", "Scheduling", "Telegram API"],
    icon: "👻",
  },
  {
    slug: "media-pack-bot",
    title: "ربات مدیریت آلبوم مدیا",
    titleEn: "Media Album Manager Bot",
    repo: "CheginiSoroush/Media-Pack-Telegram-Bot",
    description:
      "ربات ابری (Serverless) برای مدیریت، پاکسازی کپشن‌ها و انتشار خودکار آلبوم‌های عکس و ویدیو در ساعات طلایی.",
    descriptionEn:
      "Cloud serverless bot for managing media, cleaning captions, and auto-publishing photo and video albums at peak hours.",
    category: "bots",
    tags: ["Media Albums", "Caption Cleanup", "Cloudflare", "Automation"],
    icon: "🖼️",
  },
  {
    slug: "temp-file-bot",
    title: "ربات فایل‌های موقت",
    titleEn: "Temp File Bot",
    repo: "CheginiSoroush/Telegram-Temp-File-Bot",
    description:
      "ربات پایتونی برای ایجاد لینک‌های دانلود زمان‌دار، با قابلیت عضویت اجباری و حذف خودکار فایل‌ها از چت کاربر.",
    descriptionEn:
      "Python bot that generates time-limited download links, with forced membership and automatic deletion of files from the user's chat.",
    category: "bots",
    tags: ["Python", "Temporary Links", "Auto-Delete", "Telegram API"],
    icon: "⏳",
  },
  {
    slug: "channel-manager",
    title: "دستیار ادمین کانال",
    titleEn: "Channel Admin Assistant",
    repo: "CheginiSoroush/Telegram-Channel-Manager",
    description:
      "ربات پایتونی برای پایش، پاکسازی خودکار متون با RegEx و سیستم تاییدیه دو مرحله‌ای برای مدیریت کانال.",
    descriptionEn:
      "Python bot for channel moderation with RegEx-based automatic text cleanup and a two-step approval system.",
    category: "bots",
    tags: ["Python", "RegEx", "Moderation", "Two-Factor Approval"],
    icon: "🛎️",
  },
  {
    slug: "self-destruct",
    title: "ربات فایل‌های زمان‌دار",
    titleEn: "Timed File Bot",
    repo: "CheginiSoroush/Cloudflare-Self-Destruct",
    description:
      "نسخه Serverless ربات Self-Destruct در کلودفلر، مجهز به CRON Jobs یک دقیقه‌ای برای نابودی خودکار پیام‌ها.",
    descriptionEn:
      "Serverless version of the Self-Destruct bot on Cloudflare, using one-minute CRON jobs to destroy messages automatically.",
    category: "bots",
    tags: ["Cloudflare CRON", "Self-Destruct", "Serverless", "Security"],
    icon: "💥",
  },
  {
    slug: "bot-boilerplate",
    title: "قالب پایه ربات تلگرام",
    titleEn: "Telegram Bot Boilerplate",
    repo: "CheginiSoroush/Telegram-Bot-Boilerplate",
    description:
      "ساختار اولیه و استاندارد (Boilerplate) برای توسعه سریع ربات‌های تلگرامی با پایتون (Asyncio) و سیستم لاگینگ.",
    descriptionEn:
      "Standard boilerplate for rapidly building Telegram bots with Python (Asyncio) and structured logging.",
    category: "bots",
    tags: ["Python", "Asyncio", "Logging", "Boilerplate"],
    icon: "🧱",
  },

  // ---------- WEB (9) ----------
  {
    slug: "vamp-sole",
    title: "فروشگاه خونین کفش",
    titleEn: "VampSole Store",
    repo: "CheginiSoroush/VampSole",
    description:
      "طراحی رابط کاربری خلاقانه و تعاملی با تم وحشت، دارای انیمیشن‌های پیشرفته CSS و افکت باران خون.",
    descriptionEn:
      "Creative, interactive e-commerce UI with a horror theme, advanced CSS animations, and a blood-rain effect.",
    category: "web",
    tags: ["E-Commerce UI", "Advanced CSS", "Horror Theme", "Animations"],
    icon: "🩸",
  },
  {
    slug: "style-plus",
    title: "فروشگاه استایل پلاس",
    titleEn: "StylePlus Store",
    repo: "CheginiSoroush/StylePlus-Ecommerce",
    description:
      "رابط کاربری پیشرفته و واکنش‌گرای فروشگاهی با امکاناتی نظیر استوری، گردونه شانس و سبد خرید پویا.",
    descriptionEn:
      "Advanced, responsive e-commerce UI with features such as stories, a spin-the-wheel game, and a dynamic cart.",
    category: "web",
    tags: ["E-Commerce UI", "Stories", "Spin Wheel", "Dynamic Cart"],
    icon: "🛍️",
  },
  {
    slug: "aurora-vpn",
    title: "لندینگ پیج AuroraVPN",
    titleEn: "AuroraVPN Landing Page",
    repo: "CheginiSoroush/AuroraVPN",
    description:
      "طراحی مدرن شیشه‌ای با انیمیشن‌های پس‌زمینه پویا و اسکرول تعاملی با جاوااسکریپت خالص.",
    descriptionEn:
      "Modern glassmorphism design with dynamic background animations and interactive scrolling in vanilla JavaScript.",
    category: "web",
    tags: ["Glassmorphism", "Vanilla JS", "Landing Page", "Animations"],
    icon: "🌌",
  },
  {
    slug: "fashion-everyday",
    title: "طراحی Fashion Everyday",
    titleEn: "Fashion Everyday Design",
    repo: "CheginiSoroush/Fashion-Everyday",
    description:
      "طراحی مدرن و مینیمال با استفاده از تکنیک‌های پیشرفته فیلترهای SVG برای خلق افکت‌های تایپوگرافی پویا.",
    descriptionEn:
      "Modern, minimal design using advanced SVG filter techniques to create dynamic typography effects.",
    category: "web",
    tags: ["SVG Filters", "Typography", "Minimal Design", "CSS"],
    icon: "👗",
  },
  {
    slug: "argus-vpn",
    title: "لندینگ پیج ArgusVPN",
    titleEn: "ArgusVPN Landing Page",
    repo: "CheginiSoroush/ArgusVPN",
    description:
      "طراحی مدرن و تاریک با انیمیشن‌های اسکرول GSAP، ماک‌آپ تعاملی CSS و کره زمین سه‌بعدی.",
    descriptionEn:
      "Modern dark design with GSAP scroll animations, an interactive CSS mockup, and a 3D globe.",
    category: "web",
    tags: ["GSAP", "3D Globe", "Dark Design", "CSS Mockups"],
    icon: "👁️",
  },
  {
    slug: "aramia-cbt",
    title: "اپلیکیشن آرامیا (CBT)",
    titleEn: "Aramia CBT App",
    repo: "CheginiSoroush/Aramia-CBT-App",
    description:
      "وب‌اپلیکیشن روان‌شناسی برای مدیریت استرس مجهز به LocalStorage، نمودارهای Chart.js و ابزارهای ذهن‌آگاهی.",
    descriptionEn:
      "Psychology web app for stress management, featuring LocalStorage persistence, Chart.js charts, and mindfulness tools.",
    category: "web",
    tags: ["Psychology", "Chart.js", "LocalStorage", "Mindfulness"],
    icon: "🧘",
    featured: true,
  },
  {
    slug: "luxe-ecommerce",
    title: "فروشگاه آنلاین LUXE",
    titleEn: "LUXE Online Store",
    repo: "CheginiSoroush/Luxe",
    description:
      "رابط کاربری مدرن محصولات لوکس، مجهز به سبد خرید داینامیک و فیلتر محصولات با Bootstrap 5.",
    descriptionEn:
      "Modern luxury-product UI with a dynamic shopping cart and product filtering built on Bootstrap 5.",
    category: "web",
    tags: ["Bootstrap 5", "Luxury UI", "Dynamic Cart", "Filtering"],
    icon: "💎",
  },
  {
    slug: "stepstyle",
    title: "فروشگاه آنلاین StepStyle",
    titleEn: "StepStyle Online Store",
    repo: "CheginiSoroush/StepStyle",
    description:
      "رابط کاربری مدرن با Bootstrap 5، مجهز به سیستم فیلترینگ و رندرینگ داینامیک محصولات جاوااسکریپت.",
    descriptionEn:
      "Modern Bootstrap 5 UI with a product filtering system and dynamic JavaScript product rendering.",
    category: "web",
    tags: ["Bootstrap 5", "Dynamic Rendering", "Filtering", "JS"],
    icon: "👟",
  },
  {
    slug: "valentine-game",
    title: "مینی‌گیم ولنتاین",
    titleEn: "Valentine Mini-Game",
    repo: "CheginiSoroush/My_Valentine_site",
    description:
      "یک صفحه وب تعاملی و فان با جاوااسکریپت که در آن دکمه «خیر» به صورت هوشمند از دست کاربر فرار می‌کند!",
    descriptionEn:
      "A playful, interactive JavaScript page where the 'No' button cleverly escapes the user's cursor!",
    category: "web",
    tags: ["Fun", "Interactive JS", "Mini-Game", "Creative"],
    icon: "💝",
  },

  // ---------- 3D (7) ----------
  {
    slug: "cinematic-solar-system",
    title: "شبیه‌ساز سینمایی منظومه",
    titleEn: "Cinematic Solar System",
    repo: "CheginiSoroush/Cinematic-Solar-System-3D",
    description:
      "شبیه‌سازی کاملاً سه‌بعدی و واقع‌گرایانه با موتور قدرتمند Three.js، تکسچرهای ناسا و افکت‌های Post-Processing.",
    descriptionEn:
      "Fully 3D, realistic simulation powered by Three.js, with NASA textures and post-processing effects.",
    category: "3d",
    tags: ["Three.js", "NASA Textures", "Post-Processing", "WebGL"],
    icon: "🪐",
    featured: true,
  },
  {
    slug: "threejs-solar-system",
    title: "منظومه شمسی واقع‌گرایانه",
    titleEn: "Realistic Solar System",
    repo: "CheginiSoroush/ThreeJS-Solar-System",
    description:
      "شبیه‌سازی کاملاً تعاملی با موتور قدرتمند Three.js، افکت‌های سینمایی (Bloom & Lensflare) و تکسچرهای ناسا.",
    descriptionEn:
      "Fully interactive simulation built with Three.js, featuring cinematic Bloom & Lensflare effects and NASA textures.",
    category: "3d",
    tags: ["Three.js", "Bloom", "Lensflare", "WebGL"],
    icon: "🌞",
  },
  {
    slug: "portfolio-nebula",
    title: "قالب پورتفولیو سحابی",
    titleEn: "Nebula Portfolio Template",
    repo: "CheginiSoroush/Portfolio-Nebula",
    description:
      "یک قالب شخصی تاریک و مدرن با پس‌زمینه تعاملی Three.js، افکت‌های تایپ‌رایتر و انیمیشن‌های GSAP.",
    descriptionEn:
      "Dark, modern personal template with an interactive Three.js background, typewriter effects, and GSAP animations.",
    category: "3d",
    tags: ["Three.js", "GSAP", "Typewriter", "Dark UI"],
    icon: "🌫️",
  },
  {
    slug: "fashionable-3d",
    title: "تجربه سینمایی Fashionable",
    titleEn: "Fashionable 3D Experience",
    repo: "CheginiSoroush/Fashionable-3D-Experience",
    description:
      "ترکیب جادویی Three.js و GSAP برای خلق یک لندینگ‌پیج تعاملی در عمق فضای سه‌بعدی (Z-Axis).",
    descriptionEn:
      "Three.js and GSAP combined to build an interactive landing page with depth along the Z-axis.",
    category: "3d",
    tags: ["Three.js", "GSAP", "Z-Axis", "Cinematic"],
    icon: "🎬",
  },
  {
    slug: "dev-portfolio-3d",
    title: "پورتفولیو سه‌بعدی",
    titleEn: "3D Developer Portfolio",
    repo: "CheginiSoroush/Dev-Portfolio-3D",
    description:
      "قالب شخصی حرفه‌ای با طراحی شیشه‌ای (Glassmorphism)، تایم‌لاین مسیر شغلی و پس‌زمینه تعاملی Three.js.",
    descriptionEn:
      "Professional personal template with glassmorphism design, a career timeline, and an interactive Three.js background.",
    category: "3d",
    tags: ["Glassmorphism", "Career Timeline", "Three.js", "Interactive"],
    icon: "💼",
  },
  {
    slug: "realistic-earth",
    title: "شبیه‌سازی زمین و ماه",
    titleEn: "Earth & Moon Simulation",
    repo: "CheginiSoroush/Realistic-Earth-WebGL",
    description:
      "رندرینگ واقع‌گرایانه کره زمین با استفاده از Three.js، تکسچرهای با وضوح بالا و نورپردازی دینامیک.",
    descriptionEn:
      "Realistic Earth rendering with Three.js, high-resolution textures, and dynamic lighting.",
    category: "3d",
    tags: ["Three.js", "HD Textures", "Dynamic Lighting", "WebGL"],
    icon: "🌍",
  },
  {
    slug: "cosmic-earth",
    title: "منظومه زمین (Procedural)",
    titleEn: "Procedural Earth",
    repo: "CheginiSoroush/3D-Cosmic-Earth",
    description:
      "خلق کره زمین با استفاده از ریاضیات (Simplex Noise) و شیدرنویسی سفارشی در Three.js بدون استفاده از عکس.",
    descriptionEn:
      "An Earth sphere generated entirely from math (Simplex Noise) and custom Three.js shaders, with no image textures.",
    category: "3d",
    tags: ["Simplex Noise", "Custom Shaders", "Procedural", "Three.js"],
    icon: "🧮",
  },

  // ---------- TOOLS (7) ----------
  {
    slug: "microservices-vs-monolith",
    title: "میکروسرویس یا مونولیت؟",
    titleEn: "Microservices or Monolith?",
    repo: "CheginiSoroush/microservices-vs-monolith",
    description:
      "یک ابزار تعاملی و بصری با Chart.js برای پیشنهاد بهترین معماری نرم‌افزار بر اساس نیازهای پروژه.",
    descriptionEn:
      "Interactive visual tool built with Chart.js that recommends the best software architecture based on project needs.",
    category: "tools",
    tags: ["Architecture", "Chart.js", "Decision Tool", "Interactive"],
    icon: "🏗️",
  },
  {
    slug: "gitpedia",
    title: "گیت‌پدیا (GitPedia)",
    titleEn: "GitPedia",
    repo: "CheginiSoroush/gitpedia-interactive",
    description:
      "دانشنامه تعاملی دستورات گیت مجهز به شبیه‌ساز ترمینال داخلی برای اجرای زنده و نمایش خروجی کدها.",
    descriptionEn:
      "Interactive encyclopedia of Git commands with a built-in terminal simulator for live command execution and output.",
    category: "tools",
    tags: ["Git", "Terminal Simulator", "Education", "Interactive"],
    icon: "📚",
    featured: true,
  },
  {
    slug: "linux-cheat-sheet",
    title: "چیت‌شیت جامع لینوکس",
    titleEn: "Comprehensive Linux Cheat Sheet",
    repo: "CheginiSoroush/linux-cheat-sheet",
    description:
      "یک مرجع سریع و تعاملی برای دستورات پرکاربرد خط فرمان (CLI) با قابلیت جستجوی زنده و کپی سریع.",
    descriptionEn:
      "Fast, interactive reference for common CLI commands with live search and quick copy.",
    category: "tools",
    tags: ["Linux", "CLI", "Live Search", "Reference"],
    icon: "🐧",
  },
  {
    slug: "fix-network",
    title: "اسکریپت تعمیر شبکه لینوکس",
    titleEn: "Linux Network Repair Script",
    repo: "CheginiSoroush/Fix-Network",
    description:
      "یک ابزار Bash خودکار و دوزبانه برای رفع مشکلات DNS، پاکسازی پروکسی‌ها و ریست شبکه.",
    descriptionEn:
      "Automated, bilingual Bash tool for fixing DNS issues, cleaning up proxies, and resetting the network.",
    category: "tools",
    tags: ["Bash", "DNS", "Network Repair", "Automation"],
    icon: "🔧",
  },
  {
    slug: "opencv-face-detection",
    title: "تشخیص چهره با OpenCV",
    titleEn: "Face Detection with OpenCV",
    repo: "CheginiSoroush/opencv-face-detection",
    description:
      "اسکریپت پایتون مبتنی بر خط فرمان برای تشخیص هوشمند چهره در تصاویر با استفاده از الگوریتم Haar Cascade.",
    descriptionEn:
      "Command-line Python script for smart face detection in images using the Haar Cascade algorithm.",
    category: "tools",
    tags: ["Python", "OpenCV", "Haar Cascade", "Computer Vision"],
    icon: "😐",
  },
  {
    slug: "opencv-image-blender",
    title: "ابزار ترکیب تصاویر OpenCV",
    titleEn: "OpenCV Image Blender",
    repo: "CheginiSoroush/opencv-image-blender",
    description:
      "اسکریپت خط فرمان (CLI) پایتون برای ترکیب و ادغام (Blending) دو تصویر با کنترل شفافیت.",
    descriptionEn:
      "Python CLI script for combining and blending two images with transparency control.",
    category: "tools",
    tags: ["Python", "OpenCV", "CLI", "Image Blending"],
    icon: "🎭",
  },
  {
    slug: "cpp-calculator",
    title: "ماشین حساب C++ (CLI)",
    titleEn: "C++ Calculator (CLI)",
    repo: "CheginiSoroush/CPP-Calculator",
    description:
      "برنامه خط فرمان نوشته شده با ++C دارای سیستم اعتبارسنجی ورودی‌ها و مدیریت خطاهای ریاضی.",
    descriptionEn:
      "Command-line calculator written in C++ with input validation and mathematical error handling.",
    category: "tools",
    tags: ["C++", "CLI", "Validation", "Error Handling"],
    icon: "🧮",
  },
];

export type SeedArticle = {
  slug: string;
  title: string;
  titleEn?: string;
  excerpt: string;
  excerptEn?: string;
  content: string;
  category: string;
  icon: string;
  readTime: number;
  repo?: string;
};

export const ARTICLE_CATEGORIES = [
  { id: "self", label: "توسعه فردی", icon: "💡" },
  { id: "sports", label: "علوم ورزشی", icon: "🏋️" },
] as const;

export const seedArticles: SeedArticle[] = [
  {
    slug: "overcoming-laziness-roadmap",
    title: "نقشه راه غلبه بر تنبلی",
    titleEn: "Roadmap to Overcoming Laziness",
    excerpt:
      "یک وب‌اپلیکیشن تعاملی بر پایه روانشناسی رفتار و مهندسی عادت‌ها؛ برنامه ۳۰ روزه‌ای برای غلبه بر تنبلی با تمرکز بر قانون ۲ دقیقه‌ای.",
    excerptEn:
      "An interactive web app built on behavioral psychology and habit engineering — a 30-day program for beating laziness, centered on the Two-Minute Rule.",
    icon: "🚀",
    category: "self",
    readTime: 8,
    repo: "CheginiSoroush/overcoming-laziness-roadmap",
    content: `## 🧠 کدنویسی برای ذهن انسان

این پروژه تنها یک مقاله ساده نیست، بلکه یک **نقشه راه تعاملی** است. هدف من ترکیب نظریات روانشناسی رفتار (مانند *عادت‌های اتمی* از جیمز کلیر و *کار عمیق* از کال نیوپورت) با تکنیک‌های مدرن فرانت‌اند بود تا کاربران بتوانند مسیر پیشرفت خود را به صورت بصری و گام‌به‌گام در یک بازه ۳۰ روزه طی کنند.

### نکات برجسته توسعه

- **UI تعاملی و Tab-based:** پیاده‌سازی سیستم تب‌بندی داینامیک برای مدیریت و نمایش هفته‌های مختلف نقشه راه بدون بارگذاری مجدد صفحه.
- **نمودار رشد:** رسم نمودارهای پیشرفت که نشان می‌دهد چگونه تمرکز روی یک حوزه (مانند ساخت عادت) در طول زمان رشد می‌کند.
- **طراحی کارت‌محور:** استفاده از Tailwind CSS برای طراحی مدرن، واکنش‌گرا و مبتنی بر کارت.

### هفته اول: قانون ۲ دقیقه‌ای

> هر بار که احساس تنبلی کردید، سرنخ آن (مکان، زمان، احساس) را یادداشت کنید. سپس نسخه‌ای ۲ دقیقه‌ای از کار را اجرا کنید: «کتاب نمی‌خوانم، فقط یک صفحه می‌خوانم.»

### چرا تعاملی؟

مغز انسان با تصویر و تعامل بهتر یاد می‌گیرد. به جای خواندن یک متن طولانی، کاربر هفته به هفته پیشرفت خود را روی نمودار می‌بیند و حس مالکیت (Ownership) نسبت به مسیر رشد پیدا می‌کند.`,
  },
  {
    slug: "atomic-habits-interactive",
    title: "مهندسی عادت‌های اتمی",
    titleEn: "Engineering Atomic Habits",
    excerpt:
      "شبیه‌سازی بصری روانشناسی رفتار و اثر مرکب با جاوااسکریپت؛ کشف چرخه چهار مرحله‌ای عادت و تأثیر رشد ۱ درصدی روزانه.",
    excerptEn:
      "A visual JavaScript simulation of behavioral psychology and the compounding effect — exploring the four-stage habit loop and the impact of 1% daily growth.",
    icon: "🧠",
    category: "self",
    readTime: 7,
    repo: "CheginiSoroush/atomic-habits-interactive",
    content: `## 🌱 روانشناسی در قالب کد

این وب‌اپلیکیشن مفاهیم کتاب پرفروش **«عادت‌های اتمی»** اثر جیمز کلیر را به ابزارهای تعاملی تبدیل کرده است. به جای خواندن یک متن طولانی، کاربر می‌تواند با المان‌های رابط کاربری تعامل کند، چرخه چهار مرحله‌ای عادت را کشف کند و تأثیر شگفت‌انگیز «رشد یک درصدی» را روی نمودار ببیند.

### قابلیت‌های کلیدی

- **ماشین‌حساب اثر مرکب:** محاسبه زنده و رسم نمودار نمایی رشد با تغییر درصد بهبود روزانه.
- **UI تعاملی چرخه عادت:** المان‌های قابل کلیک برای نمایش توضیحات پویای سرنخ، میل، پاسخ و پاداش.
- **رابط کاربری هشداردهنده:** طراحی بخش «ترک عادت‌های بد» با رنگ‌بندی Danger/Warning برای انتقال حس روانشناختی متفاوت.

### فرمول اثر مرکب

اگر روزانه فقط **۱٪** بهتر شوید، پس از یک سال **۳۷ برابر** بهتر خواهید بود:

\`\`\`
(1 + 0.01) ^ 365 ≈ 37.78
\`\`\`

### چرخه چهار مرحله‌ای عادت

1. **سرنخ (Cue):** محرکی که رفتار را آغاز می‌کند
2. **میل (Craving):** انگیزه‌ای که ما را به سمت رفتار می‌کشاند
3. **پاسخ (Response):** خودِ رفتار
4. **پاداش (Reward):** نتیجه‌ای که چرخه را تثبیت می‌کند

طراحی هر چهار مرحله به صورت کارت‌های تعاملی باعث شد مفهوم کتاب نه فقط خوانده شود، بلکه *تجربه* شود.`,
  },
  {
    slug: "willpower-science-amcc",
    title: "اراده پولادین (aMCC)",
    titleEn: "Iron Will (aMCC)",
    excerpt:
      "تحلیل تعاملی و علمی نوروساینس اراده؛ داشبورد تعاملی قشر کمربندی میانی قدامی (aMCC) در تقابل با ذهنیت سرسختانه دیوید گاگینز.",
    excerptEn:
      "An interactive, scientific analysis of the neuroscience of willpower — a dashboard for the anterior midcingulate cortex (aMCC) set against David Goggins' tough mindset.",
    icon: "🔋",
    category: "self",
    readTime: 9,
    repo: "CheginiSoroush/willpower-science-amcc",
    content: `## 🔬 تجسم داده‌های روان‌شناختی

این وب‌اپلیکیشن به جای ارائه یک مقاله متنی خشک، محتوای علمی مربوط به قشر کمربندی میانی قدامی (**aMCC**) را به یک داشبورد تعاملی تبدیل کرده است. کاربر می‌تواند ابزارهای ذهنی گاگینز را انتخاب کند و در لحظه، بازخورد و واکنش بیولوژیکی مغز را روی نمودار مشاهده کند.

### دستاوردهای پیاده‌سازی

- **داشبورد تعاملی:** اتصال رویدادهای کلیک به توابع جاوااسکریپت برای تغییر آنی متون توضیحی و نمودارها.
- **یکپارچه‌سازی بصری داده‌ها:** رسم نمودارهای میله‌ای که رشد فیزیکی aMCC را شبیه‌سازی می‌کنند.
- **رابط کاربری انتقادی (Danger Zones):** باکس‌های هشدار با استایل‌های اختصاصی قرمز برای تحلیل انتقادی روان‌شناختی.
- **جداول واکنش‌گرا:** جداول مقایسه‌ای که در موبایل به صورت کارت‌بندی شده نمایش داده می‌شوند.

### aMCC چیست؟

قشر کمربندی میانی قدامی (anterior midcingulate cortex) ناحیه‌ای از مغز است که تحقیقات نوروساینس آن را با **علم اراده** گره زده است:

- فعال‌تر می‌شود وقتی کاری را انجام می‌دهیم که *نمی‌خواهیم* ولی می‌دانیم باید انجام دهیم
- با تمرین منظم «دشواری داوطلبانه»، از نظر ساختاری رشد می‌کند
- کلید زیست‌شناسیِ «فشار دادن ادامه» در لحظات سختی است

### گاگینز در برابر علم

ابزارهای ذهنی دیوید گاگینز (قانون ۴۰٪، اتاقک ذهنی، Accountabilty Mirror) را در کنار یافته‌های نوروساینس تحلیل کردم تا مشخص شود کدام تکنیک‌ها دقیقاً همان مسیر رشد aMCC را فعال می‌کنند.`,
  },
  {
    slug: "smart-fitness-planner",
    title: "جدال نهایی در وزنه‌زنی: تکرار بالا یا پایین؟",
    titleEn: "The Ultimate Weightlifting Debate: High or Low Reps?",
    excerpt:
      "بر اساس جدیدترین تحقیقات علمی، بهترین روش تمرینی را برای اهداف منحصر به فرد خود انتخاب کنید؛ مربی هوشمند با تولید برنامه تمرینی و تغذیه توسط AI.",
    excerptEn:
      "Choose the best training method for your unique goals based on the latest scientific research — a smart coach that generates workout and nutrition plans with AI.",
    icon: "🏋️",
    category: "sports",
    readTime: 10,
    repo: "CheginiSoroush/Smart-Fitness-Planner",
    content: `## 🤖💪 مربی هوشمند تناسب اندام

تولید برنامه‌های تمرینی و تغذیه شخصی‌سازی‌شده با استفاده از هوش مصنوعی Gemini.

### 🧠 ادغام علوم ورزشی و هوش مصنوعی

این وب‌اپلیکیشن، مقالات علمی را با قدرت هوش مصنوعی ترکیب کرده است. کاربر با انتخاب هدف خود (عضله‌سازی، چربی‌سوزی، قدرت و...) تحلیل‌های بصری دریافت کرده و سپس می‌تواند از طریق API هوش مصنوعی Gemini، برنامه تمرینی و تغذیه کاملاً شخصی‌سازی‌شده تولید کند.

### تکرار بالا یا پایین؟ جواب علمی

- **دامنه ۶-۱۲ تکرار:** بهترین تعادل بین فشار مکانیکی و استرس متابولیک برای هایپرتروفی
- **دامنه ۱-۵ تکرار:** بهینه برای قدرت بیشینه (Neural Adaptations)
- **دامنه ۱۵+ تکرار:** استرس متابولیک بالا؛ مفید برای استقامت و پمپاژ خون

تحقیقات متاآنالیز نشان می‌دهد **هایپرتروفی در تمام دامنه‌ها رخ می‌دهد** به شرطی که تمرین نزدیک به ناتوانی (Close to Failure) انجام شود — اما کارایی (Efficiency) و مدیریت خستگی، دامنه ۶-۱۲ را برنده می‌کند.

### امکانات پیشرفته سیستم

- **AI Workout Generator:** ارتباط مستقیم با مدل زبانی Google Gemini برای خلق برنامه‌های تمرینی بر اساس پرامپت‌های علمی.
- **معماری Serverless:** میزبانی سمت سرور بر روی شبکه توزیع‌شده Cloudflare Workers بدون نیاز به سرور سنتی.
- **پشتیبانی از Markdown:** رندر کردن متون خروجی هوش مصنوعی به HTML خوانا و زیبا.
- **تجزیه و تحلیل بصری:** نمودارهای راداری مقایسه‌ای از میزان فشار مکانیکی و استرس متابولیک.

### نکته کلیدی

هیچ برنامه تمرینی «بهترین مطلق» وجود ندارد؛ فقط **بهترین برنامه برای هدف، تجهیزات و ظرفیت ریکاوری شما** وجود دارد. این ابزار دقیقاً همین تصمیم‌گیری را به داده و نمودار تبدیل می‌کند.`,
  },
];

export const SITE_STATS_SEED: Record<string, number> = {
  visits: 0,
  projectViews: 0,
};
