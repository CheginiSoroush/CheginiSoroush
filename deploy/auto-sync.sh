#!/usr/bin/env bash
# auto-sync wrapper for CI — runs scripts/auto-sync.ts against the REMOTE D1.
#
# Inputs (repository secrets, already present for the deploy pipeline):
#   CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID  → Workers custom-domains API
#                                                    + wrangler d1 execute
#   GH_PAT                                        → full (incl. private) repo list
#     (ci-deploy.sh exports GH_PAT_VALUE; the deploy workflow passes GH_PAT too)
#
# Every failure is NON-FATAL by design — the caller decides (deploy step
# wraps it in `|| true`, the scheduled workflow reports a red run).
set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required for auto-sync}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required for auto-sync}"

export GH_PAT="${GH_PAT:-${GH_PAT_VALUE:-}}"

SQL=$(mktemp /tmp/imsoroush-auto-sync.XXXXXX.sql)

bun scripts/auto-sync.ts --emit-sql "$SQL" --apply-d1
