-- Cloudflare D1 schema — mirrors prisma/schema.prisma (SQLite dialect).
-- Idempotent: safe to execute on every deploy (`wrangler d1 execute --file=`).

CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "repo" TEXT NOT NULL,
    "demoUrl" TEXT,
    "description" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "icon" TEXT NOT NULL DEFAULT '📦',
    "featured" BOOLEAN NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Project_slug_key" ON "Project" ("slug");

CREATE TABLE IF NOT EXISTS "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "excerpt" TEXT NOT NULL,
    "excerptEn" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '📝',
    "readTime" INTEGER NOT NULL DEFAULT 5,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "demoUrl" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "Article_slug_key" ON "Article" ("slug");

CREATE TABLE IF NOT EXISTS "ContactMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleSlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Comment_articleSlug_createdAt_idx"
    ON "Comment" ("articleSlug", "createdAt");

CREATE TABLE IF NOT EXISTS "Subscriber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_email_key" ON "Subscriber" ("email");

CREATE TABLE IF NOT EXISTS "SiteStat" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "RepoSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY,
    "payloadJson" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "GithubSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY,
    "payloadJson" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "RepoDemo" (
    "repo" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'cloudflare',
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "RepoMeta" (
    "repo" TEXT NOT NULL PRIMARY KEY,
    "latestTag" TEXT,
    "latestTagAt" DATETIME,
    "commitActivity" TEXT NOT NULL DEFAULT '[]',
    "openIssues" INTEGER NOT NULL DEFAULT 0,
    "fetchedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "DemoHealth" (
    "host" TEXT NOT NULL PRIMARY KEY,
    "ok" BOOLEAN NOT NULL DEFAULT 1,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "lastChecked" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "RateLimit" (
    "key" TEXT NOT NULL,
    "windowStart" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,
    PRIMARY KEY ("key", "windowStart")
);

-- Point-lookup indexes: every `WHERE slug = ?` previously full-scanned its
-- table. Scan rows count against D1's account-wide daily row-read quota, so
-- these indexes directly reduce quota burn as the tables grow.
CREATE INDEX IF NOT EXISTS "Article_slug_idx" ON "Article" ("slug");
CREATE INDEX IF NOT EXISTS "Project_slug_idx" ON "Project" ("slug");
