#!/usr/bin/env bash
# Cloudflare deployment pipeline for the imsoroush personal site.
#
# ALL pipeline logic lives in this version-controlled script (not in the
# workflow file) because pushing to .github/workflows requires a `workflow`
# token scope. The workflow is a thin wrapper that just runs this file —
# so future fixes only need a normal `git push`.
#
# Required repository secrets:
#   CLOUDFLARE_API_TOKEN   (template "Edit Cloudflare Workers" + Account→D1→Edit)
#   CLOUDFLARE_ACCOUNT_ID
# Optional:
#   ADMIN_KEY  → synced as Worker secret ADMIN_KEY
#   GH_PAT     → synced as Worker secret GITHUB_TOKEN (live GitHub stats + private repos)
set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN secret is not set}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID secret is not set}"

API="https://api.cloudflare.com/client/v4"
DB_NAME="imsoroush-db"

cf() {
  curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" "$@"
}

show_hint() {
  echo "HINT: error 10000/9109 from the API almost always means the token lacks a permission."
  echo "      → dash.cloudflare.com/profile/api-tokens → edit your token → add Permission:"
  echo "        Account → D1 → Edit   (and keep the Workers template permissions)"
}

echo "━━━ 1/6 Verify API token"
VERIFY=$(cf "$API/user/tokens/verify")
if [ "$(jq -r '.success' <<<"$VERIFY")" != "true" ]; then
  jq . <<<"$VERIFY"
  echo "::error::CLOUDFLARE_API_TOKEN is invalid or expired — create a fresh one."
  exit 1
fi
echo "    token OK ($(jq -r '.result.status' <<<"$VERIFY"))"

echo "━━━ 2/6 Verify account access"
ACCTS=$(cf "$API/accounts?per_page=50")
if [ "$(jq -r '.success' <<<"$ACCTS")" != "true" ]; then
  jq . <<<"$ACCTS"
  echo "::error::Could not list accounts — token needs Account Settings:Read."
  exit 1
fi
if ! jq -e --arg id "$CLOUDFLARE_ACCOUNT_ID" \
  '.result[] | select(.id == $id)' <<<"$ACCTS" >/dev/null; then
  echo "    Provided CLOUDFLARE_ACCOUNT_ID: $CLOUDFLARE_ACCOUNT_ID"
  jq -r '.result[] | "    accessible account: \(.id)  (\(.name))"' <<<"$ACCTS"
  echo "::error::CLOUDFLARE_ACCOUNT_ID does not match any account this token can access. Copy the Account ID from the Cloudflare dashboard (right side of the home page)."
  exit 1
fi
echo "    account OK"

echo "━━━ 3/6 Ensure D1 database '$DB_NAME'"
DB_LIST=$(cf "$API/accounts/$CLOUDFLARE_ACCOUNT_ID/d1/database?per_page=100")
if [ "$(jq -r '.success' <<<"$DB_LIST")" != "true" ]; then
  jq . <<<"$DB_LIST"
  show_hint
  echo "::error::Listing D1 databases failed."
  exit 1
fi
DB_ID=$(jq -r --arg n "$DB_NAME" '.result[] | select(.name == $n) | .uuid' <<<"$DB_LIST" | head -n1)
if [ -z "$DB_ID" ] || [ "$DB_ID" = "null" ]; then
  echo "    not found → creating…"
  DB_CREATE=$(cf -X POST "$API/accounts/$CLOUDFLARE_ACCOUNT_ID/d1/database" \
    -d "{\"name\":\"$DB_NAME\"}")
  if [ "$(jq -r '.success' <<<"$DB_CREATE")" != "true" ]; then
    jq . <<<"$DB_CREATE"
    show_hint
    echo "::error::Creating D1 database failed."
    exit 1
  fi
  DB_ID=$(jq -r '.result.uuid' <<<"$DB_CREATE")
fi
echo "    D1 ready: $DB_ID"
jq --arg id "$DB_ID" '.d1_databases[0].database_id = $id' \
  wrangler.jsonc > /tmp/wrangler.tmp.jsonc && mv /tmp/wrangler.tmp.jsonc wrangler.jsonc

echo "━━━ 4/6 Apply D1 schema + seed (idempotent)"
bunx wrangler d1 execute "$DB_NAME" --remote -y --file=./prisma/d1-schema.sql
# Guarded migration: CREATE TABLE IF NOT EXISTS cannot add columns to an
# already-existing table. Exit codes are unreliable here (wrangler can exit 0
# on remote SQL errors), so always attempt the ALTER and classify by the
# error TEXT instead — "duplicate column name" simply means already migrated.
echo "   ensuring Project.demoUrl exists"
ALTER_OUT=$(bunx wrangler d1 execute "$DB_NAME" --remote -y --command 'ALTER TABLE "Project" ADD COLUMN "demoUrl" TEXT' 2>&1 || true)
if echo "$ALTER_OUT" | grep -qi "duplicate column name"; then
  echo "   Project.demoUrl already exists — ok"
