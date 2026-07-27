"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { hashPassword } from "@/lib/auth/password";
import { getSafeCallbackUrl } from "@/lib/auth/callback";
import { formDataToRecord, loginSchema, registrationSchema } from "@/lib/auth/validation";
import { prisma } from "@/lib/prisma";
import {
  createEmailVerificationToken,
  consumeEmailVerificationToken,
} from "@/lib/auth/email-verification";

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

import { createPasswordResetToken, consumePasswordResetToken } from "@/lib/auth/password-reset";

export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const emailRaw = String(formData.get("email") ?? "").trim();
  const parsedEmail = loginSchema.shape.email.safeParse(emailRaw);

  if (!parsedEmail.success) {
    return {
      ok: false,
      message: "Enter a valid email address.",
    };
  }

  const safeSuccessMessage =
    "If an account with that email address exists, instructions to reset your password have been generated.";

  try {
    const result = await createPasswordResetToken(parsedEmail.data);

    if (process.env.NODE_ENV === "development" && result.created && result.rawToken) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      console.info(
        `[DEV ONLY] Password reset URL generated for ${result.email}: ${baseUrl}/reset-password?token=${result.rawToken}`,
      );
    }

    return {
      ok: true,
      message: safeSuccessMessage,
    };
  } catch (error) {
    console.error("Forgot password processing failed:", error);
    return {
      ok: true,
      message: safeSuccessMessage,
    };
  }
}

export async function resetPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const rawToken = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!rawToken) {
    return {
      ok: false,
      message: "Password reset token is missing.",
    };
  }

  if (password !== confirmPassword) {
    return {
      ok: false,
      message: "New passwords must match.",
    };
  }

  const parsedPassword = loginSchema.shape.password.safeParse(password);
  if (!parsedPassword.success) {
    return {
      ok: false,
      message: parsedPassword.error.issues[0]?.message ?? "Invalid new password.",
    };
  }

  try {
    const consumed = await consumePasswordResetToken(rawToken, parsedPassword.data);

    if (!consumed.success) {
      return {
        ok: false,
        message: consumed.error,
      };
    }

    return {
      ok: true,
      message: consumed.message,
    };
  } catch (error) {
    console.error("Reset password processing failed:", error);
    return {
      ok: false,
      message: "An error occurred while resetting your password. Please try again.",
    };
  }
}

export async function resendVerificationAction(formData: FormData): Promise<AuthActionResult> {
  const emailRaw = String(formData.get("email") ?? "").trim();
  const parsedEmail = loginSchema.shape.email.safeParse(emailRaw);

  if (!parsedEmail.success) {
    return {
      ok: false,
      message: "Enter a valid email address.",
    };
  }

  const safeMessage =
    "If an account with that email address exists and requires verification, a new verification link has been generated.";

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsedEmail.data },
      select: { id: true, email: true, emailVerified: true },
    });

    if (user && user.email && user.emailVerified === null) {
      const verification = await createEmailVerificationToken(user.email);

      if (process.env.NODE_ENV === "development" && verification.created && verification.rawToken) {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        console.info(
          `[DEV ONLY] Email verification URL generated for ${user.email}: ${baseUrl}/verify-email?token=${verification.rawToken}`,
        );
      }
    }

    return {
      ok: true,
      message: safeMessage,
    };
  } catch (error) {
    console.error("Resend verification processing failed:", error);
    return {
      ok: true,
      message: safeMessage,
    };
  }
}

export async function verifyEmailAction(rawToken: string): Promise<AuthActionResult> {
  if (!rawToken || !rawToken.trim()) {
    return {
      ok: false,
      message: "Verification token is missing.",
    };
  }

  try {
    const consumed = await consumeEmailVerificationToken(rawToken);
    if (!consumed.success) {
      return {
        ok: false,
        message: consumed.error,
      };
    }
    return {
      ok: true,
      message: consumed.message,
    };
  } catch (error) {
    console.error("Email verification action failed:", error);
    return {
      ok: false,
      message: "An error occurred while verifying your email. Please try again.",
    };
  }
}

export async function signOutAction() {
  await (await import("@/auth")).signOut({ redirectTo: "/" });
}
