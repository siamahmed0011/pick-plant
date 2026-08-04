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
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/email/email-service";

import { headers } from "next/headers";
import {
  checkLoginRateLimit,
  checkRegistrationRateLimit,
  checkForgotPasswordRateLimit,
  checkResendVerificationRateLimit,
} from "@/lib/rate-limit/rate-limit";

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

  const reqHeaders = await headers();
  const rateLimit = await checkLoginRateLimit(reqHeaders, parsed.data.email);

  if (rateLimit.status === "unavailable") {
    return {
      ok: false,
      message: "Security verification is temporarily unavailable. Please try again.",
    };
  }

  if (rateLimit.status === "limited") {
    return {
      ok: false,
      message: `Too many login attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
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

function logRegistrationError(stage: string, err: unknown) {
  const isObj = typeof err === "object" && err !== null;
  const errorName =
    err instanceof Error
      ? err.name
      : isObj && "name" in err
        ? String((err as { name: unknown }).name)
        : "UnknownError";
  const prismaCode =
    isObj && "code" in err ? String((err as { code: unknown }).code) : undefined;

  console.error("[Registration Failure]", {
    stage,
    errorName,
    errorType: typeof err,
    ...(prismaCode ? { prismaCode } : {}),
  });
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

  const reqHeaders = await headers();
  const rateLimit = await checkRegistrationRateLimit(reqHeaders);

  if (rateLimit.status === "unavailable") {
    return {
      ok: false,
      message: "Security verification is temporarily unavailable. Please try again.",
    };
  }

  if (rateLimit.status === "limited") {
    return {
      ok: false,
      message: `Too many account creation attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
    };
  }

  // Stage 1: user_lookup
  let existingUser = null;
  try {
    existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });
  } catch (err) {
    logRegistrationError("user_lookup", err);
    return {
      ok: false,
      message: "We could not create your account right now. Please try again later.",
    };
  }

  if (existingUser) {
    return {
      ok: false,
      message: "An account with this email already exists. Try signing in instead.",
    };
  }

  // Stage 2: password_hash
  let passwordHash = "";
  try {
    passwordHash = await hashPassword(parsed.data.password);
  } catch (err) {
    logRegistrationError("password_hash", err);
    return {
      ok: false,
      message: "We could not create your account right now. Please try again later.",
    };
  }

  // Stage 3: user_create
  let user = null;
  try {
    user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: "CUSTOMER",
      },
    });
  } catch (err) {
    logRegistrationError("user_create", err);
    return {
      ok: false,
      message: "We could not create your account right now. Please try again later.",
    };
  }

  // Stage 4 & 5: verification_token_create and verification_email_send
  try {
    const email = user.email ?? parsed.data.email;
    let verification = null;
    try {
      verification = await createEmailVerificationToken(email);
    } catch (err) {
      logRegistrationError("verification_token_create", err);
    }

    if (verification?.created && verification.rawToken) {
      if (process.env.NODE_ENV === "development") {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        console.info(
          `[DEV ONLY] Email verification URL generated for ${email}: ${baseUrl}/verify-email?token=${verification.rawToken}`,
        );
      }
      try {
        const emailResult = await sendVerificationEmail(email, verification.rawToken);
        if (!emailResult.success) {
          logRegistrationError("verification_email_send", new Error(emailResult.error));
        }
      } catch (err) {
        logRegistrationError("verification_email_send", err);
      }
    }
  } catch (err) {
    logRegistrationError("verification_service_unexpected", err);
  }

  return {
    ok: true,
    message: "Your account was created. Please check your email to verify your account.",
  };
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

  const reqHeaders = await headers();
  const rateLimit = await checkForgotPasswordRateLimit(reqHeaders, parsedEmail.data);

  if (rateLimit.status === "unavailable") {
    return {
      ok: false,
      message: "Security verification is temporarily unavailable. Please try again.",
    };
  }

  if (rateLimit.status === "limited") {
    return {
      ok: true,
      message: safeSuccessMessage,
    };
  }

  try {
    const result = await createPasswordResetToken(parsedEmail.data);

    if (result.created && result.rawToken && result.email) {
      if (process.env.NODE_ENV === "development") {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        console.info(
          `[DEV ONLY] Password reset URL generated for ${result.email}: ${baseUrl}/reset-password?token=${result.rawToken}`,
        );
      }

      await sendPasswordResetEmail(result.email, result.rawToken);
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

  const reqHeaders = await headers();
  const rateLimit = await checkResendVerificationRateLimit(reqHeaders, parsedEmail.data);

  if (rateLimit.status === "unavailable") {
    return {
      ok: false,
      message: "Security verification is temporarily unavailable. Please try again.",
    };
  }

  if (rateLimit.status === "limited") {
    return {
      ok: true,
      message: safeMessage,
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsedEmail.data },
      select: { id: true, email: true, emailVerified: true },
    });

    if (user && user.email && user.emailVerified === null) {
      const verification = await createEmailVerificationToken(user.email);

      if (verification.created && verification.rawToken) {
        if (process.env.NODE_ENV === "development") {
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
          console.info(
            `[DEV ONLY] Email verification URL generated for ${user.email}: ${baseUrl}/verify-email?token=${verification.rawToken}`,
          );
        }

        await sendVerificationEmail(user.email, verification.rawToken);
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
