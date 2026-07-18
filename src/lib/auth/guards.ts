import "server-only";

import { cache } from "react";
import { auth } from "@/auth";
import { USER_ROLES, type UserRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { getSafeCallbackUrl } from "@/lib/auth/callback";
import { prisma } from "@/lib/prisma";

export async function requireUser(callbackPath = "/account") {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(getSafeCallbackUrl(callbackPath))}`);
  }
  return session;
}

export async function requireRole(role: UserRole, callbackPath = "/account") {
  const session = await requireUser(callbackPath);
  if (session.user.role !== role) redirect("/");
  return session;
}

export const requireAdmin = cache(async (callbackPath = "/admin") => {
  const session = await requireRole(USER_ROLES.ADMIN, callbackPath);

  let admin: {
    id: string;
    name: string | null;
    email: string | null;
    role: UserRole;
  } | null = null;

  try {
    admin = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        role: USER_ROLES.ADMIN,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  } catch (error) {
    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : undefined;
    console.error("Admin authorization database check failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
      code: errorCode,
    });
  }

  if (!admin) redirect("/");

  return {
    ...session,
    user: {
      ...session.user,
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  };
});
