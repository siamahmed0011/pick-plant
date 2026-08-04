import "server-only";

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import {
  getClientIpDetails,
  formatRateLimitResponse,
  hashIdentifier,
  normalizeIdentifier,
  type ClientIpResult,
  type RateLimitReason,
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

function handleMissingRedis(
  headerSource: string | null = null,
  reason: RateLimitReason = "missing_redis_config"
): RateLimitResult {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    console.error("Rate limiting failed closed: UPSTASH_REDIS_REST_URL or TOKEN missing/errored in production.");
    return formatRateLimitResponse(
      "unavailable",
      0,
      0,
      0,
      "Security verification is temporarily unavailable. Please try again.",
      headerSource,
      reason
    );
  }

  console.warn("[DEV ONLY] Upstash Redis credentials missing or errored. Allowing request in development mode.");
  return formatRateLimitResponse("allowed", 100, 100, 0, undefined, headerSource);
}

export type IpInput =
  | Headers
  | Record<string, string | string[] | undefined>
  | ClientIpResult
  | string
  | null;

function resolveIpDetails(input: IpInput): ClientIpResult {
  if (!input) {
    return getClientIpDetails({});
  }
  if (typeof input === "string") {
    return { ip: input, headerSource: "explicit" };
  }
  if (typeof input === "object" && "ip" in input && "headerSource" in input) {
    return input as ClientIpResult;
  }
  return getClientIpDetails(input as Headers | Record<string, string | string[] | undefined>);
}

export async function checkRateLimit(
  limiterName: string,
  keySuffix: string,
  requests: number,
  windowStr: `${number} ${"s" | "m" | "h" | "d"}`,
  ipInput: IpInput
): Promise<RateLimitResult> {
  const { ip, headerSource } = resolveIpDetails(ipInput);
  let resolvedIp = ip;

  if (!resolvedIp) {
    if (process.env.NODE_ENV === "production") {
      console.error(`Rate limiting unavailable for ${limiterName}: Missing or untrusted IP in production.`);
      return formatRateLimitResponse(
        "unavailable",
        0,
        0,
        0,
        "Security verification is temporarily unavailable. Please try again.",
        headerSource,
        "missing_ip"
      );
    }
    resolvedIp = "127.0.0.1";
  }

  const redis = getRedisClient();
  if (!redis) {
    return handleMissingRedis(headerSource, "missing_redis_config");
  }

  const appNs = process.env.RATE_LIMIT_NAMESPACE?.trim() || "pickplant";
  const envNs = process.env.VERCEL_ENV?.trim() || process.env.NODE_ENV || "development";
  const prefix = `${appNs}:${envNs}:${limiterName}`;
  const fullKey = `${resolvedIp}:${keySuffix}`;

  try {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, windowStr),
      prefix,
    });

    const res = await limiter.limit(fullKey);
    const resetMs = Math.max(0, res.reset - Date.now());

    if (res.success) {
      return formatRateLimitResponse(
        "allowed",
        res.limit,
        res.remaining,
        resetMs,
        undefined,
        headerSource
      );
    }

    return formatRateLimitResponse(
      "limited",
      res.limit,
      res.remaining,
      resetMs,
      "Too many attempts. Please try again later.",
      headerSource,
      "rate_exceeded"
    );
  } catch (error) {
    console.error(`Rate limiting check error for ${limiterName}:`, error instanceof Error ? error.message : "Unknown error");
    return handleMissingRedis(headerSource, "redis_error");
  }
}

export async function checkLoginRateLimit(ipInput: IpInput, email: string): Promise<RateLimitResult> {
  const normEmail = normalizeIdentifier(email);
  const keySuffix = hashIdentifier(normEmail);
  return checkRateLimit("login", keySuffix, 5, "10 m", ipInput);
}

export async function checkRegistrationRateLimit(ipInput: IpInput): Promise<RateLimitResult> {
  return checkRateLimit("register", "attempt", 3, "1 h", ipInput);
}

export async function checkForgotPasswordRateLimit(ipInput: IpInput, email: string): Promise<RateLimitResult> {
  const normEmail = normalizeIdentifier(email);
  const keySuffix = hashIdentifier(normEmail);
  return checkRateLimit("forgot", keySuffix, 3, "1 h", ipInput);
}

export async function checkResendVerificationRateLimit(ipInput: IpInput, email: string): Promise<RateLimitResult> {
  const normEmail = normalizeIdentifier(email);
  const keySuffix = hashIdentifier(normEmail);
  return checkRateLimit("resend", keySuffix, 3, "1 h", ipInput);
}

export async function checkContactRateLimit(ipInput: IpInput): Promise<RateLimitResult> {
  return checkRateLimit("contact", "submission", 5, "1 h", ipInput);
}

export async function checkCheckoutRateLimit(ipInput: IpInput, userOrKey: string): Promise<RateLimitResult> {
  const norm = normalizeIdentifier(userOrKey);
  const keySuffix = hashIdentifier(norm);
  return checkRateLimit("checkout", keySuffix, 10, "10 m", ipInput);
}

export async function checkPaymentInitiateRateLimit(ipInput: IpInput, identifier: string): Promise<RateLimitResult> {
  const norm = normalizeIdentifier(identifier);
  const keySuffix = hashIdentifier(norm);
  return checkRateLimit("pay_init", keySuffix, 10, "10 m", ipInput);
}
