"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock, Heart, Send, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Client building blocks for the standalone article pages (/writing/<slug>).
 *
 * The page itself is server-rendered (real HTML for crawlers), but a few
 * pieces need the browser:
 *  - `T`            → locale-aware label (chrome text flips after hydration,
 *                     same pattern as the rest of the site)
 *  - `ArticleMeta`  → category / read-time / date badges (locale-aware date)
 *  - `ArticleActions` → like toggle + share row, pointing at the REAL
 *                     `/writing/<slug>` permalink so social shares land on
 *                     the indexable page with its own OG card
 *  - `ArticleViewBump` → one view count per page load (same endpoint the SPA
 *                     reader uses)
 *
 * The liked-slugs storage mirrors the SPA reader (same localStorage key +
 * window event) so hearts stay in sync across both surfaces.
 */

const LIKED_STORAGE_KEY = "imsoroush-liked-articles";
const LIKES_EVENT = "imsoroush-likes-change";

function readLikedSet(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(LIKED_STORAGE_KEY) ?? "[]") as string[];
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

function writeLikedSet(next: Set<string>) {
  try {
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    // storage unavailable — in-memory only
  }
  window.dispatchEvent(new Event(LIKES_EVENT));
}

/** Translated inline label for server-rendered chrome. */
export function T({
  ns,
  k,
  vars,
}: {
  ns: string;
  k: string;
  vars?: Record<string, string | number>;
}) {
  const { t } = useT();
  return <>{t(ns, k, vars)}</>;
}

/** Category chip colors — same mapping as the SPA writing section. */
const CATEGORY_META: Record<string, { color: string }> = {
  self: { color: "text-fuchsia-500 border-fuchsia-500/30 bg-fuchsia-500/10" },
  sports: { color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10" },
};

export function ArticleMeta({
  category,
  readTime,
  publishedAt,
}: {
  category: string;
  readTime: number;
  publishedAt: string;
}) {
  const { t, num, date } = useT();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {CATEGORY_META[category] && (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold",
            CATEGORY_META[category].color
          )}
        >
          <T ns="core" k={`wcat.${category}`} />
        </span>
      )}
      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
        <Clock className="w-3 h-3" aria-hidden />
        <T ns="articles" k="meta.readTime" vars={{ n: num(readTime) }} />
      </span>
      <time
        dateTime={publishedAt}
        className="inline-flex items-center text-xs font-bold text-muted-foreground"
      >
        {date(publishedAt, { year: "numeric", month: "long", day: "numeric" })}
      </time>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function XLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function ArticleActions({
  slug,
  likes,
  url,
  title,
}: {
  slug: string;
  likes: number;
  /** Canonical permalink of the standalone page (production URL). */
  url: string;
  title: string;
}) {
  const { t, num } = useT();
  const { toast } = useToast();

  const [likedSet, setLikedSet] = useState<Set<string> | null>(null);
  const [count, setCount] = useState(likes);
  const [burst, setBurst] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLikedSet(readLikedSet());
  }, []);

  const liked = likedSet?.has(slug) ?? false;

  const toggleLike = useCallback(async () => {
    if (likedSet === null) return; // pre-hydration — ignore
    const next = new Set(likedSet);
    const willLike = !next.has(slug);
    if (willLike) next.add(slug);
    else next.delete(slug);
    setLikedSet(next);
    writeLikedSet(next);
    setCount((c) => Math.max(0, c + (willLike ? 1 : -1)));
    if (willLike) {
      setBurst(true);
      window.setTimeout(() => setBurst(false), 650);
    }
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action: willLike ? "like" : "unlike" }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      // roll back the optimistic update
      setLikedSet(likedSet);
      writeLikedSet(likedSet);
      setCount((c) => Math.max(0, c + (willLike ? -1 : 1)));
      toast({
        title: t("articles", "toast.likeFailedTitle"),
        description: t("articles", "toast.likeFailedDesc"),
        variant: "destructive",
      });
    }
  }, [likedSet, slug, toast, t]);

  const shareText = encodeURIComponent(title);
  const shareUrl = encodeURIComponent(url);
  const shareLinks = {
    telegram: `https://t.me/share/url?url=${shareUrl}&text=${shareText}`,
    whatsapp: `https://wa.me/?text=${shareText}%20${shareUrl}`,
    x: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
  };

  const copyLink = useCallback(async () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: t("articles", "toast.linkCopiedTitle"),
        description: t("articles", "toast.linkCopiedDesc"),
      });
    } catch {
      toast({
        title: t("articles", "toast.copyFailedTitle"),
        description: url,
        variant: "destructive",
      });
    }
  }, [url, toast, t]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={toggleLike}
        aria-pressed={liked}
        aria-label={liked ? t("articles", "like.remove") : t("articles", "like.add")}
        title={liked ? t("articles", "like.liked") : t("articles", "like.like")}
        className={cn(
          "inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full border px-3 py-1.5 transition-all min-h-[30px] active:scale-95",
          liked
            ? "text-brand border-brand/40 bg-brand/15"
            : "text-muted-foreground border-border hover:text-brand hover:border-brand/40"
        )}
      >
        <Heart
          className={cn(
            "w-3.5 h-3.5",
            liked && "fill-brand",
            burst && "like-burst"
          )}
          aria-hidden
        />
        {num(count)}
      </button>
      <button
        onClick={copyLink}
        aria-label={t("articles", "share.aria")}
        title={t("articles", "share.title")}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 hover:bg-brand/20 active:scale-95 transition-all min-h-[30px]"
      >
        {copied ? <Check className="w-3.5 h-3.5" aria-hidden /> : <Share2 className="w-3.5 h-3.5" aria-hidden />}
        <T ns="articles" k="share.label" />
      </button>
      <div className="flex items-center gap-1.5" role="group" aria-label={t("articles", "share.groupAria")}>
        <a
          href={shareLinks.telegram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("articles", "share.telegramAria")}
          title={t("articles", "share.telegram")}
          className="share-bubble share-telegram"
        >
          <Send className="w-4 h-4" aria-hidden />
        </a>
        <a
          href={shareLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("articles", "share.whatsappAria")}
          title={t("articles", "share.whatsapp")}
          className="share-bubble share-whatsapp"
        >
          <WhatsAppIcon className="w-4 h-4" />
        </a>
        <a
          href={shareLinks.x}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("articles", "share.xAria")}
          title={t("articles", "share.x")}
          className="share-bubble share-x"
        >
          <XLogoIcon className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

export function ArticleViewBump({ slug }: { slug: string }) {
  const sentRef = useRef(false);
  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    (async () => {
      try {
        await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, action: "view" }),
          keepalive: true,
        });
      } catch {
        // view stats are best-effort
      }
    })();
  }, [slug]);
  return null;
}
