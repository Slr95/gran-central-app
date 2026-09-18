import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// En dev, Next recarga los módulos en cada cambio. Sin este singleton se abre
// una conexión nueva por recarga y Neon termina rechazando conexiones.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // El adapter `pg` ya tiene pool propio. Si le pasamos la URL -pooler de Neon,
  // las transacciones interactivas ($transaction(async (tx) => ...)) se quedan
  // colgadas: PgBouncer no reenvía el mismo backend entre roundtrips.
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL

  const adapter = new PrismaPg({
    connectionString,
  })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
