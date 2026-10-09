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

// In-memory sliding window fallback for instant sub-millisecond execution & offline/unconfigured Redis
type MemoryRecord = { timestamps: number[] };
const memoryStorage = new Map<string, MemoryRecord>();

function cleanMemoryStorage() {
  const now = Date.now();
  for (const [key, record] of memoryStorage.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 3600000);
    if (record.timestamps.length === 0) {
      memoryStorage.delete(key);
    }
  }
}

// Clean every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanMemoryStorage, 10 * 60 * 1000).unref?.();
}

function parseWindowMs(windowStr: string): number {
  const match = windowStr.match(/^(\d+)\s*([smhd])$/);
  if (!match) return 60000;
  const num = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === "s") return num * 1000;
  if (unit === "m") return num * 60 * 1000;
  if (unit === "h") return num * 3600 * 1000;
  if (unit === "d") return num * 86400 * 1000;
  return 60000;
}

function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  headerSource: string | null
): RateLimitResult {
  const now = Date.now();
  let record = memoryStorage.get(key);
  if (!record) {
    record = { timestamps: [] };
    memoryStorage.set(key, record);
  }

  // Remove timestamps outside window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length < limit) {
    record.timestamps.push(now);
    return formatRateLimitResponse("allowed", limit, limit - record.timestamps.length, 0, undefined, headerSource);
  }

  const oldest = record.timestamps[0] ?? now;
  const resetMs = Math.max(0, windowMs - (now - oldest));
  return formatRateLimitResponse(
    "limited",
    limit,
    0,
    resetMs,
    "Too many attempts. Please try again later.",
    headerSource,
    "rate_exceeded"
  );
}

function handleMissingRedis(
  headerSource: string | null = null,
  fallbackKey?: string,
  requests: number = 10,
  windowMs: number = 60000,
  reason: RateLimitReason = "missing_redis_config"
): RateLimitResult {
  if (fallbackKey) {
    return checkMemoryRateLimit(fallbackKey, requests, windowMs, headerSource);
  }
  return formatRateLimitResponse("allowed", requests, requests, 0, undefined, headerSource);
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
  const resolvedIp = ip || "127.0.0.1";
  const windowMs = parseWindowMs(windowStr);
  const fullKey = `${limiterName}:${resolvedIp}:${keySuffix}`;

  const redis = getRedisClient();
  if (!redis) {
    return handleMissingRedis(headerSource, fullKey, requests, windowMs, "missing_redis_config");
  }

  const appNs = process.env.RATE_LIMIT_NAMESPACE?.trim() || "pickplant";
  const envNs = process.env.VERCEL_ENV?.trim() || process.env.NODE_ENV || "development";
  const prefix = `${appNs}:${envNs}:${limiterName}`;

  try {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, windowStr),
      prefix,
    });

    // 1-second timeout race to prevent slow network / Upstash latency from stalling checkout
    const limitPromise = limiter.limit(`${resolvedIp}:${keySuffix}`);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000));

    const res = await Promise.race([limitPromise, timeoutPromise]);
    if (!res) {
      console.warn(`[RateLimit] Redis timed out for ${limiterName}, falling back to memory limiter.`);
      return handleMissingRedis(headerSource, fullKey, requests, windowMs, "redis_error");
    }

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
    return handleMissingRedis(headerSource, fullKey, requests, windowMs, "redis_error");
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
