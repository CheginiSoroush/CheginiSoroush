-- d1-dedup.sql — remove duplicate auto-synced Project cards.
--
-- Background: scripts/auto-sync.ts once created a second card for a repo when
-- the curated card still pointed to an old/renamed repo (e.g. curated
-- "vamp-sole" had repo "CheginiSoroush/VampSole" while the real repo was
-- "CheginiSoroush/VampSole-WebSite" → sync added "vampsole-website"). The
-- result: two cards opening the SAME live demo, which visitors read as
-- duplicates.
--
-- Rules (idempotent — safe to run on every deploy):
--   R1  auto-synced card (order >= 1000) whose repo already exists on a
--       curated card (order < 1000) → delete the auto card
--   R2  auto-synced card whose demoUrl equals a curated card's demoUrl
--       (case / trailing-slash-insensitive) → delete the auto card
--       (keeps exactly one card per live demo URL)
--
-- Curated cards (order < 1000) are NEVER deleted by this script, and
-- planProjectWrites() in src/lib/sync-engine.ts now prevents the sync from
-- recreating any of these — this file is the cleanup + permanent safety net.
DELETE FROM "Project"
WHERE "order" >= 1000
  AND (
    lower("repo") IN (
      SELECT lower("repo") FROM "Project" WHERE "order" < 1000
    )
    OR rtrim(lower(coalesce("demoUrl", '')), '/') IN (
      SELECT rtrim(lower("demoUrl"), '/') FROM "Project"
      WHERE "order" < 1000 AND coalesce("demoUrl", '') != ''
    )
  );
