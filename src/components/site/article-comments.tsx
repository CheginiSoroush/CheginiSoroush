"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessageCircle, Send, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Comment } from "@/lib/types";

const NAME_KEY = "imsoroush-comment-name";

// Deterministic pastel gradient per commenter name
const AVATAR_GRADIENTS = [
  "from-[#14d2b8] to-[#0d9488]",
  "from-[#f59e0b] to-[#d97706]",
  "from-[#ec4899] to-[#be185d]",
  "from-[#8b5cf6] to-[#6d28d9]",
  "from-[#10b981] to-[#047857]",
  "from-[#f43f5e] to-[#be123c]",
];

function avatarClass(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function initialOf(name: string) {
  const clean = name.replace(/[\u200c\s]+/g, " ").trim();
  const parts = clean.split(" ");
  if (parts.length > 1) return (parts[0][0] ?? "") + (parts[1][0] ?? "");
  return clean.slice(0, 2);
}

function relativeTime(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "همین حالا";
    if (mins < 60) return `${mins.toLocaleString("fa-IR")} دقیقه پیش`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours.toLocaleString("fa-IR")} ساعت پیش`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days.toLocaleString("fa-IR")} روز پیش`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks.toLocaleString("fa-IR")} هفته پیش`;
    return new Date(iso).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function readStoredName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function ArticleComments({
  slug,
  onCountChange,
}: {
  slug: string;
  onCountChange?: (slug: string, total: number) => void;
}) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [name, setName] = useState(readStoredName);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justPostedId, setJustPostedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadedSlugRef = useRef<string | null>(null);

  const load = useCallback(async (targetSlug: string) => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/comments?slug=${encodeURIComponent(targetSlug)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as {
        comments: Comment[];
        total: number;
        page: number;
        totalPages: number;
      };
      setComments(data.comments);
      setTotal(data.total);
      setPage(1);
      setTotalPages(data.totalPages);
      onCountChange?.(targetSlug, data.total);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  const loadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/comments?slug=${encodeURIComponent(slug)}&page=${page + 1}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as {
        comments: Comment[];
        total: number;
        page: number;
        totalPages: number;
      };
      setComments((list) => [...list, ...data.comments]);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      toast({ title: "بارگذاری نشد", description: "دیدگاه‌های بیشتر لود نشدند.", variant: "destructive" });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page, totalPages, slug, toast]);

  // Reset per-article state when the reader opens a different article
  useEffect(() => {
    if (loadedSlugRef.current === slug) return;
    loadedSlugRef.current = slug;
    setBody("");
    load(slug);
  }, [slug, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedBody = body.trim();
    if (trimmedName.length < 2) {
      toast({ title: "نام کوتاه است", description: "نام باید حداقل ۲ حرف باشد.", variant: "destructive" });
      return;
    }
    if (trimmedBody.length < 3) {
      toast({ title: "متن کوتاه است", description: "دیدگاه باید حداقل ۳ حرف باشد.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name: trimmedName, body: trimmedBody }),
      });
      const data = (await res.json()) as { comment?: Comment; total?: number; error?: string };
      if (!res.ok || !data.comment) {
        toast({ title: "ارسال نشد", description: data.error ?? "خطایی رخ داد.", variant: "destructive" });
        return;
      }
      setComments((list) => [data.comment as Comment, ...list]);
      if (typeof data.total === "number") {
        setTotal(data.total);
        setTotalPages(Math.max(1, Math.ceil(data.total / 20)));
        onCountChange?.(slug, data.total);
      }
      setBody("");
      setJustPostedId(data.comment.id);
      window.setTimeout(() => setJustPostedId((id) => (id === data.comment!.id ? null : id)), 1200);
      try {
        localStorage.setItem(NAME_KEY, trimmedName);
      } catch {
        // storage unavailable
      }
      toast({ title: "دیدگاه ثبت شد 🎉", description: "ممنون از همراهی‌ات!" });
    } catch {
      toast({ title: "خطای شبکه", description: "اتصال برقرار نشد.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-border" aria-label="دیدگاه‌ها">
      <h4 className="flex items-center gap-2 text-sm font-extrabold mb-4">
        <MessageCircle className="w-4 h-4 text-brand" />
        دیدگاه‌ها
        <span className="text-[11px] font-bold text-brand bg-brand/10 border border-brand/30 rounded-full px-2 py-0.5 tabular-nums">
          {total.toLocaleString("fa-IR")}
        </span>
      </h4>

      {/* Comment form */}
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام شما"
            aria-label="نام شما"
            maxLength={40}
            className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20 transition-all min-h-[42px]"
          />
          <span
            aria-hidden
            className={cn(
              "w-[42px] h-[42px] shrink-0 rounded-xl bg-gradient-to-br grid place-items-center text-primary-foreground text-sm font-black select-none transition-all",
              name.trim().length >= 2 ? avatarClass(name.trim()) : "from-muted-foreground/30 to-muted-foreground/20 text-muted-foreground"
            )}
          >
            {name.trim().length >= 2 ? initialOf(name.trim()) : "؟"}
          </span>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="نظرت راجع به این نوشته چیه؟"
          aria-label="متن دیدگاه"
          rows={3}
          maxLength={1000}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm leading-7 outline-none resize-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20 transition-all"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground tabular-nums" dir="ltr">
            {body.length}/۱۰۰۰
          </span>
          <button
            type="submit"
            disabled={submitting || name.trim().length < 2 || body.trim().length < 3}
            className="btn-shine inline-flex items-center gap-2 rounded-xl bg-brand text-primary-foreground font-bold text-xs px-5 py-2.5 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none min-h-[38px]"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -scale-x-100" />}
            ثبت دیدگاه
          </button>
        </div>
      </form>

      {/* List */}
      {loading ? (
        <div className="mt-4 space-y-3" aria-busy="true">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card/50 p-4 flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-muted-foreground/15 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-muted-foreground/15" />
                <div className="h-3 w-full rounded bg-muted-foreground/10" />
                <div className="h-3 w-2/3 rounded bg-muted-foreground/10" />
              </div>
            </div>
          ))}
        </div>
      ) : failed ? (
        <div className="mt-4 text-center py-6 text-muted-foreground text-sm">
          دیدگاه‌ها بارگذاری نشد.
          <button
            onClick={() => load(slug)}
            className="mr-2 text-brand font-bold hover:underline"
          >
            تلاش دوباره
          </button>
        </div>
      ) : comments.length === 0 ? (
        <div className="mt-5 text-center py-7 rounded-2xl border border-dashed border-border text-muted-foreground">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">اولین دیدگاه را شما بنویسید ✨</p>
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-3">
            <AnimatePresence initial={false}>
              {comments.map((c) => (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, y: -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "comment-card rounded-2xl border border-border bg-card/60 p-4 flex gap-3",
                    justPostedId === c.id && "comment-fresh border-brand/40 shadow-[0_0_20px_-8px_var(--brand-glow)]"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br grid place-items-center text-primary-foreground text-sm font-black select-none",
                      avatarClass(c.name)
                    )}
                  >
                    {initialOf(c.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">{c.name}</span>
                      <span className="text-[10px] text-muted-foreground">{relativeTime(c.createdAt)}</span>
                    </div>
                    <p className="text-sm leading-7 text-foreground/90 whitespace-pre-wrap break-words">{c.body}</p>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {page < totalPages && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 text-sm font-bold text-brand px-4 py-3 hover:border-brand/40 hover:bg-brand/10 transition-all disabled:opacity-60 min-h-[44px]"
            >
              {loadingMore ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              نمایش دیدگاه‌های بیشتر
              <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                ({comments.length.toLocaleString("fa-IR")} از {total.toLocaleString("fa-IR")})
              </span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
