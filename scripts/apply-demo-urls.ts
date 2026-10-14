/**
 * apply-demo-urls.ts — one-shot, idempotent backfill of Project.demoUrl
 * from the curated live-demo map (src/lib/demo-urls.ts).
 *
 * Run: bun scripts/apply-demo-urls.ts
 */
import { PrismaClient } from "@prisma/client";
import { PROJECT_DEMO_URLS } from "../src/lib/demo-urls";

const prisma = new PrismaClient();

async function main() {
  let updated = 0;
  let missing = 0;
  for (const [slug, url] of Object.entries(PROJECT_DEMO_URLS)) {
    const row = await prisma.project.findUnique({ where: { slug }, select: { id: true } });
    if (!row) {
      console.warn(`⚠ project not found in DB: ${slug}`);
      missing++;
      continue;
    }
    await prisma.project.update({ where: { slug }, data: { demoUrl: url } });
    updated++;
  }
  const total = await prisma.project.count({ where: { demoUrl: { not: null } } });
  console.log(`demoUrl set: ${updated}, missing projects: ${missing}`);
  console.log(`projects with a demo URL now: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
