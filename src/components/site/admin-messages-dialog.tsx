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
  BarChart3,
  Eye,
  Heart,
  MessageSquare,
  CalendarClock,
  FolderGit2,
  FileText,
  RefreshCw,
  Users,
  Download,
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
import { useT, pickEn } from "@/lib/i18n";

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

type TopProject = {
  slug: string;
  title: string;
  titleEn?: string | null;
  icon: string;
  views: number;
  category: string;
};

type TopArticle = {
  slug: string;
  title: string;
  titleEn?: string | null;
  icon: string;
  views: number;
  likes: number;
};

type StatsPayload = {
  totals: {
    visits: number;
    projectViews: number;
    projects: number;
    articles: number;
    messages: number;
    unread: number;
    messagesLastWeek: number;
    likes: number;
    subscribers: number;
  };
  topProjects: TopProject[];
  topArticles: TopArticle[];
  generatedAt: string;
};

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

function AdminStatsPanel({ apiKey }: { apiKey: string }) {
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const { t, num, lang } = useT();

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-key": apiKey },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(String(res.status));
      setStats((await res.json()) as StatsPayload);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="py-14 grid place-items-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (failed || !stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm mb-4">{t("admin", "statsFailed")}</p>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand rounded-full border border-brand/30 bg-brand/10 px-4 py-2 hover:bg-brand/20 transition-all min-h-[34px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t("admin", "retry")}
        </button>
      </div>
    );
  }

  const totals = stats.totals;
  // Comments feature was removed from the site — no comments tile here.
  const tiles = [
    { icon: Eye, label: t("admin", "tileVisits"), value: totals.visits },
    { icon: FolderGit2, label: t("admin", "tileProjectViews"), value: totals.projectViews },
    { icon: Heart, label: t("admin", "tileLikes"), value: totals.likes },
    {
      icon: MessageSquare,
      label: t("admin", "tileMessages"),
      value: totals.messages,
      hint: t("admin", "unreadCount", { n: num(totals.unread) }),
    },
    { icon: CalendarClock, label: t("admin", "tileMessagesWeek"), value: totals.messagesLastWeek },
    { icon: FolderGit2, label: t("admin", "tileProjects"), value: totals.projects },
    { icon: FileText, label: t("admin", "tileArticles"), value: totals.articles },
    { icon: Users, label: t("admin", "tileSubscribers"), value: totals.subscribers },
  ];

  const maxProjectViews = Math.max(1, ...stats.topProjects.map((p) => p.views));
  const maxArticleViews = Math.max(1, ...stats.topArticles.map((a) => a.views));

  const exportSubscribersCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/subscribers", {
        headers: { "x-admin-key": apiKey },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { subscribers?: { email: string; createdAt: string }[] };
      const subs = data.subscribers ?? [];
      if (subs.length === 0) {
        toast({ title: t("admin", "exportEmpty"), description: t("admin", "exportEmptyDesc") });
        return;
      }
      const rows: string[][] = [
        ["email", "joinedAt"],
        ...subs.map((s) => [s.email, s.createdAt]),
      ];
      // BOM so Excel opens UTF-8 correctly
      const csv =
        "\uFEFF" +
        rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast({
        title: t("admin", "exportOk"),
        description: t("admin", "exportOkDesc", { n: num(subs.length) }),
      });
    } catch {
      toast({
        title: t("admin", "exportFail"),
        description: t("admin", "exportFailDesc"),
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {tiles.map((tile) => (
          <div key={tile.label} className="stat-tile">
            <div className="flex items-center gap-1.5 mb-1">
              <tile.icon className="w-3.5 h-3.5 text-brand" aria-hidden />
              <span className="stat-label">{tile.label}</span>
            </div>
            <p className="stat-value">{num(tile.value)}</p>
            {tile.hint && <p className="text-[10px] text-muted-foreground mt-0.5">{tile.hint}</p>}
          </div>
        ))}
      </div>

      {/* Top projects */}
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <h4 className="flex items-center gap-2 text-sm font-extrabold mb-3">
          <FolderGit2 className="w-4 h-4 text-brand" />
          {t("admin", "topProjects")}
        </h4>
        <ul className="space-y-3">
          {stats.topProjects.map((p, i) => (
            <li key={p.slug}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold truncate">
                  <span aria-hidden className="me-1">{p.icon}</span>
                  {pickEn(lang, p.titleEn, p.title)}
                </span>
                <span className="text-[11px] font-bold text-brand shrink-0 tabular-nums">
                  {num(p.views)} 👁️
                </span>
              </div>
              <div className="top-bar">
                <span style={{ width: `${Math.max(6, (p.views / maxProjectViews) * 100)}%` }} />
              </div>
              {i === 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">{t("admin", "topLeader")}</p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Top articles */}
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <h4 className="flex items-center gap-2 text-sm font-extrabold mb-3">
          <FileText className="w-4 h-4 text-brand" />
          {t("admin", "topArticles")}
        </h4>
        <ul className="space-y-3">
          {stats.topArticles.map((a) => (
            <li key={a.slug}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold truncate">
                  <span aria-hidden className="me-1">{a.icon}</span>
                  {pickEn(lang, a.titleEn, a.title)}
                </span>
                <span className="flex items-center gap-2 shrink-0 text-[11px] font-bold tabular-nums">
                  <span className="text-brand">{num(a.views)} 👁️</span>
                  <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                    <Heart className="w-3 h-3 fill-brand text-brand" /> {num(a.likes)}
                  </span>
                </span>
              </div>
              <div className="top-bar">
                <span style={{ width: `${Math.max(6, (a.views / maxArticleViews) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Newsletter export */}
      <div className="rounded-2xl border border-border bg-card/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-grow min-w-0">
          <h4 className="flex items-center gap-2 text-sm font-extrabold">
            <Users className="w-4 h-4 text-brand" />
            {t("admin", "exportTitle")}
          </h4>
          <p className="text-[11px] text-muted-foreground mt-1 leading-5">
            {t("admin", "exportDesc")}
          </p>
        </div>
        <button
          onClick={exportSubscribersCsv}
          disabled={exporting}
          className="btn-shine shrink-0 inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl bg-brand text-primary-foreground px-4 py-2.5 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 min-h-[38px]"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Download className="w-4 h-4" aria-hidden />}
          {t("admin", "exportCsv")}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          {t("admin", "lastUpdate")}{" "}
          {new Date(stats.generatedAt).toLocaleTimeString(lang === "fa" ? "fa-IR" : "en-US")}
        </p>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1.5 hover:bg-brand/20 active:scale-95 transition-all min-h-[30px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t("admin", "refresh")}
        </button>
      </div>
    </div>
  );
}

export function AdminMessagesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const { t, num, isRtl, date } = useT();
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
  const [panel, setPanel] = useState<"inbox" | "stats">("inbox");

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setAuthed(false);
      setKey("");
      setMessages([]);
      setPage(1);
      setTab("all");
      setConfirmDeleteId(null);
      setPanel("inbox");
    }
  }, [open]);

  const fmtDate = (iso: string) => {
    try {
      return date(iso, DATE_OPTS);
    } catch {
      return iso;
    }
  };

  const fetchList = useCallback(
    async (opts?: { page?: number; tab?: "all" | "unread" }) => {
      const p = opts?.page ?? page;
      const tb = opts?.tab ?? tab;
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(p), pageSize: "8", filter: tb });
        const res = await fetch(`/api/admin/messages?${params.toString()}`, {
          headers: { "x-admin-key": key.trim() },
          cache: "no-store",
        });
        if (res.status === 401) {
          toast({
            title: t("admin", "badKey"),
            description: t("admin", "badKeyDesc"),
            variant: "destructive",
          });
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
          title: t("admin", "networkTitle"),
          description: t("admin", "networkDesc"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [key, page, tab, toast, t]
  );

  const unlock = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!key.trim() || checking) return;
    setChecking(true);
    await fetchList({ page: 1, tab: "all" });
    setChecking(false);
  };

  const switchTab = (tb: "all" | "unread") => {
    setTab(tb);
    fetchList({ page: 1, tab: tb });
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
        toast({
          title: t("admin", "deleted"),
          description: t("admin", "deletedDesc", { s: m.subject }),
        });
        setConfirmDeleteId(null);
        fetchList();
      } else {
        toast({ title: t("admin", "deleteFailed"), variant: "destructive" });
      }
    } catch {
      toast({ title: t("admin", "networkTitle"), variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const replyTo = (m: Message) => {
    const subject = encodeURIComponent(t("admin", "replySubject", { s: m.subject }));
    const body = encodeURIComponent(`${t("admin", "replyBody", { name: m.name })}\n\n`);
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
              <DialogTitle className="text-center">{t("admin", "login")}</DialogTitle>
              <DialogDescription className="text-center">
                {t("admin", "loginDesc")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={unlock} className="space-y-4 mt-2">
              <input
                type="password"
                dir="ltr"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="admin key"
                aria-label={t("admin", "keyAria")}
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
                    {t("admin", "checking")}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    {t("admin", "enter")}
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
                {t("admin", "panel")}
                {unread > 0 && (
                  <span className="text-[11px] font-bold bg-brand text-primary-foreground rounded-full px-2.5 py-0.5">
                    {t("admin", "unreadCount", { n: num(unread) })}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>
                {panel === "inbox"
                  ? t("admin", "inboxDesc", { n: num(total) })
                  : t("admin", "statsDesc")}
              </DialogDescription>
            </DialogHeader>

            {/* Panel tabs */}
            <div
              className="flex items-center gap-1 rounded-2xl border border-border bg-secondary/60 p-1 mt-1"
              role="tablist"
              aria-label={t("admin", "tabsAria")}
            >
              {(
                [
                  { id: "inbox", label: t("admin", "tabInbox"), icon: Inbox },
                  { id: "stats", label: t("admin", "tabStats"), icon: BarChart3 },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={panel === p.id}
                  onClick={() => setPanel(p.id)}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all min-h-[36px]",
                    panel === p.id
                      ? "bg-brand text-primary-foreground chip-active"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <p.icon className="w-3.5 h-3.5" aria-hidden />
                  {p.label}
                </button>
              ))}
            </div>

            {panel === "stats" ? (
              <AdminStatsPanel apiKey={key.trim()} />
            ) : loading ? (
              <div className="py-10 grid place-items-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {tab === "unread" ? t("admin", "allRead") : t("admin", "noMessages")}
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
                          <span dir="ltr" className="font-mono text-[11px] text-muted-foreground ms-2">
                            {m.email}
                          </span>
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-0.5">
                        {/* Read / unread toggle */}
                        <button
                          onClick={() => (m.read ? markUnread(m) : markRead(m))}
                          aria-label={m.read ? t("admin", "markUnread") : t("admin", "markRead")}
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
                          href={`mailto:${m.email}?subject=${encodeURIComponent(t("admin", "replySubject", { s: m.subject }))}`}
                          onClick={(e) => {
                            e.preventDefault();
                            replyTo(m);
                          }}
                          aria-label={t("admin", "replyAria")}
                          title={t("admin", "replyAria")}
                          className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground/60 hover:text-brand hover:bg-brand/10 transition-all"
                        >
                          <Reply className={`w-4 h-4 ${isRtl ? "-scale-x-100" : ""}`} />
                        </a>
                        {/* Delete with confirm step */}
                        {confirmDeleteId === m.id ? (
                          <span className="flex items-center gap-0.5">
                            <button
                              onClick={() => deleteMessage(m)}
                              aria-label={t("admin", "confirmDelete")}
                              title={t("admin", "confirmDelete")}
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
                              aria-label={t("admin", "cancel")}
                              title={t("admin", "cancel")}
                              className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground/60 hover:text-foreground transition-all"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(m.id)}
                            aria-label={t("admin", "deleteMessage")}
                            title={t("admin", "deleteShort")}
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
                    <p className="text-[11px] text-muted-foreground mt-2">{fmtDate(m.createdAt)}</p>
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
                  aria-label={t("admin", "prevPage")}
                  className="w-9 h-9 grid place-items-center rounded-xl border border-border text-muted-foreground hover:text-brand hover:border-brand/50 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t("admin", "pageOf", { n: num(page), m: num(totalPages) })}
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  aria-label={t("admin", "nextPage")}
                  className="w-9 h-9 grid place-items-center rounded-xl border border-border text-muted-foreground hover:text-brand hover:border-brand/50 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
