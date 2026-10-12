"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Home,
  FolderKanban,
  PenLine,
  Mail,
  Moon,
  Dices,
  Keyboard,
  LockKeyhole,
  Bot,
  FileText,
  Sparkles,
  CornerDownLeft,
  Star,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import type { Article, Project } from "@/lib/types";

// Same Persian normalization as the API (ي→ی ك→ک + ZWNJ → space)
const norm = (s: string) =>
  s.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/‌/g, " ").trim().toLowerCase();

export function CommandPalette({
  projects,
  articles,
}: {
  projects: Project[];
  articles: Article[];
}) {
  const [open, setOpen] = useState(false);

  // Global ⌘K / Ctrl+K toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    const onOpen = () => setOpen(true);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  const go = useCallback((hash: string) => {
    setOpen(false);
    if (window.location.hash === hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      // re-trigger the same route detail if it is already active
      window.dispatchEvent(new Event("hashchange"));
    } else {
      window.location.hash = hash;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const runAction = useCallback((name: string) => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent(name));
  }, []);

  const randomProject = useCallback(() => {
    if (projects.length === 0) return;
    const p = projects[Math.floor(Math.random() * projects.length)];
    go(`#/projects/${encodeURIComponent(p.slug)}`);
  }, [projects, go]);

  const [query, setQuery] = useState("");
  const q = norm(query);
  const tokens = q ? q.split(/\s+/) : [];

  const matches = useCallback(
    (haystacks: (string | undefined)[]) => {
      if (tokens.length === 0) return true;
      const hay = norm(haystacks.filter(Boolean).join(" "));
      return tokens.every((t) => hay.includes(t));
    },
    [tokens]
  );

  const viewItems = useMemo(
    () => [
      { icon: Home, label: "خانه", hint: "۱", hash: "#home" },
      { icon: FolderKanban, label: "پروژه‌ها", hint: "۲", hash: "#projects" },
      { icon: PenLine, label: "نوشته‌ها", hint: "۳", hash: "#writing" },
      { icon: Mail, label: "تماس با من", hint: "۴", hash: "#contact" },
    ],
    []
  );

  const filteredViews = viewItems.filter((v) => matches([v.label]));
  const filteredProjects = useMemo(
    () =>
      projects
        .filter((p) => matches([p.title, p.repo, p.description, p.tags.join(" ")]))
        .slice(0, 12),
    [projects, matches]
  );
  const filteredArticles = useMemo(
    () => articles.filter((a) => matches([a.title, a.excerpt, a.category])),
    [articles, matches]
  );

  const actionItems = useMemo(
    () => [
      { icon: Moon, label: "تغییر تم روشن/تاریک", hint: "T", run: () => runAction("toggle-site-theme") },
      { icon: Dices, label: "پروژه تصادفی", hint: "", run: randomProject },
      {
        icon: Star,
        label: "نمایش علاقه‌مندی‌های من",
        hint: "",
        run: () => {
          go("#projects");
          // let the projects view mount, then switch it to favorites mode
          window.setTimeout(() => window.dispatchEvent(new CustomEvent("toggle-projects-favorites")), 350);
        },
      },
      { icon: Keyboard, label: "راهنمای میان‌برها", hint: "؟", run: () => runAction("open-shortcuts") },
      { icon: LockKeyhole, label: "پنل مدیریت", hint: "", run: () => runAction("open-admin-panel") },
    ],
    [randomProject, runAction, go]
  );

  const filteredActions = actionItems.filter((a) => matches([a.label]));
  const showActions = q ? filteredActions.length > 0 : true;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="پالت فرمان"
      description="جستجو در پروژه‌ها، نوشته‌ها و اقدامات سریع"
      shouldFilter={false}
      className="command-palette max-w-xl rounded-3xl dialog-accent border-0"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="جستجو کنید: پروژه، نوشته، اقدام..."
      />
      <CommandList dir="rtl">
        <CommandEmpty>نتیجه‌ای یافت نشد — عبارت دیگری امتحان کنید.</CommandEmpty>

        {filteredViews.length > 0 && (
          <CommandGroup heading="ناوبری">
            {filteredViews.map((v) => (
              <CommandItem key={v.hash} value={v.hash} onSelect={() => go(v.hash)}>
                <v.icon className="text-brand" />
                <span>{v.label}</span>
                <CommandShortcut>{v.hint}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {showActions && filteredActions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="اقدامات سریع">
              {filteredActions.map((a) => (
                <CommandItem key={a.label} value={a.label} onSelect={a.run}>
                  <a.icon className="text-brand" />
                  <span>{a.label}</span>
                  {a.hint && <CommandShortcut>{a.hint}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredProjects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="پروژه‌ها">
              {filteredProjects.map((p) => (
                <CommandItem
                  key={p.slug}
                  value={`p-${p.slug}`}
                  onSelect={() => go(`#/projects/${encodeURIComponent(p.slug)}`)}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {p.icon}
                  </span>
                  <span className="truncate">{p.title}</span>
                  <CommandShortcut dir="ltr" className="font-mono text-[10px] truncate max-w-[38%]">
                    {p.repo}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredArticles.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="نوشته‌ها">
              {filteredArticles.map((a) => (
                <CommandItem
                  key={a.slug}
                  value={`a-${a.slug}`}
                  onSelect={() => go(`#/writing/${encodeURIComponent(a.slug)}`)}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {a.icon}
                  </span>
                  <span className="truncate">{a.title}</span>
                  <CommandShortcut>
                    <span className="inline-flex items-center gap-1 text-[10px]">
                      <FileText className="w-3 h-3" />
                      نوشته
                    </span>
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

      </CommandList>

      {/* footer hint — fixed below the scrolling list */}
      <div className="command-palette-foot border-t border-border px-4 py-2.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-brand" />
          {projects.length.toLocaleString("fa-IR")} پروژه و{" "}
          {articles.length.toLocaleString("fa-IR")} نوشته ایندکس شده
        </span>
        <span className="inline-flex items-center gap-1" dir="ltr">
          <CornerDownLeft className="w-3 h-3" />
          انتخاب
        </span>
      </div>
    </CommandDialog>
  );
}
