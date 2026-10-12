"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Lock,
  MailOpen,
  Mail,
  Loader2,
  ShieldCheck,
  Inbox,
  Trash2,
  Reply,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
};

type ListPayload = {
  messages: Message[];
  total: number;
  unread: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const fa = (n: number) => n.toLocaleString("fa-IR");

export function AdminMessagesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const [authed, setAuthed] = useState(false);
  const [key, setKey] = useState("");
  const [checking, setChecking] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setAuthed(false);
      setKey("");
      setMessages([]);
      setPage(1);
      setTab("all");
      setConfirmDeleteId(null);
    }
  }, [open]);

  const fetchList = useCallback(
    async (opts?: { page?: number; tab?: "all" | "unread" }) => {
      const p = opts?.page ?? page;
      const t = opts?.tab ?? tab;
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(p), pageSize: "8", filter: t });
        const res = await fetch(`/api/admin/messages?${params.toString()}`, {
          headers: { "x-admin-key": key.trim() },
          cache: "no-store",
        });
        if (res.status === 401) {
          toast({ title: "کلید اشتباه است", description: "کلید مدیریتی درست نیست.", variant: "destructive" });
          setAuthed(false);
          return;
        }
        const data = (await res.json()) as ListPayload;
        setMessages(data.messages ?? []);
        setTotal(data.total ?? 0);
        setUnread(data.unread ?? 0);
        setPage(data.page ?? 1);
        setTotalPages(data.totalPages ?? 1);
        setAuthed(true);
      } catch {
        toast({
          title: "خطای شبکه",
          description: "اتصال برقرار نشد، دوباره تلاش کنید",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [key, page, tab, toast]
  );

  const unlock = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!key.trim() || checking) return;
    setChecking(true);
    await fetchList({ page: 1, tab: "all" });
    setChecking(false);
  };

  const switchTab = (t: "all" | "unread") => {
    setTab(t);
    fetchList({ page: 1, tab: t });
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    fetchList({ page: p });
  };

  const markRead = async (m: Message) => {
    if (m.read || busyId === m.id) return;
    setBusyId(m.id);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": key.trim() },
        body: JSON.stringify({ id: m.id, read: true }),
      });
      if (res.ok) {
        setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, read: true } : x)));
        setUnread((u) => Math.max(0, u - 1));
      }
    } catch {
      // ignore
    } finally {
      setBusyId(null);
    }
  };

  const markUnread = async (m: Message) => {
    if (!m.read || busyId === m.id) return;
    setBusyId(m.id);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": key.trim() },
        body: JSON.stringify({ id: m.id, read: false }),
      });
      if (res.ok) {
        // In "unread" tab the message disappears; refresh to stay consistent
        if (tab === "unread") {
          fetchList();
        } else {
          setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, read: false } : x)));
        }
        setUnread((u) => u + 1);
      }
    } catch {
      // ignore
    } finally {
      setBusyId(null);
    }
  };

  const deleteMessage = async (m: Message) => {
    setBusyId(m.id);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-admin-key": key.trim() },
        body: JSON.stringify({ id: m.id }),
      });
      if (res.ok) {
        toast({ title: "پیام حذف شد", description: `پیام «${m.subject}» پاک شد.` });
        setConfirmDeleteId(null);
        fetchList();
      } else {
        toast({ title: "حذف ناموفق", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطای شبکه", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const replyTo = (m: Message) => {
    const subject = encodeURIComponent(`پاسخ: ${m.subject}`);
    const body = encodeURIComponent(`سلام ${m.name} عزیز،\n\n`);
    window.location.href = `mailto:${m.email}?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto p-6 rounded-3xl dialog-accent">
        {!authed ? (
          <>
            <DialogHeader>
              <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/30 grid place-items-center text-brand mb-2 mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <DialogTitle className="text-center">ورود مدیر</DialogTitle>
              <DialogDescription className="text-center">
                برای دیدن پیام‌های دریافتی، کلید مدیریتی را وارد کنید.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={unlock} className="space-y-4 mt-2">
              <input
                type="password"
                dir="ltr"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="admin key"
                aria-label="کلید مدیریتی"
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-left outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20 transition-all font-mono min-h-[46px]"
              />
              <button
                type="submit"
                disabled={checking || !key.trim()}
                className="btn-shine w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand text-primary-foreground font-bold px-6 py-3 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none min-h-[46px]"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال بررسی...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    ورود به پنل
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-brand" />
                صندوق پیام‌ها
                {unread > 0 && (
                  <span className="text-[11px] font-bold bg-brand text-primary-foreground rounded-full px-2.5 py-0.5">
                    {fa(unread)} خوانده‌نشده
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>مجموع {fa(total)} پیام از فرم تماس</DialogDescription>
            </DialogHeader>

            {/* Tabs */}
            <div className="flex items-center gap-1 rounded-2xl border border-border bg-secondary/60 p-1 mt-1" role="tablist" aria-label="فیلتر پیام‌ها">
              {(
                [
                  { id: "all", label: "همه" },
                  { id: "unread", label: unread > 0 ? `خوانده‌نشده (${fa(unread)})` : "خوانده‌نشده" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => switchTab(t.id)}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-bold transition-all min-h-[36px]",
                    tab === t.id
                      ? "bg-brand text-primary-foreground chip-active"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-10 grid place-items-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {tab === "unread" ? "همه پیام‌ها خوانده شده‌اند 🎉" : "هنوز پیامی دریافت نشده."}
                </p>
              </div>
            ) : (
              <ul className="space-y-3 mt-1">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className={cn(
                      "rounded-2xl border p-4 transition-all",
                      m.read
                        ? "border-border bg-card"
                        : "border-brand/40 bg-brand/5 shadow-[0_0_18px_-8px_var(--brand-glow)]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">
                          {m.name}
                          <span dir="ltr" className="font-mono text-[11px] text-muted-foreground mr-2">
                            {m.email}
                          </span>
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-0.5">
                        {/* Read / unread toggle */}
                        <button
                          onClick={() => (m.read ? markUnread(m) : markRead(m))}
                          aria-label={m.read ? "علامت‌گذاری خوانده‌نشده" : "علامت‌گذاری خوانده‌شده"}
                          disabled={busyId === m.id}
                          className={cn(
                            "w-8 h-8 rounded-lg grid place-items-center transition-all",
                            m.read
                              ? "text-muted-foreground/50 hover:text-brand"
                              : "text-brand hover:bg-brand/15"
                          )}
                        >
                          {busyId === m.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : m.read ? (
                            <MailOpen className="w-4 h-4" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                        </button>
                        {/* Reply via mailto */}
                        <a
                          href={`mailto:${m.email}?subject=${encodeURIComponent(`پاسخ: ${m.subject}`)}`}
                          onClick={(e) => {
                            e.preventDefault();
                            replyTo(m);
                          }}
                          aria-label="پاسخ با ایمیل"
                          title="پاسخ با ایمیل"
                          className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground/60 hover:text-brand hover:bg-brand/10 transition-all"
                        >
                          <Reply className="w-4 h-4 -scale-x-100" />
                        </a>
                        {/* Delete with confirm step */}
                        {confirmDeleteId === m.id ? (
                          <span className="flex items-center gap-0.5">
                            <button
                              onClick={() => deleteMessage(m)}
                              aria-label="تأیید حذف"
                              title="تأیید حذف"
                              disabled={busyId === m.id}
                              className="w-8 h-8 rounded-lg grid place-items-center text-destructive hover:bg-destructive/15 transition-all"
                            >
                              {busyId === m.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              aria-label="انصراف"
                              title="انصراف"
                              className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground/60 hover:text-foreground transition-all"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(m.id)}
                            aria-label="حذف پیام"
                            title="حذف"
                            className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-brand mb-1">{m.subject}</p>
                    <p className="text-sm text-foreground/90 leading-7 whitespace-pre-wrap">
                      {m.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-2">{formatDate(m.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}

            {/* Pagination */}
            {totalPages > 1 && !loading && (
              <div className="flex items-center justify-center gap-3 pt-3 pb-1">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  aria-label="صفحه قبل"
                  className="w-9 h-9 grid place-items-center rounded-xl border border-border text-muted-foreground hover:text-brand hover:border-brand/50 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  صفحه {fa(page)} از {fa(totalPages)}
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  aria-label="صفحه بعد"
                  className="w-9 h-9 grid place-items-center rounded-xl border border-border text-muted-foreground hover:text-brand hover:border-brand/50 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
