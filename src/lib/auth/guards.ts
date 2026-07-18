import "server-only";

import { auth } from "@/auth";
import { USER_ROLES, type UserRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { getSafeCallbackUrl } from "@/lib/auth/callback";

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

export async function requireAdmin(callbackPath = "/account") {
  return requireRole(USER_ROLES.ADMIN, callbackPath);
}