elif echo "$ALTER_OUT" | grep -qi "\[ERROR\]"; then
  echo "$ALTER_OUT" >&2
  echo "   ALTER TABLE failed with an unexpected error" >&2
  exit 1
else
  echo "   Project.demoUrl ready"
fi
echo "   ensuring Article.demoUrl exists"
ALTER_ART_OUT=$(bunx wrangler d1 execute "$DB_NAME" --remote -y --command 'ALTER TABLE "Article" ADD COLUMN "demoUrl" TEXT' 2>&1 || true)
if echo "$ALTER_ART_OUT" | grep -qi "duplicate column name"; then
  echo "   Article.demoUrl already exists — ok"
elif echo "$ALTER_ART_OUT" | grep -qi "\[ERROR\]"; then
  echo "$ALTER_ART_OUT" >&2
  echo "   ALTER TABLE Article failed with an unexpected error" >&2
  exit 1
else
  echo "   Article.demoUrl ready"
fi
bunx wrangler d1 execute "$DB_NAME" --remote -y --file=./prisma/d1-seed.sql

echo "   deduplicating auto-synced cards (repo/demo already curated)"
# Idempotent cleanup: auto-sync once spawned 2nd cards for repos whose curated
# card still pointed to an old repo name — visitors saw two cards opening the
# SAME demo. sync-engine now prevents recreation; this removes the leftovers.
bunx wrangler d1 execute "$DB_NAME" --remote -y --file=./prisma/d1-dedup.sql

echo "━━━ 4b/8 Refresh baked fallback snapshot (best-effort)"
# Bakes a deploy-time copy of the catalog into the Worker bundle so the site
# still shows real content/counters when the account-wide D1 free-tier quota
# is exhausted and both cache layers are cold. Failure here must never block
# a deploy — the committed baseline (src/lib/fallback-data.json) stays.
if bun scripts/export-fallback.ts --from-d1; then
  echo "    fallback snapshot refreshed from D1"
else
  echo "    fallback export failed (non-fatal) — committed baseline kept"
fi

echo "━━━ 5/8 Quality gates (lint + typecheck)"
# A failing lint or type error must never reach production. These gates also
# exist as workflow steps; they are repeated here because the workflow file on
# GitHub may lag behind (it is installed manually), while this script always
# travels with the code.
bun run lint
# Bun does NOT run dependency postinstall scripts, so the Prisma client is
# never generated by `bun install` — tsc needs the generated client types.
bunx prisma generate
bun run typecheck

echo "━━━ 6/8 Build with OpenNext"
# Bun does NOT run dependency postinstall scripts, so the Prisma client is
# never generated by `bun install` — CI fails with
# "Cannot find module '.prisma/client/default'" without this.
bunx prisma generate
# Build-time placeholder: `next build` evaluates route modules, and the local
# Prisma driver is imported at module level. On Workers the D1 driver takes
# over at runtime and Prisma is never connected, so a placeholder is safe.
export DATABASE_URL="${DATABASE_URL:-file:./build-time-placeholder.db}"
bunx opennextjs-cloudflare build

echo "━━━ 7/8 Deploy Worker + sync secrets"
bunx wrangler deploy
if [ -n "${ADMIN_KEY_VALUE:-}" ]; then
  printf '%s' "$ADMIN_KEY_VALUE" | bunx wrangler secret put ADMIN_KEY
else
  echo "    (secret ADMIN_KEY not set in GitHub — the admin panel stays LOCKED (fail-closed); set the secret to enable login)"
fi
if [ -n "${GH_PAT_VALUE:-}" ]; then
  printf '%s' "$GH_PAT_VALUE" | bunx wrangler secret put GITHUB_TOKEN
else
  echo "    (secret GH_PAT not set — GitHub live stats may be rate-limited)"
fi

echo ""
echo "━━━ 8/8 Auto-sync (repo→catalog, demo discovery, meta, uptime)"
# Best-effort: a sync failure must never fail the deploy itself.
if bash deploy/auto-sync.sh; then
  echo "    auto-sync OK"
else
  echo "    auto-sync failed (non-fatal) — the scheduled workflow will retry"
fi

echo ""
echo "✅ Deploy finished — Worker 'imsoroush' is live."
