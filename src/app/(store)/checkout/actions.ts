"use server";

import { getOptionalSession } from "@/lib/auth/session";
import { createOrder, OrderError } from "@/lib/orders/order-service";
import type { CheckoutInput } from "@/lib/orders/order-validation";

export type CheckoutActionResult =
  | { success: true; orderNumber: string }
  | { success: false; error: string };

export async function placeOrderAction(input: CheckoutInput): Promise<CheckoutActionResult> {
  try {
    const session = await getOptionalSession();
    const order = await createOrder(input, session?.user?.id);
    return { success: true, orderNumber: order.orderNumber };
  } catch (error) {
    if (error instanceof OrderError) {
      return { success: false, error: error.message };
    }
    console.error("Failed to place order:", error);
    return { success: false, error: "An unexpected error occurred while placing your order. Please try again." };
  }
}
