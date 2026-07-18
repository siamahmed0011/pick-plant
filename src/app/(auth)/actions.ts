"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { hashPassword } from "@/lib/auth/password";
import { getSafeCallbackUrl } from "@/lib/auth/callback";
import { formDataToRecord, loginSchema, registrationSchema } from "@/lib/auth/validation";
import { prisma } from "@/lib/prisma";

export type AuthFailureResult = { ok: false; message: string; fieldErrors?: string[] };
export type AuthActionResult =
  | { ok: true; message: string; redirectTo?: string }
  | AuthFailureResult;

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(formDataToRecord(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid email or password.",
      fieldErrors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const callbackUrl = getSafeCallbackUrl(parsed.data.callbackUrl);

  try {
    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
      redirectTo: callbackUrl,
    });

    if (result?.error) {
      return { ok: false, message: "Invalid email or password." };
    }

    return {
      ok: true,
      message: "Signed in successfully.",
      redirectTo: result?.url ?? callbackUrl,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Invalid email or password." };
    }

    return {
      ok: false,
      message: "We could not reach secure account services. Please try again later.",
    };
  }
}

export async function registrationAction(formData: FormData): Promise<AuthActionResult> {
  const parsed = registrationSchema.safeParse(formDataToRecord(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please review the highlighted account details.",
      fieldErrors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });

    if (existingUser) {
      return {
        ok: false,
        message: "An account with this email already exists. Try signing in instead.",
      };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: "CUSTOMER",
      },
    });

    return {
      ok: true,
      message: "Your account was created. You can sign in now.",
    };
  } catch {
    return {
      ok: false,
      message: "We could not create your account right now. Please try again later.",
    };
  }
}

export async function forgotPasswordAction(formData: FormData): Promise<AuthFailureResult> {
  void formData;
  return {
    ok: false,
    message:
      "Secure password recovery will activate when database-backed accounts and email delivery are connected.",
  };
}

export async function resetPasswordAction(formData: FormData): Promise<AuthFailureResult> {
  void formData;
  return {
    ok: false,
    message:
      "This reset request cannot be processed until secure token validation and account storage are available.",
  };
}

export async function resendVerificationAction(formData: FormData): Promise<AuthFailureResult> {
  void formData;
  return {
    ok: false,
    message:
      "Verification email delivery will activate with secure account storage and email integration.",
  };
}

export async function signOutAction() {
  await (await import("@/auth")).signOut({ redirectTo: "/" });
}
