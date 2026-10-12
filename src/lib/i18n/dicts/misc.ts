import type { Dict } from "../dict-type";

/** Shared bits: empty state reset, generic loading/saving, command palette, small chrome. */
export const miscDict: Dict = {
  fa: {
    "empty.reset": "پاک کردن فیلترها",
    "common.loading": "در حال بارگذاری…",
    "common.close": "بستن",

    // Command palette — dialog chrome
    "palette.title": "پالت فرمان",
    "palette.description": "جستجو در پروژه‌ها، نوشته‌ها و اقدامات سریع",
    "palette.placeholder": "جستجو کنید: پروژه، نوشته، اقدام...",
    "palette.noResults": "نتیجه‌ای یافت نشد — عبارت دیگری امتحان کنید.",

    // Command palette — group headings
    "palette.group.nav": "ناوبری",
    "palette.group.actions": "اقدامات سریع",
    "palette.group.projects": "پروژه‌ها",
    "palette.group.articles": "نوشته‌ها",

    // Command palette — view (navigation) items
    "palette.nav.home": "خانه",
    "palette.nav.projects": "پروژه‌ها",
    "palette.nav.articles": "نوشته‌ها",
    "palette.nav.contact": "تماس با من",

    // Command palette — quick actions
    "palette.quick.theme": "تغییر تم روشن/تاریک",
    "palette.quick.random": "پروژه تصادفی",
    "palette.quick.favorites": "نمایش علاقه‌مندی‌های من",
    "palette.quick.history": "تاریخچه مطالعه",
    "palette.quick.shortcuts": "راهنمای میان‌برها",
    "palette.quick.admin": "پنل مدیریت",
    "palette.quick.theme.hint": "T",
    "palette.quick.shortcuts.hint": "؟",

    // Command palette — results & footer
    "palette.badge.article": "نوشته",
    "palette.hint": "انتخاب",
    "palette.indexed": "{n} پروژه و {m} نوشته ایندکس شده",

    // Small chrome
    "btt.label": "بازگشت به بالای صفحه",
    "scroll.progressLabel": "پیشرفت مطالعه صفحه",
  },
  en: {
    "empty.reset": "Clear filters",
    "common.loading": "Loading…",
    "common.close": "Close",

    // Command palette — dialog chrome
    "palette.title": "Command palette",
    "palette.description": "Search projects, articles and quick actions",
    "palette.placeholder": "Search projects, articles, actions...",
    "palette.noResults": "No results found — try a different search.",

    // Command palette — group headings
    "palette.group.nav": "Navigation",
    "palette.group.actions": "Quick actions",
    "palette.group.projects": "Projects",
    "palette.group.articles": "Articles",

    // Command palette — view (navigation) items
    "palette.nav.home": "Home",
    "palette.nav.projects": "Projects",
    "palette.nav.articles": "Articles",
    "palette.nav.contact": "Contact me",

    // Command palette — quick actions
    "palette.quick.theme": "Toggle light/dark theme",
    "palette.quick.random": "Random project",
    "palette.quick.favorites": "Show my favorites",
    "palette.quick.history": "Reading history",
    "palette.quick.shortcuts": "Keyboard shortcuts",
    "palette.quick.admin": "Admin panel",
    "palette.quick.theme.hint": "T",
    "palette.quick.shortcuts.hint": "?",

    // Command palette — results & footer
    "palette.badge.article": "Article",
    "palette.hint": "Select",
    "palette.indexed": "{n} projects and {m} articles indexed",

    // Small chrome
    "btt.label": "Back to top",
    "scroll.progressLabel": "Page reading progress",
  },
};
