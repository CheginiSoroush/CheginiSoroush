"use client";

import { useEffect, useState } from "react";
import { Lock, MailOpen, Mail, Loader2, ShieldCheck, Inbox } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
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
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setAuthed(false);
      setKey("");
      setMessages([]);
    }
  }, [open]);

  const unlock = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!key.trim() || checking) return;
    setChecking(true);
    try {
      const res = await fetch("/api/admin/messages", {
        headers: { "x-admin-key": key.trim() },
      });
      if (res.status === 401) {
        toast({
          title: "کلید اشتباه است",
          description: "کلید مدیریتی درست نیست.",
          variant: "destructive",
        });
        return;
      }
      const data = (await res.json()) as { messages?: Message[] };
      setMessages(data.messages ?? []);
      setAuthed(true);
    } catch {
      toast({
        title: "خطای شبکه",
        description: "اتصال برقرار نشد، دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const markRead = async (m: Message) => {
    if (m.read || markingId === m.id) return;
    setMarkingId(m.id);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": key.trim() },
        body: JSON.stringify({ id: m.id, read: true }),
      });
      if (res.ok) {
        setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, read: true } : x)));
      }
    } catch {
      // ignore
    } finally {
      setMarkingId(null);
    }
  };

  const unread = messages.filter((m) => !m.read).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto p-6 rounded-3xl">
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
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand text-primary-foreground font-bold px-6 py-3 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none min-h-[46px]"
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
                    {unread.toLocaleString("fa-IR")} خوانده‌نشده
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>
                مجموع {messages.length.toLocaleString("fa-IR")} پیام از فرم تماس
              </DialogDescription>
            </DialogHeader>

            {loading ? (
              <div className="py-10 grid place-items-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">هنوز پیامی دریافت نشده.</p>
              </div>
            ) : (
              <ul className="space-y-3 mt-2">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className={`rounded-2xl border p-4 transition-all ${
                      m.read
                        ? "border-border bg-card"
                        : "border-brand/40 bg-brand/5 shadow-[0_0_18px_-8px_var(--brand-glow)]"
                    }`}
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
                      <button
                        onClick={() => markRead(m)}
                        aria-label={m.read ? "خوانده شده" : "علامت‌گذاری خوانده‌شده"}
                        disabled={m.read || markingId === m.id}
                        className={`shrink-0 w-8 h-8 rounded-lg grid place-items-center transition-all ${
                          m.read
                            ? "text-muted-foreground/40"
                            : "text-brand hover:bg-brand/15 disabled:opacity-50"
                        }`}
                      >
                        {markingId === m.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : m.read ? (
                          <MailOpen className="w-4 h-4" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                      </button>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
