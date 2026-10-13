"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Home,
  FolderKanban,
  PenLine,
  FolderDown,
  Mail,
  Moon,
  Dices,
  Keyboard,
  LockKeyhole,
  Bot,
  FileText,
  Sparkles,
  Star,
  History,
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
import { pickEn, useT } from "@/lib/i18n";
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
  const { t, num, lang, dir } = useT();

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
      { icon: Home, label: t("misc", "palette.nav.home"), hint: num(1), hash: "#home" },
      { icon: FolderKanban, label: t("misc", "palette.nav.projects"), hint: num(2), hash: "#projects" },
      { icon: PenLine, label: t("misc", "palette.nav.articles"), hint: num(3), hash: "#writing" },
      { icon: FolderDown, label: t("misc", "palette.nav.repos"), hint: num(4), hash: "#repos" },
      { icon: Mail, label: t("misc", "palette.nav.contact"), hint: num(5), hash: "#contact" },
    ],
    [t, num]
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
      { icon: Moon, label: t("misc", "palette.quick.theme"), hint: t("misc", "palette.quick.theme.hint"), run: () => runAction("toggle-site-theme") },
      { icon: Dices, label: t("misc", "palette.quick.random"), hint: "", run: randomProject },
      {
        icon: Star,
        label: t("misc", "palette.quick.favorites"),
        hint: "",
        run: () => {
          go("#projects");
          // let the projects view mount, then switch it to favorites mode
          window.setTimeout(() => window.dispatchEvent(new CustomEvent("toggle-projects-favorites")), 350);
        },
      },
      {
        icon: History,
        label: t("misc", "palette.quick.history"),
        hint: "",
        run: () => {
          go("#writing");
          // let the writing view mount, then open the history panel
          window.setTimeout(() => window.dispatchEvent(new CustomEvent("imsoroush-open-history")), 350);
        },
      },
      { icon: Keyboard, label: t("misc", "palette.quick.shortcuts"), hint: t("misc", "palette.quick.shortcuts.hint"), run: () => runAction("open-shortcuts") },
      { icon: LockKeyhole, label: t("misc", "palette.quick.admin"), hint: "", run: () => runAction("open-admin-panel") },
    ],
    [t, randomProject, runAction, go]
  );

  const filteredActions = actionItems.filter((a) => matches([a.label]));
  const showActions = q ? filteredActions.length > 0 : true;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={t("misc", "palette.title")}
      description={t("misc", "palette.description")}
      shouldFilter={false}
      className="command-palette max-w-xl rounded-3xl dialog-accent border-0"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t("misc", "palette.placeholder")}
      />
      <CommandList dir={dir}>
        <CommandEmpty>{t("misc", "palette.noResults")}</CommandEmpty>

        {filteredViews.length > 0 && (
          <CommandGroup heading={t("misc", "palette.group.nav")}>
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
            <CommandGroup heading={t("misc", "palette.group.actions")}>
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
            <CommandGroup heading={t("misc", "palette.group.projects")}>
              {filteredProjects.map((p) => (
                <CommandItem
                  key={p.slug}
                  value={`p-${p.slug}`}
                  onSelect={() => go(`#/projects/${encodeURIComponent(p.slug)}`)}
                  className="items-center gap-3 py-2"
                >
                  <span className="palette-item-icon text-lg leading-none" aria-hidden>
                    {p.icon}
                  </span>
                  <span className="min-w-0 flex-grow">
                    <span className="block truncate text-[13px] font-bold">
                      {pickEn(lang, p.titleEn, p.title)}
                    </span>
                    {/* one-line teaser so results are self-explanatory */}
                    <span dir="auto" className="block truncate text-[10.5px] text-muted-foreground">
                      {pickEn(lang, p.descriptionEn, p.description)}
                    </span>
                  </span>
                  <CommandShortcut dir="ltr" className="font-mono text-[10px] truncate max-w-[32%]">
                    {p.repo.split("/").pop()}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredArticles.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t("misc", "palette.group.articles")}>
              {filteredArticles.map((a) => (
                <CommandItem
                  key={a.slug}
                  value={`a-${a.slug}`}
                  onSelect={() => go(`#/writing/${encodeURIComponent(a.slug)}`)}
                  className="items-center gap-3 py-2"
                >
                  <span className="palette-item-icon text-lg leading-none" aria-hidden>
                    {a.icon}
                  </span>
                  <span className="min-w-0 flex-grow">
                    <span className="block truncate text-[13px] font-bold">
                      {pickEn(lang, a.titleEn, a.title)}
                    </span>
                    <span dir="auto" className="block truncate text-[10.5px] text-muted-foreground">
                      {pickEn(lang, a.excerptEn, a.excerpt)}
                    </span>
                  </span>
                  <CommandShortcut>
                    <span className="inline-flex items-center gap-1 text-[10px]">
                      <FileText className="w-3 h-3" />
                      {t("misc", "palette.badge.article")}
                    </span>
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

      </CommandList>

      {/* footer hint — fixed below the scrolling list */}
      <div className="command-palette-foot px-4 py-2.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-brand" />
          {t("misc", "palette.indexed", {
            n: num(projects.length),
            m: num(articles.length),
          })}
        </span>
        <span className="inline-flex items-center gap-1.5" dir="ltr">
          <kbd className="palette-hint-kbd">↵</kbd>
          {t("misc", "palette.hint")}
        </span>
      </div>
    </CommandDialog>
  );
}
