import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext → Cloudflare Workers configuration.
 *
 * The site is fully dynamic: pages render a client shell and all data comes
 * from /api/* routes (D1 + GitHub), so no ISR incremental-cache binding
 * (R2/KV/D1) is needed. Static assets and prerendered shells are served
 * through the ASSETS binding declared in wrangler.jsonc.
 */
export default defineCloudflareConfig({});
