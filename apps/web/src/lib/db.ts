/**
 * Prisma client singleton (Next.js dev hot-reload safe).
 *
 * The client is only constructed when DATABASE_URL is set. Without it
 * the app runs on the seed-JSON/in-memory fallback (src/lib/store.ts)
 * and Prisma is never touched — importing this module is safe in
 * fallback mode, in tests and in the build.
 */
import { PrismaClient } from "@prisma/client";

/** True when a real Postgres is configured. */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Returns the shared PrismaClient. Throws when no DATABASE_URL is
 * configured — callers must check hasDatabase() first and use the
 * fallback instead.
 */
export function getPrisma(): PrismaClient {
  if (!hasDatabase()) {
    throw new Error(
      "DATABASE_URL is not set — use the in-memory fallback (see src/lib/store.ts).",
    );
  }
  globalForPrisma.prisma ??= new PrismaClient();
  return globalForPrisma.prisma;
}
