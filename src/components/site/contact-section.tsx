"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, MapPin, Mail, Github, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FormState = { name: string; email: string; subject: string; message: string };
type FieldErrors = Partial<Record<keyof FormState, string>>;

const SOCIALS = [
  {
    id: "github",
    label: "گیت‌هاب",
    value: "CheginiSoroush",
    href: "https://github.com/CheginiSoroush",
    icon: <Github className="w-5 h-5" />,
    tone: "text-violet-500 bg-violet-500/10 border-violet-500/30",
  },
  {
    id: "email",
    label: "ایمیل",
    value: "imsoroushchegini@gmail.com",
    href: "mailto:imsoroushchegini@gmail.com",
    icon: <Mail className="w-5 h-5" />,
    tone: "text-rose-500 bg-rose-500/10 border-rose-500/30",
  },
  {
    id: "location",
    label: "موقعیت",
    value: "ایران",
    href: null,
    icon: <MapPin className="w-5 h-5" />,
    tone: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
  },
];

export function ContactSection() {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = (): boolean => {
    const er: FieldErrors = {};
    if (form.name.trim().length < 2) er.name = "نام باید حداقل ۲ حرف باشد";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) er.email = "ایمیل معتبر نیست";
    if (form.subject.trim().length < 3) er.subject = "موضوع باید حداقل ۳ حرف باشد";
    if (form.message.trim().length < 10) er.message = "پیام باید حداقل ۱۰ حرف باشد";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        errors?: FieldErrors;
      };
      if (res.ok && data.ok) {
        setDone(true);
        setForm({ name: "", email: "", subject: "", message: "" });
        toast({ title: "ارسال شد ✅", description: data.message });
      } else {
        if (data.errors) setErrors(data.errors);
        toast({
          title: "خطا در ارسال",
          description: data.error ?? "لطفاً دوباره تلاش کنید",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "خطای شبکه",
        description: "اتصال برقرار نشد، دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (hasError?: string) =>
    `w-full rounded-2xl border bg-card px-4 py-3 text-sm outline-none transition-all min-h-[46px] placeholder:text-muted-foreground/60 focus:ring-2 ${
      hasError
        ? "border-destructive/60 focus:ring-destructive/20"
        : "border-border focus:border-brand/60 focus:ring-brand/20"
    }`;

  return (
    <section id="contact" aria-label="تماس با من" className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Social cards */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2 space-y-4"
        >
          {SOCIALS.map((s) => {
            const inner = (
              <>
                <div
                  className={`w-12 h-12 shrink-0 grid place-items-center rounded-2xl border ${s.tone}`}
                >
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base">{s.label}</h3>
                  <p dir={s.id === "email" || s.id === "github" ? "ltr" : "rtl"} className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5 text-left">
                    {s.value}
                  </p>
                </div>
              </>
            );
            return s.href ? (
              <a
                key={s.id}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="glow-card flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
              >
                {inner}
              </a>
            ) : (
              <div key={s.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
                {inner}
              </div>
            );
          })}

          {/* Availability card */}
          <div className="rounded-2xl border border-brand/30 bg-brand/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5" aria-hidden>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand" />
              </span>
              <span className="text-sm font-bold text-brand">آماده همکاری</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-6">
              برای پروژه‌های فریلنس، ربات تلگرام، وب‌سایت یا همکاری متن‌باز — پیام بدهید.
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-3 rounded-3xl border border-border bg-card p-6 sm:p-8"
        >
          {done ? (
            <div className="text-center py-14">
              <CheckCircle2 className="w-14 h-14 text-brand mx-auto mb-4" />
              <h3 className="text-xl font-extrabold mb-2">پیام شما ثبت شد!</h3>
              <p className="text-sm text-muted-foreground mb-6">
                ممنون که در ارتباط هستید؛ به‌زودی پاسخ می‌دهم.
              </p>
              <button
                onClick={() => setDone(false)}
                className="rounded-2xl border border-border px-6 py-2.5 text-sm font-bold hover:border-brand/50 hover:text-brand transition-all min-h-[42px]"
              >
                ارسال پیام جدید
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-5">
              <div>
                <h2 className="text-lg font-extrabold mb-1">ارسال پیام مستقیم</h2>
                <p className="text-xs text-muted-foreground">
                  پیام شما مستقیماً در صندوق پیام‌های من ذخیره می‌شود.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="c-name" className="block text-xs font-bold mb-2">
                    نام و نام خانوادگی
                  </label>
                  <input
                    id="c-name"
                    type="text"
                    value={form.name}
                    onChange={set("name")}
                    placeholder="مثال: علی رضایی"
                    aria-invalid={!!errors.name}
                    className={inputCls(errors.name)}
                  />
                  {errors.name && <p className="text-[11px] text-destructive mt-1.5">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="c-email" className="block text-xs font-bold mb-2">
                    ایمیل شما
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    dir="ltr"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="email@example.com"
                    aria-invalid={!!errors.email}
                    className={`${inputCls(errors.email)} text-left`}
                  />
                  {errors.email && <p className="text-[11px] text-destructive mt-1.5">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="c-subject" className="block text-xs font-bold mb-2">
                  موضوع
                </label>
                <input
                  id="c-subject"
                  type="text"
                  value={form.subject}
                  onChange={set("subject")}
                  placeholder="موضوع پیام شما"
                  aria-invalid={!!errors.subject}
                  className={inputCls(errors.subject)}
                />
                {errors.subject && (
                  <p className="text-[11px] text-destructive mt-1.5">{errors.subject}</p>
                )}
              </div>

              <div>
                <label htmlFor="c-message" className="block text-xs font-bold mb-2">
                  متن پیام
                </label>
                <textarea
                  id="c-message"
                  rows={5}
                  value={form.message}
                  onChange={set("message")}
                  placeholder="پیام خود را اینجا بنویسید..."
                  aria-invalid={!!errors.message}
                  className={`${inputCls(errors.message)} resize-none`}
                />
                {errors.message && (
                  <p className="text-[11px] text-destructive mt-1.5">{errors.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-brand text-primary-foreground font-bold px-8 py-3 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-10px_var(--brand-glow)] active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none min-h-[46px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال ارسال...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 -scale-x-100" />
                    ارسال پیام
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
