import { createHash } from "node:crypto";

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export function isValidIPv6(ip: string): boolean {
  if (!ip || !ip.includes(":")) return false;
  let clean = ip.trim();
  if (clean.includes("%")) {
    clean = clean.split("%")[0];
  }
  const doubleColonCount = (clean.match(/::/g) || []).length;
  if (doubleColonCount > 1) return false;

  if (clean.includes(".")) {
    const lastColon = clean.lastIndexOf(":");
    const ipv4Part = clean.slice(lastColon + 1);
    if (!IPV4_REGEX.test(ipv4Part)) return false;
    clean = clean.slice(0, lastColon) + ":0:0";
  }

  const parts = clean.split(":");
  if (parts.length < 3 || parts.length > 8) return false;
  return parts.every((p) => p === "" || /^[a-fA-F0-9]{1,4}$/.test(p));
}

export function sanitizeCandidateIp(candidate: string | null | undefined): string | null {
  if (!candidate || typeof candidate !== "string" || candidate.length > 128) return null;
  let ip = candidate.trim();

  const bracketMatch = ip.match(/^\[([a-fA-F0-9:%.]+)\](?::\d+)?$/);
  if (bracketMatch) {
    ip = bracketMatch[1];
  } else {
    if (ip.includes(":") && !ip.includes("::")) {
      const parts = ip.split(":");
      if (parts.length === 2 && /^\d+$/.test(parts[1])) {
        ip = parts[0];
      }
    }
  }

  if (ip.includes("%")) {
    ip = ip.split("%")[0];
  }

  if (IPV4_REGEX.test(ip) || isValidIPv6(ip)) {
    return ip;
  }

  return null;
}

export type ClientIpResult = {
  ip: string | null;
  headerSource: string | null;
};

export function getClientIpDetails(
  headers: Headers | Record<string, string | string[] | undefined>
): ClientIpResult {
  const getVal = (key: string): string | null => {
    if (typeof (headers as Headers).get === "function") {
      return (headers as Headers).get(key);
    }
    const h = headers as Record<string, string | string[] | undefined>;
    const v = h[key] || h[key.toLowerCase()];
    return Array.isArray(v) ? v[0] : v ?? null;
  };

  const trustCloudflare = process.env.TRUST_CLOUDFLARE_PROXY?.trim().toLowerCase() === "true";
  const cfConnectingIp = getVal("cf-connecting-ip");
  if (trustCloudflare && cfConnectingIp) {
    const valid = sanitizeCandidateIp(cfConnectingIp);
    if (valid) return { ip: valid, headerSource: "cf-connecting-ip" };
  }

  const vercelForwardedFor = getVal("x-vercel-forwarded-for");
  if (vercelForwardedFor) {
    const candidates = vercelForwardedFor.split(",");
    for (const rawCandidate of candidates) {
      const valid = sanitizeCandidateIp(rawCandidate);
      if (valid) return { ip: valid, headerSource: "x-vercel-forwarded-for" };
    }
  }

  const realIp = getVal("x-real-ip");
  if (realIp) {
    const valid = sanitizeCandidateIp(realIp);
    if (valid) return { ip: valid, headerSource: "x-real-ip" };
  }

  const forwardedFor = getVal("x-forwarded-for");
  if (forwardedFor) {
    const candidates = forwardedFor.split(",");
    for (const rawCandidate of candidates) {
      const valid = sanitizeCandidateIp(rawCandidate);
      if (valid) return { ip: valid, headerSource: "x-forwarded-for" };
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return { ip: "127.0.0.1", headerSource: "development_fallback" };
  }

  return { ip: null, headerSource: null };
}

export function getClientIp(
  headers: Headers | Record<string, string | string[] | undefined>
): string | null {
  return getClientIpDetails(headers).ip;
}

export function normalizeIdentifier(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.trim().toLowerCase();
}

export function hashIdentifier(normalized: string): string {
  if (!normalized) return "anonymous";
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

export type RateLimitStatus = "allowed" | "limited" | "unavailable";

export type RateLimitReason =
  | "missing_ip"
  | "missing_redis_config"
  | "redis_error"
  | "rate_exceeded";

export type RateLimitResult = {
  status: RateLimitStatus;
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfterSeconds: number;
  error?: string;
  headerSource?: string | null;
  reason?: RateLimitReason;
};

export function formatRateLimitResponse(
  status: RateLimitStatus,
  limit: number,
  remaining: number,
  resetMs: number,
  error?: string,
  headerSource?: string | null,
  reason?: RateLimitReason
): RateLimitResult {
  const isLimited = status === "limited";
  const retryAfterSeconds = isLimited ? Math.max(1, Math.ceil(resetMs / 1000)) : 0;
  return {
    status,
    success: status === "allowed",
    limit,
    remaining,
    resetMs: isLimited ? resetMs : 0,
    retryAfterSeconds,
    error,
    headerSource,
    reason,
  };
}

