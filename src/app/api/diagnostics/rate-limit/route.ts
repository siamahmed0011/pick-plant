import { NextResponse } from "next/server";
import { getClientIpDetails } from "@/lib/rate-limit/helpers";
import { checkRateLimit } from "@/lib/rate-limit/rate-limit";

export async function GET(request: Request) {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    const cronSecret = process.env.CRON_SECRET?.trim();
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    if (!cronSecret || !token || token !== cronSecret) {
      return new Response(null, { status: 404 });
    }
  }

  const ipDetails = getClientIpDetails(request.headers);
  const result = await checkRateLimit("diag_test", "probe", 10, "1 m", ipDetails);

  const resetTimeIso =
    result.resetMs > 0
      ? new Date(Date.now() + result.resetMs).toISOString()
      : null;

  return NextResponse.json({
    status: result.status,
    remaining: result.remaining,
    resetTime: resetTimeIso,
    selectedHeaderSource: result.headerSource ?? "none",
  });
}
