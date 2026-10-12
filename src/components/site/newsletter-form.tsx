"use client";

import { useEffect, useState } from "react";
import { Mail, Send, Check, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "success" | "duplicate" | "error";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [count, setCount] = useState<number | null>(null);
  const { toast } = useToast();

  // Subtle subscriber counter (one-shot, silent on failure)
  useEffect(() => {
    fetch("/api/subscribe")
      .then((r) => r.json())
      .then((d: { count?: number }) => {
        if (typeof d.count === "number") setCount(d.count);
      })
      .catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setStatus("error");
      toast({
        title: "ایمیل معتبر نیست",
        description: "مثال: name@example.com",
        variant: "destructive",
      });
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = (await res.json()) as { ok?: boolean; duplicate?: boolean };

      if (data.ok && data.duplicate) {
        setStatus("duplicate");
        toast({
          title: "قبلاً عضو شده‌اید",
          description: "این ایمیل از قبل در خبرنامه ثبت شده است.",
        });
      } else if (data.ok) {
        setStatus("success");
        setCount((c) => (c === null ? null : c + 1));
        toast({
          title: "عضویت شما ثبت شد",
          description: "از این به بعد نوشته‌ها و پروژه‌های جدید را زودتر از همه می‌بینید.",
        });
      } else {
        throw new Error("failed");
      }
    } catch {
      setStatus("error");
      toast({
        title: "عضویت ثبت نشد",
        description: "اتصال برقرار نشد؛ لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    }
  };

  const done = status === "success" || status === "duplicate";

  return (
    <div className="newsletter-card">
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        {/* Copy side */}
        <div className="flex items-start gap-3 flex-grow min-w-0">
          <span
            className="shrink-0 w-11 h-11 grid place-items-center rounded-2xl border border-brand/30 bg-brand/10 text-brand newsletter-badge"
            aria-hidden
          >
            <Mail className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="font-extrabold text-sm sm:text-base flex items-center gap-1.5">
              خبرنامه سروش
              <Sparkles className="w-3.5 h-3.5 text-brand" aria-hidden />
            </p>
            <p className="text-xs text-muted-foreground leading-6 mt-0.5">
              نوشته‌ها و پروژه‌های جدید، مستقیم در ایمیل شما — بدون اسپم.
              {count !== null && count > 0 && (
                <span className="mr-1.5 inline-flex items-center gap-1 text-brand/90 font-bold">
                  👥 {count.toLocaleString("fa-IR")} عضو
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Form side */}
        {done ? (
          <p
            className="newsletter-done shrink-0 inline-flex items-center gap-2 rounded-2xl border border-brand/40 bg-brand/10 text-brand font-bold text-sm px-5 py-3"
            role="status"
          >
            <Check className="w-4.5 h-4.5" />
            {status === "duplicate" ? "از قبل عضو هستید" : "عضویت شما ثبت شد"}
          </p>
        ) : (
          <form onSubmit={submit} className="flex items-center gap-2 shrink-0" noValidate>
            <label htmlFor="newsletter-email" className="sr-only">
              ایمیل برای خبرنامه
            </label>
            <input
              id="newsletter-email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              placeholder="name@example.com"
              autoComplete="email"
              className="newsletter-input w-full sm:w-56 rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm outline-none transition-all min-h-[44px]"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-shine inline-flex items-center justify-center gap-2 rounded-2xl bg-brand text-primary-foreground font-bold text-sm px-5 py-3 hover:-translate-y-0.5 active:scale-95 transition-all min-h-[44px] disabled:opacity-60"
            >
              {status === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              ) : (
                <Send className="w-4 h-4 -scale-x-100" aria-hidden />
              )}
              عضویت
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
