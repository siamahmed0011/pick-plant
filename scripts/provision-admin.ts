import nextEnv from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { adminProvisionSchema } from "../src/lib/auth/validation";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

async function provisionAdmin() {
  const parsed = adminProvisionSchema.safeParse({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });

  if (!parsed.success) {
    throw new Error("ADMIN_NAME, ADMIN_EMAIL, and a valid ADMIN_PASSWORD are required.");
  }

  const prisma = createPrismaClient();

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { role: true },
    });

    if (existingUser) {
      if (existingUser.role !== "ADMIN") {
        throw new Error("The configured admin email belongs to a non-admin user.");
      }

      console.log("The configured initial admin already exists.");
      return;
    }

    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (existingAdmin) {
      throw new Error("An initial admin already exists; refusing to create another one.");
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: "ADMIN",
      },
    });

    console.log("Initial admin provisioned successfully.");
  } finally {
    await prisma.$disconnect();
  }
}

provisionAdmin().catch(() => {
  console.error("Initial admin provisioning failed.");
  process.exitCode = 1;
});
