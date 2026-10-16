"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useT, relativeTime } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Public per-article comments — loaded from /api/comments and persisted in
 * the same DB as the rest of the site (Comment table). The commenter's name
 * is remembered in localStorage so repeat readers only type their message.
 */

type CommentItem = {
  id: string;
  articleSlug: string;
  name: string;
  body: string;
  createdAt: string;
};

const NAME_STORAGE_KEY = "imsoroush-commenter-name";

/** Deterministic avatar hue from the commenter name — no images needed. */
function avatarStyle(name: string): { background: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  return { background: `conic-gradient(from 200deg, oklch(0.72 0.14 ${hash}), oklch(0.6 0.16 ${(hash + 60) % 360}))` };
}

export function ArticleComments({ slug }: { slug: string }) {
  const { t, num, lang } = useT();
  const { toast } = useToast();

  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nameLoaded = useRef(false);

  useEffect(() => {
    const ac = new AbortController();
    setComments(null);
    (async () => {
      try {
        const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`, {
          signal: ac.signal,
        });
        const data = (await res.json()) as { comments?: CommentItem[] };
        if (!ac.signal.aborted)
          setComments(Array.isArray(data.comments) ? data.comments : []);
      } catch {
        if (!ac.signal.aborted) setComments([]);
      }
    })();
    return () => ac.abort();
  }, [slug]);

  useEffect(() => {
    if (!nameLoaded.current) {
      nameLoaded.current = true;
      try {
        setName(localStorage.getItem(NAME_STORAGE_KEY) ?? "");
      } catch {
        /* private mode — name just stays empty */
      }
    }
  }, []);

  const submit = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedText = text.trim();
    const badName = trimmedName.length < 2;
    const badText = trimmedText.length < 2;
    setNameError(badName ? t("articles", "comments.validationName") : null);
    setTextError(badText ? t("articles", "comments.validationBody") : null);
    if (badName || badText || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleSlug: slug, name: trimmedName, body: trimmedText }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        comment?: CommentItem;
        error?: string;
      };
      if (res.status === 429) {
        // Rate-limited: show the server's Persian explanation instead of the
        // generic failure toast.
        toast({
          description: data.error ?? t("articles", "comments.error"),
          variant: "destructive",
        });
        return;
      }
      if (!res.ok || !data.ok || !data.comment) throw new Error("post failed");
      setComments((prev) => [...(prev ?? []), data.comment as CommentItem]);
      setText("");
      try {
        localStorage.setItem(NAME_STORAGE_KEY, trimmedName);
      } catch {
        /* ignore */
      }
      toast({ description: t("articles", "comments.success") });
    } catch {
      toast({ description: t("articles", "comments.error"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [name, text, slug, submitting, t, toast]);

  const list = comments ?? [];

  return (
    <section aria-label={t("articles", "comments.title")} className="mt-7 pt-5 border-t border-border">
      <h4 className="text-sm font-extrabold mb-3.5 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-brand" aria-hidden />
        {t("articles", "comments.title")}
        {comments && (
          <span className="text-[10px] font-black text-brand bg-brand/10 border border-brand/25 rounded-full px-2 py-0.5 tabular-nums">
            {t("articles", "comments.count", { n: num(list.length) })}
          </span>
        )}
      </h4>

      {/* Comment list */}
      {comments === null ? (
        <div className="space-y-2.5" aria-busy="true">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : list.length === 0 ? (
        <p className="text-xs text-muted-foreground rounded-2xl border border-dashed border-border bg-secondary/30 px-4 py-6 text-center">
          {t("articles", "comments.empty")}
        </p>
      ) : (
        <ul className="space-y-2.5 comments-list max-h-80 overflow-y-auto pe-1" role="list">
          {list.map((c) => (
            <li key={c.id} role="listitem" className="flex gap-2.5">
              <span
                aria-hidden
                className="w-8 h-8 shrink-0 grid place-items-center rounded-full text-white text-xs font-black shadow-sm"
                style={avatarStyle(c.name)}
              >
                {c.name.trim().charAt(0).toUpperCase()}
              </span>
              <div className="flex-grow min-w-0 rounded-2xl border border-border bg-secondary/40 px-3.5 py-2.5">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold truncate">{c.name}</span>
                  <time className="text-[10px] text-muted-foreground shrink-0" dateTime={c.createdAt}>
                    {relativeTime(c.createdAt, lang)}
                  </time>
                </div>
                <p className="text-xs leading-6 text-foreground/90 whitespace-pre-wrap break-words">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* New comment form */}
      <form
        className="mt-4 space-y-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder={t("articles", "comments.namePlaceholder")}
            aria-label={t("articles", "comments.nameAria")}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "comment-name-error" : undefined}
            maxLength={60}
            autoComplete="name"
            dir="auto"
            className={cn("h-10", nameError && "border-red-500/60 focus-visible:ring-red-500/30")}
          />
          {nameError && (
            <p id="comment-name-error" role="alert" className="mt-1 text-[11px] text-red-500">
              {nameError}
            </p>
          )}
        </div>
        <div>
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (textError) setTextError(null);
            }}
            placeholder={t("articles", "comments.bodyPlaceholder")}
            aria-label={t("articles", "comments.bodyAria")}
            aria-invalid={!!textError}
            aria-describedby={textError ? "comment-body-error" : undefined}
            rows={3}
            maxLength={1000}
            dir="auto"
            className={cn("min-h-[76px] resize-y", textError && "border-red-500/60 focus-visible:ring-red-500/30")}
          />
          {textError && (
            <p id="comment-body-error" role="alert" className="mt-1 text-[11px] text-red-500">
              {textError}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] text-muted-foreground tabular-nums" aria-hidden>
            {text.length > 900 ? `${num(1000 - text.length)}` : ""}
          </span>
          <Button
            type="submit"
            disabled={submitting}
            className="min-h-[42px] px-5 rounded-2xl font-bold gap-2"
          >
            <Send className="w-4 h-4" aria-hidden />
            {submitting ? t("articles", "comments.submitting") : t("articles", "comments.submit")}
          </Button>
        </div>
      </form>
    </section>
  );
}
