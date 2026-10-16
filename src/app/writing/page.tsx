import { redirect } from "next/navigation";

/**
 * `/writing` (no slug) — humans landing here want the article list, which
 * lives in the SPA's writing section. Redirect to the in-app view.
 */
export default function WritingIndexPage() {
  redirect("/#/writing");
}
