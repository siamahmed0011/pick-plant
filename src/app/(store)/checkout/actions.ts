"use server";

import {
  AuthenticationServiceUnavailableError,
  getCheckoutSession,
  InvalidOrExpiredSessionError,
} from "@/lib/auth/session";
import { createOrder, OrderError } from "@/lib/orders/order-service";
import type { CheckoutInput } from "@/lib/orders/order-validation";
import {
  completeCheckoutIdempotency,
  prepareCheckoutIdempotency,
  requireCheckoutIdempotency,
} from "@/lib/orders/checkout-idempotency";

export type CheckoutActionResult =
  | {
      success: true;
      orderId: string;
      orderNumber: string;
      paymentProvider: string | null;
      expiresAt: string | null;
    }
  | { success: false; error: string };

function safeAuthenticationError(error: unknown) {
  if (error instanceof InvalidOrExpiredSessionError) {
    return "Your session has expired. Please sign in again before checking out.";
  }
  if (error instanceof AuthenticationServiceUnavailableError) {
    return "Checkout authentication is temporarily unavailable. Please try again.";
  }
  return null;
}

export async function prepareCheckoutSubmissionAction() {
  try {
    const session = await getCheckoutSession();
    await prepareCheckoutIdempotency(session?.user?.id);
    return { success: true } as const;
  } catch (error) {
    return {
      success: false,
      error:
        safeAuthenticationError(error) ??
        "Checkout could not be prepared. Please try again.",
    } as const;
  }
}

export async function completeCheckoutSubmissionAction() {
  await completeCheckoutIdempotency();
}

export async function placeOrderAction(input: CheckoutInput): Promise<CheckoutActionResult> {
  try {
    const session = await getCheckoutSession();
    const checkoutIdempotencyKey = await requireCheckoutIdempotency();
    const order = await createOrder(
      input,
      session?.user?.id,
      checkoutIdempotencyKey,
    );
    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentProvider: order.paymentProvider,
      expiresAt: order.expiresAt?.toISOString() ?? null,
    };
  } catch (error) {
    const authenticationError = safeAuthenticationError(error);
    if (authenticationError) {
      return { success: false, error: authenticationError };
    }
    if (error instanceof OrderError) {
      return { success: false, error: error.message };
    }
    console.error("Failed to place order:", error);
    return { success: false, error: "An unexpected error occurred while placing your order. Please try again." };
  }
}
