import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

// Configura o construtor de WebSocket para o driver serverless em ambiente Node.js
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  const isDev = process.env.NODE_ENV === 'development';
  const logLevels: ('error' | 'warn')[] = isDev ? ['error', 'warn'] : ['error'];

  if (connectionString) {
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({
      adapter,
      log: logLevels,
    });
  }

  return new PrismaClient({
    log: logLevels,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
