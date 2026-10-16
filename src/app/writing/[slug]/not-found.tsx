import Link from "next/link";
import { BookOpen, Home } from "lucide-react";
import { AuroraBackground } from "@/components/site/aurora-background";
import { T } from "@/components/site/article-page-extras";

/**
 * Branded 404 for unknown article slugs under /writing/<slug> — keeps the
 * site's voice instead of Next's default unstyled page, and routes humans
 * back to the two useful places.
 */
export default function WritingNotFound() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-clip">
      <AuroraBackground />
      <main className="relative flex-1 grid place-items-center px-4">
        <div className="text-center max-w-sm">
          <span className="text-5xl" aria-hidden>
            📄
          </span>
          <h1 className="mt-4 text-xl sm:text-2xl font-black">
            <T ns="articles" k="page.notFoundTitle" />
          </h1>
          <p className="mt-2.5 text-sm leading-7 text-muted-foreground">
            <T ns="articles" k="page.notFoundDesc" />
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              href="/#/writing"
              className="btn-shine inline-flex items-center gap-2 rounded-xl bg-brand text-primary-foreground font-bold text-xs px-5 py-3 hover:-translate-y-0.5 active:scale-95 transition-all min-h-[44px]"
            >
              <BookOpen className="w-4 h-4" aria-hidden />
              <T ns="articles" k="page.notFoundBack" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/60 font-bold text-xs px-5 py-3 text-muted-foreground hover:text-brand hover:border-brand/40 transition-all min-h-[44px]"
            >
              <Home className="w-4 h-4" aria-hidden />
              <T ns="articles" k="page.backHome" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
