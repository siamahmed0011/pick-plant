import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prismaPhase80: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma Client.");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Keep the development singleton schema-versioned so Turbopack HMR cannot
// reuse a client generated before the Phase 8.0 inventory fields existed.
export const prisma = globalForPrisma.prismaPhase80 ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaPhase80 = prisma;
