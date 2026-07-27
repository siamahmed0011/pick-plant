import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function hashResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken.trim()).digest("hex");
}

export function generateRawResetToken(): string {
  return randomBytes(32).toString("hex");
}

export type CreateTokenResult = {
  created: boolean;
  rawToken?: string;
  email?: string;
};

export async function createPasswordResetToken(emailRaw: string): Promise<CreateTokenResult> {
  const normalizedEmail = emailRaw.trim().toLowerCase();
  if (!normalizedEmail) return { created: false };

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true },
  });

  if (!user || !user.email) {
    return { created: false };
  }

  const rawToken = generateRawResetToken();
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.$transaction(async (tx) => {
    // Invalidate existing unused tokens for this user
    await tx.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // Create new password reset token
    await tx.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });
  });

  return {
    created: true,
    rawToken,
    email: user.email,
  };
}

export type ConsumeTokenResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function consumePasswordResetToken(
  rawToken: string,
  newPassword: string,
): Promise<ConsumeTokenResult> {
  const trimmedToken = rawToken.trim();
  if (!trimmedToken) {
    return {
      success: false,
      error: "Password reset token is missing.",
    };
  }

  const tokenHash = hashResetToken(trimmedToken);
  const now = new Date();

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Atomic conditional claim: lock and mark token as used ONLY if currently unused & unexpired
      const claimed = await tx.passwordResetToken.updateMany({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          usedAt: now,
        },
      });

      if (claimed.count !== 1) {
        return {
          success: false,
          error: "Password reset token is invalid or has expired.",
        };
      }

      // 2. Fetch target userId for this claimed token
      const tokenRecord = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: { userId: true },
      });

      if (!tokenRecord) {
        return {
          success: false,
          error: "Password reset token is invalid or has expired.",
        };
      }

      const newPasswordHash = await hashPassword(newPassword);

      // 3. Update user's passwordHash and passwordChangedAt timestamp (triggers JWT session revocation)
      await tx.user.update({
        where: { id: tokenRecord.userId },
        data: {
          passwordHash: newPasswordHash,
          passwordChangedAt: now,
        },
      });

      // 4. Invalidate all remaining password reset tokens for this user
      await tx.passwordResetToken.updateMany({
        where: {
          userId: tokenRecord.userId,
          usedAt: null,
        },
        data: { usedAt: now },
      });

      // 5. Delete database-backed session rows if any exist
      await tx.session.deleteMany({
        where: { userId: tokenRecord.userId },
      });

      return {
        success: true,
        message:
          "Your password has been reset successfully. You can now sign in with your new password.",
      };
    });
  } catch (error) {
    console.error("Password reset token consumption transaction failed:", error);
    return {
      success: false,
      error: "An error occurred while resetting your password. Please try again.",
    };
  }
}
