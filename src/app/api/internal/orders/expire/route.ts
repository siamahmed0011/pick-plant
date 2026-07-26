import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { expireStaleUnpaidOrders } from "@/lib/orders/order-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  if (!configuredSecret) return "missing_configuration" as const;

  const authorization = request.headers.get("authorization") ?? "";
  const submittedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const configuredBuffer = Buffer.from(configuredSecret);
  const submittedBuffer = Buffer.from(submittedSecret);

  if (
    configuredBuffer.length !== submittedBuffer.length ||
    !timingSafeEqual(configuredBuffer, submittedBuffer)
  ) {
    return "unauthorized" as const;
  }

  return "authorized" as const;
}

async function handleCleanup(request: Request) {
  const authorization = authorized(request);

  if (authorization === "missing_configuration") {
    return NextResponse.json(
      { error: "Order expiration is not configured." },
      { status: 503 },
    );
  }
  if (authorization === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await expireStaleUnpaidOrders();
    return NextResponse.json(result, {
      status: result.failed > 0 ? 503 : 200,
    });
  } catch (error) {
    console.error("Order expiration cleanup failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Order expiration cleanup failed." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return handleCleanup(request);
}

export async function POST(request: Request) {
  return handleCleanup(request);
}
