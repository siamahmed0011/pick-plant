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

import { headers } from "next/headers";
import { checkCheckoutRateLimit } from "@/lib/rate-limit/rate-limit";
import { sendOrderConfirmationEmail } from "@/lib/email/email-service";
import { findExistingOrderBySourceCartId } from "@/lib/orders/order-service";

export async function placeOrderAction(input: CheckoutInput): Promise<CheckoutActionResult> {
  try {
    const session = await getCheckoutSession();
    const checkoutIdempotencyKey = await requireCheckoutIdempotency();

    const existingOrder = await findExistingOrderBySourceCartId(checkoutIdempotencyKey);
    if (existingOrder) {
      return {
        success: true,
        orderId: existingOrder.id,
        orderNumber: existingOrder.orderNumber,
        paymentProvider: existingOrder.paymentProvider,
        expiresAt: existingOrder.expiresAt?.toISOString() ?? null,
      };
    }

    const reqHeaders = await headers();
    const rateLimitKey = session?.user?.id || checkoutIdempotencyKey || "guest";
    const rateLimit = await checkCheckoutRateLimit(reqHeaders, rateLimitKey);

    if (rateLimit.status === "unavailable") {
      return {
        success: false,
        error: "Security verification is temporarily unavailable. Please try again.",
      };
    }

    if (rateLimit.status === "limited") {
      return {
        success: false,
        error: `Too many checkout attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
      };
    }

    const { order, isNewOrder } = await createOrder(
      input,
      session?.user?.id,
      checkoutIdempotencyKey,
    );

    if (isNewOrder) {
      try {
        await sendOrderConfirmationEmail(order);
      } catch (err) {
        console.error("Failed to send order confirmation email:", err);
      }
    }

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
