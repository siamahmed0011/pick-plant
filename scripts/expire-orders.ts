import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const secret = process.env.CRON_SECRET?.trim();
const baseUrl = process.argv[2]?.trim() || "http://localhost:3000";

if (!secret) {
  console.error("CRON_SECRET is required to invoke order expiration.");
  process.exitCode = 1;
} else {
  try {
    const endpoint = new URL("/api/internal/orders/expire", baseUrl);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
      },
    });
    const result = (await response.json()) as {
      scanned?: number;
      expired?: number;
      skipped?: number;
      failed?: number;
      error?: string;
    };

    if (!response.ok) {
      console.error(
        result.error || `Order expiration failed with HTTP ${response.status}.`,
      );
      process.exitCode = 1;
    } else {
      console.log(
        `Order expiration complete: scanned=${result.scanned ?? 0}, expired=${result.expired ?? 0}, skipped=${result.skipped ?? 0}, failed=${result.failed ?? 0}`,
      );
    }
  } catch (error) {
    console.error("Could not invoke the order expiration endpoint.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    process.exitCode = 1;
  }
}
