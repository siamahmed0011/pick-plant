import type { OnlinePaymentProvider } from "@/lib/orders/payment-initiation-eligibility";
import { verifiedPaymentRedirectUrl } from "@/lib/payments/payment-redirect-url";

export type PaymentRedirectResult =
  | { success: true; redirectUrl: string }
  | { success: false; unavailable: boolean };

export async function requestOnlinePaymentRedirect(
  orderId: string,
  provider: OnlinePaymentProvider,
): Promise<PaymentRedirectResult> {
  try {
    const response = await fetch(
      `/api/payments/${provider.toLowerCase()}/initiate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      },
    );
    const payload = (await response.json()) as {
      redirectUrl?: unknown;
      code?: unknown;
    };

    if (!response.ok) {
      return {
        success: false,
        unavailable:
          response.status === 409 || payload.code === "PAYMENT_NOT_ELIGIBLE",
      };
    }

    const redirectUrl = verifiedPaymentRedirectUrl(
      payload.redirectUrl,
      provider,
    );
    if (!redirectUrl) return { success: false, unavailable: false };

    return { success: true, redirectUrl };
  } catch {
    return { success: false, unavailable: false };
  }
}
