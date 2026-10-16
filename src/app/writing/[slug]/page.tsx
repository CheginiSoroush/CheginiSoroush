import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Clock, ListTree, Rocket, ExternalLink } from "lucide-react";
import { store } from "@/lib/store";
import type { ArticleRow } from "@/lib/store/types";
import { ProjectCover } from "@/components/site/project-cover";
import { AuroraBackground } from "@/components/site/aurora-background";
import { ArticleComments } from "@/components/site/article-comments";
import {
  ArticleActions,
  ArticleMeta,
  ArticleViewBump,
  T,
} from "@/components/site/article-page-extras";
import { GITHUB_HANDLE, GITHUB_PROFILE_URL } from "@/lib/site-config";
import { demoHost } from "@/lib/demo-urls";

/**
 * Standalone, server-rendered article page — `/writing/<slug>`.
 *
 * WHY THIS EXISTS (the Option-1 SEO decision): the site body is a hash-routed
 * SPA, which Google indexes as a single URL (`/`). These real per-article
 * pages give every article its own crawlable, indexable URL with full HTML
 * content, canonical tags, article OG metadata and BlogPosting JSON-LD.
 * Sitemap, RSS and the JSON-LD graph all point at these permalinks, while
 * in-app navigation keeps the SPA reader dialog — both surfaces share the
 * same D1 data.
 */

export const dynamic = "force-dynamic";

const SITE_URL = "https://imsoroush.ir";

/** Persian script detection — per-article inLanguage hint (same as home). */
const isPersian = (s: string) => /[\u0600-\u06FF]/.test(s);

// Same anchor math as the SPA reader so heading ids stay identical everywhere.
const norm = (s: string) =>
  s.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/‌/g, " ").trim().toLowerCase();
const headingId = (text: string) => `sec-${norm(text).replace(/\s+/g, "-").slice(0, 60)}`;
const childrenText = (children: React.ReactNode): string => {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map((c) => (typeof c === "string" ? c : "")).join("");
  return String(children ?? "");
};

/** TOC source: level-3 headings (same rule as the SPA reader). */
function tocOf(content: string) {
  const out: { id: string; title: string }[] = [];
  const re = /^###\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const title = m[1].trim();
    out.push({ id: headingId(title), title });
  }
  return out;
}

