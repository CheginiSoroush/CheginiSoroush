import { PrismaClient } from '@prisma/client'

// Cache key v2: bumped once after adding the Subscriber model so a stale
// pre-migration PrismaClient instance (without it) is never reused.
const globalForPrisma = globalThis as unknown as {
  prisma_v2: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma_v2 ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v2 = db
