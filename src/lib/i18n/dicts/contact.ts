import type { Dict } from "../dict-type";

/** Contact section (socials, form, toasts) + newsletter form. Namespace: "contact". */
export const contactDict: Dict = {
  fa: {
    // ---------- section / socials ----------
    "aria.section": "تماس با من",
    "social.github": "گیت‌هاب",
    "social.email": "ایمیل",
    "social.location": "موقعیت",
    "social.locationValue": "ایران",

    // ---------- availability ----------
    "avail.title": "آماده همکاری",
    "avail.desc":
      "برای پروژه‌های فریلنس، ربات تلگرام، وب‌سایت یا همکاری متن‌باز — پیام بدهید.",

    // ---------- form ----------
    "form.title": "ارسال پیام مستقیم",
    "form.subtitle":
      "پیام شما مستقیماً در صندوق پیام‌های من ذخیره می‌شود؛ پیش‌نویس هم به‌صورت خودکار نگه داشته می‌شود.",
    "form.draftPill": "پیش‌نویس بازیابی شد",
    "form.name": "نام و نام خانوادگی",
    "form.namePlaceholder": "مثال: علی رضایی",
    "form.email": "ایمیل شما",
    "form.subject": "موضوع",
    "form.subjectPlaceholder": "موضوع پیام شما",
    "form.message": "متن پیام",
    "form.messagePlaceholder": "پیام خود را اینجا بنویسید...",
    "form.send": "ارسال پیام",
    "form.sending": "در حال ارسال...",

    // ---------- client validation ----------
    "form.errName": "نام باید حداقل ۲ حرف باشد",
    "form.errEmail": "ایمیل معتبر نیست",
    "form.errSubject": "موضوع باید حداقل ۳ حرف باشد",
    "form.errMessage": "پیام باید حداقل ۱۰ حرف باشد",

    // ---------- success view ----------
    "done.title": "پیام شما ثبت شد!",
    "done.desc": "ممنون که در ارتباط هستید؛ به‌زودی پاسخ می‌دهم.",
    "done.again": "ارسال پیام جدید",

    // ---------- toasts ----------
    "toast.draftRestored": "پیش‌نویس بازیابی شد ✍️",
    "toast.draftRestoredDesc": "پیام نیمه‌کاره قبلی شما برگشت.",
    "toast.sent": "ارسال شد ✅",
    "toast.errorTitle": "خطا در ارسال",
    "toast.errorDesc": "لطفاً دوباره تلاش کنید",
    "toast.networkTitle": "خطای شبکه",
    "toast.networkDesc": "اتصال برقرار نشد، دوباره تلاش کنید",

    // ---------- newsletter ----------
    "newsletter.title": "خبرنامه سروش",
    "newsletter.desc": "نوشته‌ها و پروژه‌های جدید، مستقیم در ایمیل شما — بدون اسپم.",
    "newsletter.members": "👥 {n} عضو",
    "newsletter.done": "عضویت شما ثبت شد",
    "newsletter.doneDuplicate": "از قبل عضو هستید",
    "newsletter.emailLabel": "ایمیل برای خبرنامه",
    "newsletter.subscribe": "عضویت",
    "newsletter.errTitle": "ایمیل معتبر نیست",
    "newsletter.errDesc": "مثال: name@example.com",
    "newsletter.dupTitle": "قبلاً عضو شده‌اید",
    "newsletter.dupDesc": "این ایمیل از قبل در خبرنامه ثبت شده است.",
    "newsletter.okTitle": "عضویت شما ثبت شد",
    "newsletter.okDesc":
      "از این به بعد نوشته‌ها و پروژه‌های جدید را زودتر از همه می‌بینید.",
    "newsletter.failTitle": "عضویت ثبت نشد",
    "newsletter.failDesc": "اتصال برقرار نشد؛ لطفاً دوباره تلاش کنید.",
  },
  en: {
    // ---------- section / socials ----------
    "aria.section": "Contact me",
    "social.github": "GitHub",
    "social.email": "Email",
    "social.location": "Location",
    "social.locationValue": "Iran",

    // ---------- availability ----------
    "avail.title": "Available for work",
    "avail.desc":
      "Freelance projects, Telegram bots, websites, or open-source collaboration — drop me a line.",

    // ---------- form ----------
    "form.title": "Send a direct message",
    "form.subtitle":
      "Your message lands straight in my inbox; a draft is saved automatically as you type.",
    "form.draftPill": "Draft restored",
    "form.name": "Full name",
    "form.namePlaceholder": "e.g. Alex Carter",
    "form.email": "Your email",
    "form.subject": "Subject",
    "form.subjectPlaceholder": "Subject of your message",
    "form.message": "Message",
    "form.messagePlaceholder": "Write your message here...",
    "form.send": "Send message",
    "form.sending": "Sending...",

    // ---------- client validation ----------
    "form.errName": "Name must be at least 2 characters",
    "form.errEmail": "Please enter a valid email",
    "form.errSubject": "Subject must be at least 3 characters",
    "form.errMessage": "Message must be at least 10 characters",

    // ---------- success view ----------
    "done.title": "Your message has been sent!",
    "done.desc": "Thanks for reaching out — I'll get back to you soon.",
    "done.again": "Send another message",

    // ---------- toasts ----------
    "toast.draftRestored": "Draft restored",
    "toast.draftRestoredDesc": "Your unsent message has been recovered.",
    "toast.sent": "Sent ✅",
    "toast.errorTitle": "Couldn't send",
    "toast.errorDesc": "Please try again",
    "toast.networkTitle": "Network error",
    "toast.networkDesc": "Couldn't connect — please try again",

    // ---------- newsletter ----------
    "newsletter.title": "Soroush's Newsletter",
    "newsletter.desc": "New articles and projects, straight to your inbox — no spam.",
    "newsletter.members": "👥 {n} members",
    "newsletter.done": "You're subscribed",
    "newsletter.doneDuplicate": "Already subscribed",
    "newsletter.emailLabel": "Email for the newsletter",
    "newsletter.subscribe": "Subscribe",
    "newsletter.errTitle": "Invalid email",
    "newsletter.errDesc": "Example: name@example.com",
    "newsletter.dupTitle": "Already subscribed",
    "newsletter.dupDesc": "This email is already on the list.",
    "newsletter.okTitle": "Subscription confirmed",
    "newsletter.okDesc":
      "You'll see new articles and projects before anyone else.",
    "newsletter.failTitle": "Subscription failed",
    "newsletter.failDesc": "Couldn't connect; please try again.",
  },
};
