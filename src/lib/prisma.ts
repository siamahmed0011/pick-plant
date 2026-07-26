import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prismaPhase83: PrismaClient | undefined;
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
// reuse a client generated before the Phase 8.3 blog/contact models existed.
export const prisma = globalForPrisma.prismaPhase83 ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaPhase83 = prisma;