const articlePath = (slug: string) => `/writing/${encodeURIComponent(slug)}`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  let article: ArticleRow | null = null;
  try {
    article = await store.getArticle(slug);
  } catch (error) {
    console.error("generateMetadata /writing/[slug] error:", error);
  }
  if (!article) return { title: "Article not found", robots: { index: false } };

  const title = article.titleEn ?? article.title;
  const description = article.excerptEn ?? article.excerpt;
  const path = articlePath(article.slug);
  return {
    title,
    description,
    alternates: { canonical: path },
    keywords: [title, article.titleEn ?? "", "Soroush Chegini"].filter(Boolean),
    openGraph: {
      title,
      description,
      url: path,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [SITE_URL],
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);

  let article: ArticleRow | null = null;
  let related: ArticleRow[] = [];
  try {
    article = await store.getArticle(slug);
    if (article) {
      const siblings = await store.listArticles(article.category);
      related = siblings.filter((a) => a.slug !== article!.slug).slice(0, 2);
    }
  } catch (error) {
    console.error("Failed to load article page:", error);
  }

  if (!article) notFound();

  const path = articlePath(article.slug);
  const canonical = `${SITE_URL}${path}`;
  const title = article.titleEn ?? article.title;
  const excerpt = article.excerptEn ?? article.excerpt;
  const toc = tocOf(article.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${canonical}#article`,
    headline: title,
    alternativeHeadline: article.titleEn ? article.title : undefined,
    description: excerpt,
    url: canonical,
    mainEntityOfPage: canonical,
    datePublished: article.publishedAt,
    inLanguage: isPersian(article.title) ? "fa-IR" : "en",
    author: { "@id": `${SITE_URL}/#person` },
    publisher: { "@id": `${SITE_URL}/#person` },
    isPartOf: { "@id": `${SITE_URL}/#blog` },
  };

  const markdownComponents = {
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 id={headingId(childrenText(children))} className="scroll-mt-24">
        {children}
      </h3>
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ArticleViewBump slug={article.slug} />

      <div className="relative min-h-screen flex flex-col overflow-x-clip">
        <AuroraBackground />

        {/* Slim sticky header — same brand identity as the SPA header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            <Link
              href="/"
              aria-label="Soroush Chegini"
              className="flex items-center gap-2.5 group"
            >
              <span className="relative w-9 h-9 shrink-0 grid place-items-center">
                <span className="absolute inset-0 blur-lg opacity-40 rounded-full bg-brand" aria-hidden />
                <Image
                  src="/photos/logo_dark.webp"
                  alt=""
                  width={44}
                  height={50}
                  className="relative w-full h-full object-contain hidden dark:block select-none drop-shadow-md"
                  draggable={false}
                />
                <Image
                  src="/photos/logo_light.webp"
                  alt=""
                  width={44}
                  height={50}
                  className="relative w-full h-full object-contain dark:hidden select-none drop-shadow-sm"
                  draggable={false}
                />
              </span>
              <span className="text-sm font-black tracking-tight group-hover:text-brand transition-colors">
                Soroush
              </span>
            </Link>
            <Link
              href="/#/writing"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-brand hover:border-brand/40 transition-all min-h-[38px]"
            >
              <T ns="articles" k="page.back" />
            </Link>
          </div>
        </header>

        <main className="relative flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pb-14 pt-6 sm:pt-8">
          <article>
            {/* generative hero cover — same art as the SPA reader dialog */}
            <div className="relative rounded-3xl overflow-hidden border border-border/70 shadow-sm">
              <ProjectCover
                slug={article.slug}
                category={article.category}
                idPrefix="artpage"
                className="h-36 sm:h-48 w-full"
                eager
              />
              <span
                className="absolute start-5 bottom-0 translate-y-1/2 text-4xl card-emoji drop-shadow-xl"
                aria-hidden
              >
                {article.icon}
              </span>
            </div>

            <div className="mt-9">
              <h1 className="text-2xl sm:text-4xl font-black leading-[1.35] tracking-tight">
                {title}
              </h1>
              <p className="mt-3 text-sm sm:text-base leading-8 text-muted-foreground">
                {excerpt}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-4">
              <ArticleMeta
                category={article.category}
                readTime={article.readTime}
                publishedAt={article.publishedAt}
              />
              <ArticleActions
                slug={article.slug}
                likes={article.likes}
                url={canonical}
                title={title}
              />
            </div>

            {/* live interactive demo — same emerald CTA as the SPA reader */}
            {article.demoUrl && (
              <a
                href={article.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={article.demoUrl}
                className="mt-6 flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 font-bold px-4 py-3 text-sm text-center text-emerald-600 sm:flex-row sm:gap-2 sm:px-6 sm:text-base dark:text-emerald-400 hover:-translate-y-0.5 active:scale-95 transition-all min-h-[46px]"
              >
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Rocket className="w-5 h-5 shrink-0" aria-hidden />
                  <T ns="articles" k="demo.live" />
                </span>
                <span dir="ltr" className="max-w-full truncate text-[11px] font-mono opacity-70">
                  {demoHost(article.demoUrl)}
                </span>
                <ExternalLink className="hidden w-4 h-4 opacity-60 shrink-0 sm:block" aria-hidden />
              </a>
            )}

            {/* static TOC — anchors only, works without JS */}
            {toc.length > 1 && (
              <nav className="toc-box mt-7">
                <p className="flex items-center gap-2 font-extrabold text-sm">
                  <ListTree className="w-4 h-4 text-brand" aria-hidden />
                  <T ns="articles" k="toc.title" />
                </p>
                <ol className="toc-list list-none space-y-0.5 mt-2">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="toc-link w-full text-start flex items-baseline gap-2.5 rounded-xl px-2.5 py-2 text-xs text-muted-foreground hover:text-brand hover:bg-brand/5 transition-all min-h-[34px]"
                      >
                        <span
                          className="shrink-0 w-5 h-5 grid place-items-center rounded-lg border border-brand/25 bg-brand/10 text-[10px] font-black text-brand"
                          aria-hidden
                        >
                          •
                        </span>
                        <span className="leading-6">{item.title}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* the article itself — real HTML for readers and crawlers */}
            <div className="prose-fa max-w-none mt-7">
              <ReactMarkdown components={markdownComponents}>{article.content}</ReactMarkdown>
            </div>

            <ArticleComments slug={article.slug} />

            {/* related articles — same category, links to their real pages */}
            {related.length > 0 && (
              <section className="mt-9">
                <h4 className="text-sm font-extrabold mb-2.5 flex items-center gap-2">
                  <T ns="articles" k="related.title" />
                </h4>
                <div className="grid sm:grid-cols-2 gap-2">
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      href={articlePath(r.slug)}
                      className="related-item text-start rounded-2xl border border-border bg-card px-3.5 py-3 flex items-center gap-3 hover:border-brand/40 transition-all min-h-[52px]"
                    >
                      <span
                        className="w-9 h-9 grid place-items-center rounded-xl bg-secondary text-xl shrink-0"
                        aria-hidden
                      >
                        {r.icon}
                      </span>
                      <span className="flex-grow min-w-0">
                        <span className="block text-xs font-bold truncate">
                          {r.titleEn ?? r.title}
                        </span>
                        <span className="block text-[10px] text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3 inline -mt-0.5" aria-hidden />{" "}
                          <T ns="articles" k="card.readTimeShort" vars={{ n: r.readTime }} />
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>
        </main>

        {/* minimal footer — sticks to the bottom on short pages via flex column */}
        <footer className="relative mt-auto border-t border-border/60 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p className="font-bold">
              <T ns="articles" k="page.footerTagline" />
            </p>
            <nav aria-label="Footer" className="flex items-center gap-4">
              <Link href="/" className="hover:text-brand transition-colors font-bold">
                <T ns="articles" k="page.backHome" />
              </Link>
              <a
                href={GITHUB_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand transition-colors font-bold"
              >
                {GITHUB_HANDLE}
              </a>
              <a href="/feed.xml" className="hover:text-brand transition-colors font-bold">
                RSS
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
