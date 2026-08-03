import { createHash } from "node:crypto";

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

function isValidIPv6(ip: string): boolean {
  if (!ip || !ip.includes(":")) return false;
  let clean = ip.trim();
  if (clean.startsWith("[") && clean.endsWith("]")) {
    clean = clean.slice(1, -1);
  }
  const parts = clean.split(":");
  if (parts.length < 2 || parts.length > 8) return false;
  return parts.every((p) => p === "" || /^[a-fA-F0-9]{1,4}$/.test(p));
}

export function sanitizeCandidateIp(candidate: string | null | undefined): string | null {
  if (!candidate || typeof candidate !== "string" || candidate.length > 128) return null;
  let ip = candidate.trim();

  // Strip IPv4 port (e.g. 192.168.1.1:8080)
  if (ip.includes(":") && !ip.includes("::")) {
    const parts = ip.split(":");
    if (parts.length === 2 && /^\d+$/.test(parts[1])) {
      ip = parts[0];
    }
  }

  if (ip.startsWith("[") && ip.endsWith("]")) {
    ip = ip.slice(1, -1);
  }

  if (IPV4_REGEX.test(ip) || isValidIPv6(ip)) {
    return ip;
  }

  return null;
}

export function getClientIp(
  headers: Headers | Record<string, string | string[] | undefined>
): string | null {
  let forwardedFor: string | null = null;
  let realIp: string | null = null;
  let cfConnectingIp: string | null = null;

  if (typeof (headers as Headers).get === "function") {
    const h = headers as Headers;
    forwardedFor = h.get("x-forwarded-for");
    realIp = h.get("x-real-ip");
    cfConnectingIp = h.get("cf-connecting-ip");
  } else {
    const h = headers as Record<string, string | string[] | undefined>;
    const getVal = (key: string) => {
      const v = h[key] || h[key.toLowerCase()];
      return Array.isArray(v) ? v[0] : v;
    };
    forwardedFor = getVal("x-forwarded-for") ?? null;
    realIp = getVal("x-real-ip") ?? null;
    cfConnectingIp = getVal("cf-connecting-ip") ?? null;
  }

  const trustCloudflare = process.env.TRUST_CLOUDFLARE_PROXY?.trim().toLowerCase() === "true";

  if (trustCloudflare && cfConnectingIp) {
    const validCfIp = sanitizeCandidateIp(cfConnectingIp);
    if (validCfIp) return validCfIp;
  }

  if (realIp) {
    const validRealIp = sanitizeCandidateIp(realIp);
    if (validRealIp) return validRealIp;
  }

  if (forwardedFor) {
    const candidates = forwardedFor.split(",");
    for (const rawCandidate of candidates) {
      const valid = sanitizeCandidateIp(rawCandidate);
      if (valid) return valid;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return "127.0.0.1";
  }

  return null;
}

export function normalizeIdentifier(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.trim().toLowerCase();
}

export function hashIdentifier(normalized: string): string {
  if (!normalized) return "anonymous";
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfterSeconds: number;
  error?: string;
};

export function formatRateLimitResponse(
  success: boolean,
  limit: number,
  remaining: number,
  resetMs: number,
  error?: string
): RateLimitResult {
  const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));
  return {
    success,
    limit,
    remaining,
    resetMs,
    retryAfterSeconds,
    error,
  };
}
