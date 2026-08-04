import "server-only";

import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/auth/roles";

export type AccountUserContext = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  emailVerified: boolean | null;
};

export async function getAccountUserContext(session: {
  user?: {
    id?: string | null;
    email?: string | null;
    name?: string | null;
    role?: string;
  };
}): Promise<AccountUserContext | null> {
  const sessionUserId = session?.user?.id?.trim();
  const sessionEmail = session?.user?.email?.trim().toLowerCase();

  if (!sessionUserId && !sessionEmail) {
    return null;
  }

  try {
    const dbUser = await prisma.user.findFirst({
      where: sessionUserId
        ? { id: sessionUserId }
        : { email: sessionEmail },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!dbUser) {
      return null;
    }

    return {
      id: dbUser.id,
      name: dbUser.name ?? session.user?.name ?? null,
      email: dbUser.email ?? session.user?.email ?? null,
      role: dbUser.role as UserRole,
      emailVerified: dbUser.emailVerified !== null,
    };
  } catch (error) {
    console.error("[AccountUserContext] Database user resolution error:", error);
    return null;
  }
}
