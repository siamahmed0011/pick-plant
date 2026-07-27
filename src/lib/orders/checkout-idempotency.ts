import "server-only";

import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { CartStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const CHECKOUT_COOKIE_NAME = "pick-plant-checkout";
const CHECKOUT_KEY_TTL_SECONDS = 60 * 60;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function checkoutSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("Checkout idempotency is unavailable.");
  return secret;
}

function signatureFor(payload: string) {
  return createHmac("sha256", checkoutSecret()).update(payload).digest("hex");
}

function signedToken(key: string, expiresAtMs: number) {
  const payload = `${key}.${expiresAtMs}`;
  return `${payload}.${signatureFor(payload)}`;
}

function verifiedToken(value: string | undefined) {
  if (!value || value.length > 200) return null;
  const [key, expiresAtRaw, suppliedSignature, ...extra] = value.split(".");
  if (
    extra.length > 0 ||
    !key ||
    !UUID_PATTERN.test(key) ||
    !/^\d{13}$/.test(expiresAtRaw ?? "") ||
    !/^[0-9a-f]{64}$/i.test(suppliedSignature ?? "")
  ) {
    return null;
  }

  const expiresAtMs = Number(expiresAtRaw);
  if (!Number.isSafeInteger(expiresAtMs) || expiresAtMs <= Date.now()) {
    return null;
  }

  const payload = `${key}.${expiresAtRaw}`;
  const expected = Buffer.from(signatureFor(payload), "hex");
  const supplied = Buffer.from(suppliedSignature, "hex");
  if (
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied)
  ) {
    return null;
  }

  return { key, expiresAt: new Date(expiresAtMs) };
}

async function setCheckoutCookie(key: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(
    CHECKOUT_COOKIE_NAME,
    signedToken(key, expiresAt.getTime()),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    },
  );
}

export async function prepareCheckoutIdempotency(userId?: string) {
  const cookieStore = await cookies();
  const token = verifiedToken(cookieStore.get(CHECKOUT_COOKIE_NAME)?.value);

  if (token) {
    const existingCart = await prisma.cart.findUnique({
      where: { id: token.key },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (
      existingCart &&
      existingCart.userId === (userId ?? null) &&
      existingCart.expiresAt &&
      existingCart.expiresAt > new Date()
    ) {
      return token.key;
    }
  }

  const key = randomUUID();
  const expiresAt = new Date(Date.now() + CHECKOUT_KEY_TTL_SECONDS * 1000);

  await prisma.cart.create({
    data: {
      id: key,
      userId: userId ?? null,
      sessionKey: `checkout:${key}`,
      status: CartStatus.ACTIVE,
      expiresAt,
    },
  });
  await setCheckoutCookie(key, expiresAt);

  return key;
}

export async function requireCheckoutIdempotency() {
  const cookieStore = await cookies();
  const token = verifiedToken(cookieStore.get(CHECKOUT_COOKIE_NAME)?.value);
  if (!token) throw new Error("Checkout submission is not prepared.");
  return token.key;
}

export async function completeCheckoutIdempotency() {
  const cookieStore = await cookies();
  cookieStore.set(CHECKOUT_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
