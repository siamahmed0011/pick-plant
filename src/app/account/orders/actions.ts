"use server";

import { requireUser } from "@/lib/auth/guards";
import { cancelOrder, OrderError } from "@/lib/orders/order-service";
import { revalidatePath } from "next/cache";

export async function cancelCustomerOrderAction(orderId: string, reason?: string) {
  try {
    const session = await requireUser("/account/orders");
    await cancelOrder(
      { orderId, reason },
      {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        role: "CUSTOMER",
      }
    );
    revalidatePath("/account/orders");
    revalidatePath(`/account/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof OrderError) {
      return { success: false, error: error.message };
    }
    console.error("Customer cancellation failed:", error);
    return { success: false, error: "Failed to cancel order. Please try again." };
  }
}
