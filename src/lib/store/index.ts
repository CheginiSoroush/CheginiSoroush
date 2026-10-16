import type { DataStore } from "./store-contract";
import { prismaStore } from "./prisma-store";
import { d1Store } from "./d1-store";

export type {
  AdminStats,
  ArticleRow,
  ContactMessageRow,
  ListMessagesOpts,
  ListProjectsOpts,
  ProjectRow,
  SnapshotTable,
  SubscriberRow,
  TopArticleRow,
  TopProjectRow,
} from "./types";
export type { DataStore } from "./store-contract";

/**
 * Runtime detection:
 *  - Cloudflare Workers reports navigator.userAgent === "Cloudflare-Workers"
 *  - Node/bun report "Node.js/…" / "Bun/…"
 *
 * In dev (Node), `getCloudflareContext()` is never called — the d1-store module
 * only imports it, which is side-effect free.
 */
export const isWorkersRuntime =
  typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

export const store: DataStore = isWorkersRuntime ? d1Store : prismaStore;

/**
 * Shared admin key lookup. On Workers, OpenNext populates `process.env` from
 * the worker's vars/secrets, so this works in both runtimes.
 *
 * Fail-closed: there is deliberately NO fallback key. Without ADMIN_KEY in
 * the environment every admin request is rejected — a leaked source tree
 * must never grant panel access.
 */
export function adminKey(): string | undefined {
  const key = process.env.ADMIN_KEY;
  return typeof key === "string" && key.length > 0 ? key : undefined;
}

export function isAdminRequest(request: Request): boolean {
  const expected = adminKey();
  if (!expected) return false;
  const provided = request.headers.get("x-admin-key") ?? "";
  return provided.length > 0 && provided === expected;
}
