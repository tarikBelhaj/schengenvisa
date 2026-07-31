import { PrismaClient } from '@prisma/client';

// En dev, le hot-reload recrée un client à chaque rechargement : on le mémorise
// sur globalThis pour ne pas saturer le pool de connexions.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
