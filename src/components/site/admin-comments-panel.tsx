"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageCircle, Trash2, RotateCcw, CheckCircle2, RefreshCw, ChevronRight, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { Comment } from "@/lib/types";

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

export function AdminCommentsPanel({ apiKey }: { apiKey: string }) {
  const { toast } = useToast();
  const { t, num, isRtl, date } = useT();
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fmtDate = (iso: string) => {
    try {
      return date(iso, DATE_OPTS);
    } catch {
      return iso;
    }
  };

  const load = useCallback(
    async (opts?: { page?: number }) => {
      const p = opts?.page ?? page;
      setLoading(true);
      setFailed(false);
      try {
        const res = await fetch(`/api/admin/comments?page=${p}&pageSize=10`, {
          headers: { "x-admin-key": apiKey },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as {
          comments: Comment[];
          total: number;
          page: number;
          totalPages: number;
        };
        setComments(data.comments ?? []);
        setTotal(data.total ?? 0);
        setPage(data.page ?? 1);
        setTotalPages(data.totalPages ?? 1);
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [apiKey, page]
  );

  useEffect(() => {
    load({ page: 1 });
  }, [apiKey, load]);

  const remove = async (c: Comment) => {
    setBusyId(c.id);
    try {
      const res = await fetch("/api/admin/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-admin-key": apiKey },
        body: JSON.stringify({ id: c.id }),
      });
      if (res.ok) {
        toast({
          title: t("admin", "commentDeleted"),
          description: t("admin", "commentDeletedDesc", { s: c.name }),
        });
        setConfirmDeleteId(null);
        load();
      } else {
        toast({ title: t("admin", "deleteFailed"), variant: "destructive" });
      }
    } catch {
      toast({ title: t("admin", "networkTitle"), variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-14 grid place-items-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm mb-4">{t("admin", "commentsFailed")}</p>
        <button
          onClick={() => load()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand rounded-full border border-brand/30 bg-brand/10 px-4 py-2 hover:bg-brand/20 transition-all min-h-[34px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t("admin", "retry")}
        </button>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">{t("admin", "noComments")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {t("admin", "totalLabel")}{" "}
          <span className="font-bold text-brand">{num(total)}</span>{" "}
          {t("admin", "commentsUnit")}
        </p>
        <button
          onClick={() => load()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1.5 hover:bg-brand/20 active:scale-95 transition-all min-h-[30px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t("admin", "refresh")}
        </button>
      </div>

      <ul className="space-y-2.5">
        {comments.map((c) => (
          <li key={c.id} className="rounded-2xl border border-border bg-card p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">
                  {c.name}
                  <span dir="ltr" className="font-mono text-[10px] text-muted-foreground ms-2">
                    {c.articleSlug}
                  </span>
                </p>
                <p className="text-sm text-foreground/90 leading-7 whitespace-pre-wrap break-words mt-1">
                  {c.body}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1.5">{fmtDate(c.createdAt)}</p>
              </div>
              <div className="shrink-0">
                {confirmDeleteId === c.id ? (
                  <span className="flex items-center gap-0.5">
                    <button
                      onClick={() => remove(c)}
                      aria-label={t("admin", "confirmDelete")}
                      title={t("admin", "confirmDelete")}
                      disabled={busyId === c.id}
                      className="w-8 h-8 rounded-lg grid place-items-center text-destructive hover:bg-destructive/15 transition-all"
                    >
                      {busyId === c.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      aria-label={t("admin", "cancel")}
                      title={t("admin", "cancel")}
                      className={cn(
                        "w-8 h-8 rounded-lg grid place-items-center text-muted-foreground/60 hover:text-foreground transition-all"
                      )}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(c.id)}
                    aria-label={t("admin", "deleteComment")}
                    title={t("admin", "deleteShort")}
                    className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={() => load({ page: page - 1 })}
            disabled={page <= 1}
            aria-label={t("admin", "prevPage")}
            className="w-9 h-9 grid place-items-center rounded-xl border border-border text-muted-foreground hover:text-brand hover:border-brand/50 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {t("admin", "pageOf", { n: num(page), m: num(totalPages) })}
          </span>
          <button
            onClick={() => load({ page: page + 1 })}
            disabled={page >= totalPages}
            aria-label={t("admin", "nextPage")}
            className="w-9 h-9 grid place-items-center rounded-xl border border-border text-muted-foreground hover:text-brand hover:border-brand/50 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
