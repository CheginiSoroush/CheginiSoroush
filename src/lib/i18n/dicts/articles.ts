import type { Dict } from "../dict-type";

/** Writing area: filters, cards, reader, TOC, font controls, resume card, history, comments. */
export const articlesDict: Dict = {
  fa: {
    // ---------- section ----------
    "section.aria": "نوشته‌ها",

    // ---------- search + filters ----------
    "search.placeholder": "جستجو در نوشته‌ها...",
    "search.aria": "جستجوی نوشته",
    "search.clear": "پاک کردن جستجو",
    "filter.all": "همه نوشته‌ها",
    "filter.aria": "فیلتر دسته‌بندی نوشته‌ها",

    // ---------- results + sort ----------
    "results.count": "{n} نوشته یافت شد",
    "sort.popular": "پربازدیدترین",
    "sort.default": "چیدمان پیش‌فرض",
    "sort.title.popular": "مرتب‌سازی بر اساس پربازدیدترین",
    "sort.title.default": "بازگشت به چیدمان پیش‌فرض",

    // ---------- continue-reading resume card ----------
    "resume.title": "ادامه مطالعه",
    "resume.progressAria": "پیشرفت مطالعه",
    "resume.readPercent": "{n}٪ خوانده شده",
    "resume.continue": "ادامه",
    "resume.dismissAria": "بستن کارت ادامه مطالعه",
    "resume.close": "بستن",

    // ---------- empty state ----------
    "empty.title": "نوشته‌ای یافت نشد",
    "empty.desc": "عبارت دیگری را جستجو کنید یا فیلتر دسته‌بندی را تغییر دهید.",

    // ---------- article cards ----------
    "card.read": "مطالعه",
    "card.readTimeShort": "{n} دقیقه",
    "badge.done": "خوانده شد",
    "badge.progress": "{n}٪ خوانده شده — ادامه دهید",
    "badge.progressAria": "پیشرفت مطالعه {title}",

    // ---------- reader meta badges ----------
    "meta.readTime": "{n} دقیقه مطالعه",
    // (meta.views removed — no traffic numbers in the public UI)

    // ---------- like ----------
    "like.add": "لایک کردن این نوشته",
    "like.remove": "برداشتن لایک",
    "like.like": "لایک",
    "like.liked": "لایک شده",

    // ---------- share ----------
    "share.label": "هم‌رسانی",
    "share.title": "هم‌رسانی لینک",
    "share.aria": "هم‌رسانی لینک نوشته",
    "share.groupAria": "هم‌رسانی در شبکه‌های اجتماعی",
    "share.telegram": "تلگرام",
    "share.telegramAria": "هم‌رسانی در تلگرام",
    "share.whatsapp": "واتساپ",
    "share.whatsappAria": "هم‌رسانی در واتساپ",
    "share.x": "ایکس",
    "share.xAria": "هم‌رسانی در ایکس",

    // ---------- table of contents ----------
    "toc.aria": "فهرست مطالب",
    "toc.title": "فهرست مطالب",
    "toc.sections": "{n} بخش",

    // ---------- reader font-size controls ----------
    "reader.fontAria": "اندازه قلم نوشته",
    "reader.font": "اندازه قلم",
    "reader.fontPercent": "{n}٪",
    "reader.smaller": "قلم کوچک‌تر",
    "reader.smallerAria": "کوچک‌تر کردن قلم",
    "reader.larger": "قلم بزرگ‌تر",
    "reader.largerAria": "بزرگ‌تر کردن قلم",

    // ---------- related articles ----------
    "related.title": "نوشته‌های مرتبط",

    // ---------- reading history ----------
    "history.short": "تاریخچه",
    "history.triggerTitle": "تاریخچه مطالعه شما",
    "history.triggerAria": "تاریخچه مطالعه، {n} نوشته",
    "history.title": "تاریخچه مطالعه",
    "history.count": "{n} نوشته",
    "history.desc": "پیشرفت مطالعه شما روی همین دستگاه ذخیره می‌شود.",
    "history.empty": "هنوز چیزی در تاریخچه نیست؛ یکی از نوشته‌ها را باز کنید ✨",
    "history.completed": "کامل خوانده شد",
    "history.percent": "{n}٪",
    "history.progressAria": "پیشرفت {title}",
    "history.resume": "ادامه مطالعه",
    "history.reread": "مطالعه دوباره",
    "history.resumeAria": "ادامه {title}",
    "history.delete": "حذف از تاریخچه",
    "history.deleteAria": "حذف {title} از تاریخچه",
    "history.clearAll": "پاک کردن همه",
    "history.storedLocal": "روی همین دستگاه ذخیره شده",

    // ---------- toasts ----------
    "toast.likeFailedTitle": "ثبت لایک ناموفق بود",
    "toast.likeFailedDesc": "اتصال برقرار نشد؛ بعداً تلاش کنید.",
    "toast.linkCopiedTitle": "لینک کپی شد",
    "toast.linkCopiedDesc": "لینک نوشته در کلیپ‌بورد ذخیره شد.",
    "toast.copyFailedTitle": "کپی نشد",
    "toast.historyClearedTitle": "تاریخچه پاک شد",
    "toast.historyClearedDesc": "همه رکوردهای مطالعه حذف شدند.",
  },
  en: {
    // ---------- section ----------
    "section.aria": "Writing",

    // ---------- search + filters ----------
    "search.placeholder": "Search articles...",
    "search.aria": "Search articles",
    "search.clear": "Clear search",
    "filter.all": "All articles",
    "filter.aria": "Filter articles by category",

    // ---------- results + sort ----------
    "results.count": "{n} articles found",
    "sort.popular": "Most viewed",
    "sort.default": "Default order",
    "sort.title.popular": "Sort by most viewed",
    "sort.title.default": "Back to default order",

    // ---------- continue-reading resume card ----------
    "resume.title": "Continue reading",
    "resume.progressAria": "Reading progress",
    "resume.readPercent": "{n}% read",
    "resume.continue": "Continue",
    "resume.dismissAria": "Dismiss continue-reading card",
    "resume.close": "Close",

    // ---------- empty state ----------
    "empty.title": "No articles found",
    "empty.desc": "Try a different search term or change the category filter.",

    // ---------- article cards ----------
    "card.read": "Read",
    "card.readTimeShort": "{n} min",
    "badge.done": "Read",
    "badge.progress": "{n}% read — keep going",
    "badge.progressAria": "Reading progress: {title}",

    // ---------- reader meta badges ----------
    "meta.readTime": "{n} min read",
    // (meta.views removed — no traffic numbers in the public UI)

    // ---------- like ----------
    "like.add": "Like this article",
    "like.remove": "Remove like",
    "like.like": "Like",
    "like.liked": "Liked",

    // ---------- share ----------
    "share.label": "Share",
    "share.title": "Share link",
    "share.aria": "Share article link",
    "share.groupAria": "Share on social media",
    "share.telegram": "Telegram",
    "share.telegramAria": "Share on Telegram",
    "share.whatsapp": "WhatsApp",
    "share.whatsappAria": "Share on WhatsApp",
    "share.x": "X",
    "share.xAria": "Share on X",

    // ---------- table of contents ----------
    "toc.aria": "Table of contents",
    "toc.title": "Table of contents",
    "toc.sections": "{n} sections",

    // ---------- reader font-size controls ----------
    "reader.fontAria": "Article font size",
    "reader.font": "Font size",
    "reader.fontPercent": "{n}%",
    "reader.smaller": "Smaller font",
    "reader.smallerAria": "Decrease font size",
    "reader.larger": "Larger font",
    "reader.largerAria": "Increase font size",

    // ---------- related articles ----------
    "related.title": "Related articles",

    // ---------- reading history ----------
    "history.short": "History",
    "history.triggerTitle": "Your reading history",
    "history.triggerAria": "Reading history, {n} articles",
    "history.title": "Reading History",
    "history.count": "{n} articles",
    "history.desc": "Your reading progress is stored on this device.",
    "history.empty": "Nothing here yet — open an article to start your history ✨",
    "history.completed": "Finished",
    "history.percent": "{n}%",
    "history.progressAria": "Progress: {title}",
    "history.resume": "Continue reading",
    "history.reread": "Read again",
    "history.resumeAria": "Continue: {title}",
    "history.delete": "Remove from history",
    "history.deleteAria": "Remove {title} from history",
    "history.clearAll": "Clear all",
    "history.storedLocal": "Stored on this device",

    // ---------- toasts ----------
    "toast.likeFailedTitle": "Couldn't save your like",
    "toast.likeFailedDesc": "Connection failed — please try again later.",
    "toast.linkCopiedTitle": "Link copied",
    "toast.linkCopiedDesc": "The article link has been copied to your clipboard.",
    "toast.copyFailedTitle": "Copy failed",
    "toast.historyClearedTitle": "History cleared",
    "toast.historyClearedDesc": "All reading records have been removed.",
  },
};
