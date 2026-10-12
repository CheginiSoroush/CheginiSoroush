import { PrismaClient } from '@prisma/client'

// Cache key v3: bumped after adding titleEn/descriptionEn/excerptEn columns so a
// stale pre-migration PrismaClient instance (without them) is never reused.
const globalForPrisma = globalThis as unknown as {
  prisma_v3: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma_v3 ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v3 = db
