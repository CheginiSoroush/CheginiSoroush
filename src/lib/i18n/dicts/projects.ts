import type { Dict } from "../dict-type";

/**
 * Projects area: explorer controls, filter/sort/favorite chips, cards,
 * detail dialog, related projects, toasts, empty states.
 * Numbers are injected pre-formatted via num() (e.g. { n: num(views) }).
 */
export const projectsDict: Dict = {
  fa: {
    // ---------- a11y ----------
    "aria.projects": "پروژه‌ها",

    // ---------- filter chips ----------
    "filter.all": "همه",

    // ---------- controls ----------
    "controls.search": "جستجوی پروژه",
    "controls.searchPlaceholder": "جستجو در پروژه‌ها، تکنولوژی‌ها و ریپوها...",
    "controls.clearSearch": "پاک کردن جستجو",
    "controls.filterAria": "فیلتر دسته‌بندی",
    "controls.searching": "در حال جستجو...",
    "controls.found": "{n} پروژه یافت شد",
    "controls.foundOne": "{n} پروژه یافت شد",
    "controls.rolling": "در حال چرخش...",
    "controls.random": "پروژه تصادفی",

    // ---------- sort ----------
    "sort.default": "چیدمان پیش‌فرض",
    "sort.mostViewed": "پربازدیدترین",
    "sort.toDefault": "بازگشت به چیدمان پیش‌فرض",
    "sort.byViews": "مرتب‌سازی بر اساس بیشترین بازدید",

    // ---------- favorites ----------
    "favorites.label": "علاقه‌مندی‌ها",
    "favorites.onlyStarred": "فقط پروژه‌های نشان‌ستاره‌دار شما",
    "favorites.showAll": "نمایش همه پروژه‌ها",
    "favorites.add": "افزودن {title} به علاقه‌مندی‌ها",
    "favorites.remove": "حذف {title} از علاقه‌مندی‌ها",
    "favorites.addShort": "افزودن به علاقه‌مندی‌ها",
    "favorites.removeShort": "حذف از علاقه‌مندی‌ها",
    "favorites.addThis": "افزودن این پروژه به علاقه‌مندی‌ها",
    "favorites.removeThis": "حذف این پروژه از علاقه‌مندی‌ها",

    // ---------- card ----------
    "card.featured": "منتخب",
    "card.details": "جزئیات",
    "card.live": "وب‌سایت پروژه",
    "card.liveAria": "باز کردن وب‌سایت {title} (در تب جدید)",
    "detail.live": "وب‌سایت زنده پروژه",

    // ---------- empty states ----------
    "empty.favs.title": "هنوز پروژه‌ای نشان نکرده‌اید",
    "empty.favs.desc": "با زدن ستاره روی کارت پروژه‌ها، آن‌ها را برای مرور بعدی ذخیره کنید.",
    "empty.search.title": "پروژه‌ای یافت نشد",
    "empty.search.desc": "عبارت دیگری را جستجو کنید یا فیلتر دسته‌بندی را تغییر دهید.",

    // ---------- detail dialog ----------
    "detail.featuredBadge": "پروژه منتخب",
    "detail.stack": "پشته فناوری",
    "detail.related": "پروژه‌های مرتبط",
    "detail.github": "مشاهده در گیت‌هاب",
    // Private repos (isPrivate from /api/repos): no dead GitHub/clone links until public
    "detail.privateBadge": "خصوصی",
    "detail.privateCta": "مخزن خصوصی است",
    "detail.privateNote": "این مخزن فعلاً خصوصی است و پس از تکمیل مستندات عمومی خواهد شد.",
    "detail.privateCloneNote": "دستور کلون پس از عمومی‌شدن مخزن نمایش داده می‌شود.",
    "detail.shareAria": "هم‌رسانی لینک پروژه",
    "detail.shareTitle": "هم‌رسانی لینک",
    "detail.copyClone": "کپی دستور کلون",
    "detail.deeplinkNote": "لینک این پروژه قابل هم‌رسانی و نشانی‌پذیر است",

    // ---------- toasts ----------
    "toast.linkCopied.title": "لینک کپی شد",
    "toast.linkCopied.desc": "لینک پروژه در کلیپ‌بورد ذخیره شد.",
    "toast.cmdCopied.title": "دستور کپی شد",
    "toast.cmdCopied.desc": "دستور کلون در کلیپ‌بورد ذخیره شد.",
    "toast.copyFailed.title": "کپی نشد",
  },
  en: {
    // ---------- a11y ----------
    "aria.projects": "Projects",

    // ---------- filter chips ----------
    "filter.all": "All",

    // ---------- controls ----------
    "controls.search": "Search projects",
    "controls.searchPlaceholder": "Search projects, technologies and repos...",
    "controls.clearSearch": "Clear search",
    "controls.filterAria": "Filter by category",
    "controls.searching": "Searching...",
    "controls.found": "{n} projects found",
    "controls.foundOne": "{n} project found",
    "controls.rolling": "Rolling...",
    "controls.random": "Random project",

    // ---------- sort ----------
    "sort.default": "Default order",
    "sort.mostViewed": "Most viewed",
    "sort.toDefault": "Back to default order",
    "sort.byViews": "Sort by most viewed",

    // ---------- favorites ----------
    "favorites.label": "Favorites",
    "favorites.onlyStarred": "Only your starred projects",
    "favorites.showAll": "Show all projects",
    "favorites.add": "Add {title} to favorites",
    "favorites.remove": "Remove {title} from favorites",
    "favorites.addShort": "Add to favorites",
    "favorites.removeShort": "Remove from favorites",
    "favorites.addThis": "Add this project to favorites",
    "favorites.removeThis": "Remove this project from favorites",

    // ---------- card ----------
    "card.featured": "Featured",
    "card.details": "Details",
    "card.live": "Project site",
    "card.liveAria": "Open the {title} website (new tab)",
    "detail.live": "Open live site",

    // ---------- empty states ----------
    "empty.favs.title": "No starred projects yet",
    "empty.favs.desc": "Tap the star on any project card to save it here for later.",
    "empty.search.title": "No projects found",
    "empty.search.desc": "Try a different search term or switch the category filter.",

    // ---------- detail dialog ----------
    "detail.featuredBadge": "Featured project",
    "detail.stack": "Tech Stack",
    "detail.related": "Related Projects",
    "detail.github": "View on GitHub",
    // Private repos (isPrivate from /api/repos): no dead GitHub/clone links until public
    "detail.privateBadge": "Private",
    "detail.privateCta": "Private repository",
    "detail.privateNote": "This repository is private for now — it will become public once documentation is complete.",
    "detail.privateCloneNote": "The clone command will appear once the repository goes public.",
    "detail.shareAria": "Share project link",
    "detail.shareTitle": "Share link",
    "detail.copyClone": "Copy clone command",
    "detail.deeplinkNote": "This project's link is shareable and bookmarkable.",

    // ---------- toasts ----------
    "toast.linkCopied.title": "Link copied",
    "toast.linkCopied.desc": "Project link copied to your clipboard.",
    "toast.cmdCopied.title": "Command copied",
    "toast.cmdCopied.desc": "Clone command copied to your clipboard.",
    "toast.copyFailed.title": "Copy failed",
  },
};
