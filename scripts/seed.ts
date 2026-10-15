import { PrismaClient } from "@prisma/client";
import { seedProjects, seedArticles } from "../src/lib/seed-data";
import { PROJECT_DEMO_URLS } from "../src/lib/demo-urls";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Projects
  for (let i = 0; i < seedProjects.length; i++) {
    const p = seedProjects[i];
    await prisma.project.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        titleEn: p.titleEn ?? null,
        repo: p.repo,
        demoUrl: PROJECT_DEMO_URLS[p.slug] ?? null,
        description: p.description,
        descriptionEn: p.descriptionEn ?? null,
        category: p.category,
        tags: JSON.stringify(p.tags),
        icon: p.icon,
        featured: p.featured ?? false,
        order: i,
      },
      create: {
        slug: p.slug,
        title: p.title,
        titleEn: p.titleEn ?? null,
        repo: p.repo,
        demoUrl: PROJECT_DEMO_URLS[p.slug] ?? null,
        description: p.description,
        descriptionEn: p.descriptionEn ?? null,
        category: p.category,
        tags: JSON.stringify(p.tags),
        icon: p.icon,
        featured: p.featured ?? false,
        order: i,
      },
    });
  }
  console.log(`Projects seeded: ${seedProjects.length}`);

  // Articles
  for (const a of seedArticles) {
    await prisma.article.upsert({
      where: { slug: a.slug },
      update: {
        title: a.title,
        titleEn: a.titleEn ?? null,
        excerpt: a.excerpt,
        excerptEn: a.excerptEn ?? null,
        content: a.content,
        category: a.category,
        icon: a.icon,
        readTime: a.readTime,
        demoUrl: a.demoUrl ?? null,
      },
      create: {
        slug: a.slug,
        title: a.title,
        titleEn: a.titleEn ?? null,
        excerpt: a.excerpt,
        excerptEn: a.excerptEn ?? null,
        content: a.content,
        category: a.category,
        icon: a.icon,
        readTime: a.readTime,
        demoUrl: a.demoUrl ?? null,
      },
    });
  }
  console.log(`Articles seeded: ${seedArticles.length}`);

  // Site stats
  await prisma.siteStat.upsert({
    where: { key: "visits" },
    update: {},
    create: { key: "visits", value: 1 },
  });
  await prisma.siteStat.upsert({
    where: { key: "projectViews" },
    update: {},
    create: { key: "projectViews", value: 0 },
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
