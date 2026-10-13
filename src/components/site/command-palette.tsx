"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
  Search,
  SearchX,
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
import { coverSrc } from "@/components/site/project-cover";
import { pickEn, useT } from "@/lib/i18n";
import type { Article, Project } from "@/lib/types";

// Same Persian normalization as the API (ي→ی ك→ک + ZWNJ → space)
const norm = (s: string) =>
  s.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/‌/g, " ").trim().toLowerCase();

/** Rounded gradient tile behind every result icon — the palette's visual unit. */
function Tile({ children, emoji = false }: { children: React.ReactNode; emoji?: boolean }) {
  return (
    <span className={emoji ? "palette-tile palette-tile-emoji" : "palette-tile"} aria-hidden>
      {children}
    </span>
  );
}

/** Mini banner of the project's AI cover art (falls back to the emoji tile). */
function ProjectThumb({ project }: { project: Project }) {
  const src = coverSrc(project.slug);
  if (!src) return <Tile emoji>{project.icon}</Tile>;
  return (
    <span className="palette-thumb" aria-hidden>
      <Image src={src} alt="" width={116} height={84} className="h-full w-full object-cover" />
    </span>
  );
}

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
      showCloseButton={false}
      className="command-palette max-w-2xl rounded-[1.75rem] dialog-accent border-0"
    >
      {/* Custom search header — gradient icon tile + input + ESC chip */}
      <div className="palette-search">
        <span className="palette-search-tile" aria-hidden>
          <Search className="h-[1.05rem] w-[1.05rem]" />
        </span>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={t("misc", "palette.placeholder")}
          className="h-11 text-[1.02rem]"
        />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="palette-esc"
          aria-label={t("misc", "palette.esc")}
          title={t("misc", "palette.esc")}
        >
          ESC
        </button>
      </div>

      <CommandList dir={dir}>
        {/* Rich empty state */}
        <CommandEmpty className="palette-empty">
          <span className="palette-empty-orb" aria-hidden>
            <SearchX className="h-6 w-6" />
          </span>
          <span className="text-sm font-extrabold">{t("misc", "palette.empty.title")}</span>
          <span className="max-w-[38ch] text-center text-[11.5px] leading-relaxed text-muted-foreground">
            {t("misc", "palette.empty.desc")}
          </span>
        </CommandEmpty>

        {filteredViews.length > 0 && (
          <CommandGroup heading={t("misc", "palette.group.nav")}>
            {filteredViews.map((v) => (
              <CommandItem key={v.hash} value={v.hash} onSelect={() => go(v.hash)}>
                <Tile>
                  <v.icon />
                </Tile>
                <span className="text-[13.5px] font-semibold">{v.label}</span>
                <CommandShortcut>
                  <kbd className="palette-kbd">{v.hint}</kbd>
                </CommandShortcut>
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
                  <Tile>
                    <a.icon />
                  </Tile>
                  <span className="text-[13.5px] font-semibold">{a.label}</span>
                  {a.hint && (
                    <CommandShortcut>
                      <kbd className="palette-kbd">{a.hint}</kbd>
                    </CommandShortcut>
                  )}
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
                  <ProjectThumb project={p} />
                  <span className="min-w-0 flex-grow">
                    <span className="block truncate text-[13px] font-bold">
                      {pickEn(lang, p.titleEn, p.title)}
                    </span>
                    {/* one-line teaser so results are self-explanatory */}
                    <span dir="auto" className="block truncate text-[10.5px] text-muted-foreground">
                      {pickEn(lang, p.descriptionEn, p.description)}
                    </span>
                  </span>
                  <CommandShortcut
                    dir="ltr"
                    className="palette-repo max-w-[30%] shrink-0 truncate"
                  >
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
                  <Tile emoji>{a.icon}</Tile>
                  <span className="min-w-0 flex-grow">
                    <span className="block truncate text-[13px] font-bold">
                      {pickEn(lang, a.titleEn, a.title)}
                    </span>
                    <span dir="auto" className="block truncate text-[10.5px] text-muted-foreground">
                      {pickEn(lang, a.excerptEn, a.excerpt)}
                    </span>
                  </span>
                  <CommandShortcut>
                    <kbd className="palette-kbd palette-kbd-wide gap-1">
                      <FileText className="h-3 w-3" />
                      {t("misc", "palette.badge.article")}
                    </kbd>
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

      </CommandList>

      {/* Footer — indexed counts + navigation keys, fixed below the scrolling list */}
      <div className="command-palette-foot">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[10.5px] font-semibold text-muted-foreground">
          <Sparkles className="h-3 w-3 shrink-0 text-brand" aria-hidden />
          <span className="truncate">
            {t("misc", "palette.indexed", {
              n: num(projects.length),
              m: num(articles.length),
            })}
          </span>
        </span>
        <span className="palette-foot-keys" dir="ltr">
          <span className="inline-flex items-center gap-1">
            <kbd className="palette-kbd">↑</kbd>
            <kbd className="palette-kbd">↓</kbd>
            {t("misc", "palette.hint.nav")}
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="palette-kbd">↵</kbd>
            {t("misc", "palette.hint")}
          </span>
        </span>
      </div>
    </CommandDialog>
  );
}
