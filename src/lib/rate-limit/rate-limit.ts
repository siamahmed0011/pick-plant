import "server-only";

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import {
  formatRateLimitResponse,
  hashIdentifier,
  normalizeIdentifier,
  type RateLimitResult,
} from "./helpers";

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (url && token) {
    redisClient = new Redis({ url, token });
    return redisClient;
  }

  return null;
}

function handleMissingRedis(): RateLimitResult {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    console.error("Rate limiting failed closed: UPSTASH_REDIS_REST_URL or TOKEN missing in production.");
    return formatRateLimitResponse(
      false,
      0,
      0,
      60000,
      "Security rate limiting is temporarily unavailable. Please try again later."
    );
  }

  console.warn("[DEV ONLY] Upstash Redis credentials missing. Allowing request in development mode.");
  return formatRateLimitResponse(true, 100, 100, 0);
}

export async function checkRateLimit(
  limiterName: string,
  keySuffix: string,
  requests: number,
  windowStr: `${number} ${"s" | "m" | "h" | "d"}`,
  ip: string | null
): Promise<RateLimitResult> {
  if (!ip) {
    if (process.env.NODE_ENV === "production") {
      console.error(`Rate limiting failed closed for ${limiterName}: Missing or untrusted IP in production.`);
      return formatRateLimitResponse(
        false,
        0,
        0,
        60000,
        "Unable to verify secure client connection IP."
      );
    }
    ip = "127.0.0.1";
  }

  const redis = getRedisClient();
  if (!redis) {
    return handleMissingRedis();
  }

  const fullKey = `${ip}:${keySuffix}`;

  try {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, windowStr),
      prefix: `ratelimit:${limiterName}`,
    });

    const res = await limiter.limit(fullKey);
    const resetMs = Math.max(0, res.reset - Date.now());

    return formatRateLimitResponse(
      res.success,
      res.limit,
      res.remaining,
      resetMs,
      res.success ? undefined : "Too many requests. Please try again later."
    );
  } catch (error) {
    console.error(`Rate limiting check error for ${limiterName}:`, error instanceof Error ? error.message : "Unknown error");
    return handleMissingRedis();
  }
}

export async function checkLoginRateLimit(ip: string | null, email: string): Promise<RateLimitResult> {
  const normEmail = normalizeIdentifier(email);
  const keySuffix = hashIdentifier(normEmail);
  return checkRateLimit("login", keySuffix, 5, "10 m", ip);
}

export async function checkRegistrationRateLimit(ip: string | null): Promise<RateLimitResult> {
  return checkRateLimit("register", "attempt", 3, "1 h", ip);
}

export async function checkForgotPasswordRateLimit(ip: string | null, email: string): Promise<RateLimitResult> {
  const normEmail = normalizeIdentifier(email);
  const keySuffix = hashIdentifier(normEmail);
  return checkRateLimit("forgot", keySuffix, 3, "1 h", ip);
}

export async function checkResendVerificationRateLimit(ip: string | null, email: string): Promise<RateLimitResult> {
  const normEmail = normalizeIdentifier(email);
  const keySuffix = hashIdentifier(normEmail);
  return checkRateLimit("resend", keySuffix, 3, "1 h", ip);
}

export async function checkContactRateLimit(ip: string | null): Promise<RateLimitResult> {
  return checkRateLimit("contact", "submission", 5, "1 h", ip);
}

export async function checkCheckoutRateLimit(ip: string | null, userOrKey: string): Promise<RateLimitResult> {
  const norm = normalizeIdentifier(userOrKey);
  const keySuffix = hashIdentifier(norm);
  return checkRateLimit("checkout", keySuffix, 10, "10 m", ip);
}

export async function checkPaymentInitiateRateLimit(ip: string | null, identifier: string): Promise<RateLimitResult> {
  const norm = normalizeIdentifier(identifier);
  const keySuffix = hashIdentifier(norm);
  return checkRateLimit("pay_init", keySuffix, 10, "10 m", ip);
}
