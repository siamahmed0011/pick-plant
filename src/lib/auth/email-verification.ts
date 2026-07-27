import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function hashVerificationToken(rawToken: string): string {
  return createHash("sha256").update(rawToken.trim()).digest("hex");
}

export function generateRawVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export type CreateVerificationTokenResult = {
  created: boolean;
  rawToken?: string;
  email?: string;
};

export async function createEmailVerificationToken(
  emailRaw: string,
): Promise<CreateVerificationTokenResult> {
  const normalizedEmail = emailRaw.trim().toLowerCase();
  if (!normalizedEmail) return { created: false };

  const rawToken = generateRawVerificationToken();
  const tokenHash = hashVerificationToken(rawToken);
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  await prisma.$transaction(async (tx) => {
    // 1. Invalidate/delete previous verification tokens for this identifier
    await tx.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    // 2. Create new verification token record
    await tx.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: tokenHash,
        expires,
      },
    });
  });

  return {
    created: true,
    rawToken,
    email: normalizedEmail,
  };
}

export type ConsumeVerificationTokenResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function consumeEmailVerificationToken(
  rawToken: string,
): Promise<ConsumeVerificationTokenResult> {
  const trimmedToken = rawToken.trim();
  if (!trimmedToken) {
    return {
      success: false,
      error: "Verification token is missing.",
    };
  }

  const tokenHash = hashVerificationToken(trimmedToken);
  const now = new Date();

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Find matching unexpired verification token
      const verificationToken = await tx.verificationToken.findFirst({
        where: {
          token: tokenHash,
          expires: { gt: now },
        },
      });

      if (!verificationToken) {
        return {
          success: false,
          error: "Verification token is invalid or has expired.",
        };
      }

      // 2. Find target user account by email identifier
      const user = await tx.user.findUnique({
        where: { email: verificationToken.identifier },
        select: { id: true, emailVerified: true },
      });

      if (!user) {
        return {
          success: false,
          error: "Associated user account was not found.",
        };
      }

      // If user is already verified, clean up token and notify
      if (user.emailVerified !== null) {
        await tx.verificationToken.deleteMany({
          where: { identifier: verificationToken.identifier },
        });

        return {
          success: true,
          message: "Your email address is already verified. You can sign in now.",
        };
      }

      // 3. Mark user email as verified
      await tx.user.update({
        where: { id: user.id },
        data: { emailVerified: now },
      });

      // 4. Invalidate/delete all verification tokens for this user email
      await tx.verificationToken.deleteMany({
        where: { identifier: verificationToken.identifier },
      });

      return {
        success: true,
        message: "Your email address has been verified successfully. You can now sign in.",
      };
    });
  } catch (error) {
    console.error("Email verification consumption failed:", error);
    return {
      success: false,
      error: "An error occurred while verifying your email. Please try again.",
    };
  }
}
