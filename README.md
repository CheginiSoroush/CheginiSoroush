# Soroush Chegini — Portfolio

Source of [imsoroush.ir](https://imsoroush.ir) — my personal corner of the web:
a bilingual (EN/FA) portfolio where I publish my open-source projects, Telegram
bots and articles.

> منبع سایت شخصی من (imsoroush.ir) — جایی که پروژه‌ها، ربات‌ها و نوشته‌هایم را منتشر می‌کنم.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4** + shadcn/ui, Framer Motion, Lucide icons
- **Prisma** ORM (SQLite locally, Cloudflare D1 in production)
- **Cloudflare Workers** deployment via OpenNext

## Getting started

```bash
bun install

# environment (server-side only)
#   DATABASE_URL   — file:./db/custom.db
#   GITHUB_TOKEN   — optional, raises GitHub API rate limits
#   ADMIN_KEY      — admin panel key (set your own secret)

bun run db:push     # create the local database
bun run dev         # http://localhost:3000
```

## Useful scripts

| Command                | What it does                                       |
| ---------------------- | -------------------------------------------------- |
| `bun run dev`          | Start the dev server (port 3000)                   |
| `bun run build`        | Production build (standalone output)               |
| `bun run start`        | Run the standalone production server               |
| `bun run lint`         | ESLint                                             |
| `bun run typecheck`    | TypeScript check (`tsc --noEmit`)                  |
| `bun run db:push`      | Push the Prisma schema to the database             |
| `bun run db:generate`  | Generate the Prisma client                         |
| `bun run db:migrate`   | Create/apply a dev migration                       |
| `bun run db:reset`     | Reset the database (drops data!)                   |

> Deploy tip: `deploy/ci-deploy.sh` runs `lint` + `typecheck` as quality gates
> before every Cloudflare Workers deployment — keep both green.

## Structure

```
src/app            — routes & API handlers
src/components     — site UI + shadcn/ui primitives
src/lib            — i18n dictionaries, store layer, site config, data
prisma             — schema + D1 schema/seed for Cloudflare
public/photos      — cover art & images
deploy             — GitHub Actions workflow for Cloudflare Workers
```

## Deployment

See [DEPLOY.md](./DEPLOY.md) for the full Cloudflare Workers guide
(D1 migration, secrets, custom domain).

---

© Soroush Chegini — all rights reserved.
