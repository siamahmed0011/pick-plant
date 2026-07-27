import "server-only";

import type { Session } from "next-auth";
import { cookies } from "next/headers";
import { auth } from "@/auth";

const SESSION_COOKIE_PREFIXES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
] as const;

type SessionResolution =
  | { status: "authenticated"; session: Session }
  | { status: "guest"; session: null }
  | { status: "invalid_or_expired"; session: null }
  | { status: "auth_service_failure"; session: null }
  | { status: "auth_adapter_failure"; session: null };

type AuthenticationFailureKind =
  | "auth_service_failure"
  | "auth_adapter_failure";

export class AuthenticationServiceUnavailableError extends Error {
  constructor(
    message: string,
    readonly kind: AuthenticationFailureKind,
  ) {
    super(message);
    this.name = "AuthenticationServiceUnavailableError";
  }
}
export class InvalidOrExpiredSessionError extends Error {}

function errorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  return String(error.code);
}

function errorType(error: unknown) {
  if (typeof error !== "object" || error === null || !("type" in error)) {
    return undefined;
  }
  return String(error.type);
}

function classifyAuthenticationFailure(
  error: unknown,
): AuthenticationFailureKind {
  const name = error instanceof Error ? error.name : "UnknownError";
  const code = errorCode(error);
  const type = errorType(error);
  const isAdapterFailure =
    name.startsWith("PrismaClient") ||
    name === "AdapterError" ||
    type === "AdapterError" ||
    code === "ECONNREFUSED" ||
    Boolean(code?.startsWith("P"));

  return isAdapterFailure ? "auth_adapter_failure" : "auth_service_failure";
}

async function resolveSession(): Promise<SessionResolution> {
  try {
    const cookieStore = await cookies();
    const hasSessionCookie = cookieStore
      .getAll()
      .some((cookie) =>
        SESSION_COOKIE_PREFIXES.some(
          (prefix) =>
            cookie.name === prefix || cookie.name.startsWith(`${prefix}.`),
        ),
      );
    const session = await auth();

    if (
      session?.user &&
      typeof session.user.id === "string" &&
      session.user.id.trim().length > 0
    ) {
      return { status: "authenticated", session };
    }
    if (session?.user) {
      console.error("Authentication session is missing its user identifier.", {
        name: "InvalidSessionUser",
        code: "MISSING_USER_ID",
      });
      return { status: "auth_service_failure", session: null };
    }
    if (hasSessionCookie) {
      return { status: "invalid_or_expired", session: null };
    }
    return { status: "guest", session: null };
  } catch (error) {
    const failureKind = classifyAuthenticationFailure(error);
    console.error("Optional authentication resolution failed.", {
      kind: failureKind,
      name: error instanceof Error ? error.name : "UnknownError",
      code: errorCode(error),
      type: errorType(error),
    });
    return { status: failureKind, session: null };
  }
}

export async function getOptionalSession() {
  const result = await resolveSession();
  if (
    result.status === "auth_service_failure" ||
    result.status === "auth_adapter_failure"
  ) {
    throw new AuthenticationServiceUnavailableError(
      "Authentication service is unavailable.",
      result.status,
    );
  }
  if (result.status === "invalid_or_expired") {
    throw new InvalidOrExpiredSessionError(
      "The authentication session is invalid or expired.",
    );
  }
  return result.status === "authenticated" ? result.session : null;
}

export async function getDisplaySession() {
  const result = await resolveSession();
  return result.status === "authenticated" ? result.session : null;
}

export async function getCheckoutSession() {
  const result = await resolveSession();
  if (
    result.status === "auth_service_failure" ||
    result.status === "auth_adapter_failure"
  ) {
    throw new AuthenticationServiceUnavailableError(
      "Authentication service is unavailable.",
      result.status,
    );
  }
  if (result.status === "invalid_or_expired") {
    throw new InvalidOrExpiredSessionError(
      "The authentication session is invalid or expired.",
    );
  }
  if (result.status === "guest") {
    return null;
  }
  return result.session;
}
