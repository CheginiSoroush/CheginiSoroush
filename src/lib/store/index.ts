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
 */
export function adminKey(): string {
  return process.env.ADMIN_KEY || "imsoroush-admin";
}

export function isAdminRequest(request: Request): boolean {
  const provided = request.headers.get("x-admin-key") ?? "";
  return provided.length > 0 && provided === adminKey();
}
