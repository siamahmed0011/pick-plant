"use server";

import { requireAdmin } from "@/lib/auth/guards";
import {
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  updateAdminNotes,
  OrderError,
} from "@/lib/orders/order-service";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";

export async function updateOrderStatusAction(input: {
  orderId: string;
  status: OrderStatus;
  note?: string;
}) {
  try {
    const session = await requireAdmin("/admin/orders");
    await updateOrderStatus(input, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: "ADMIN",
    });
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${input.orderId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof OrderError) {
      return { success: false, error: error.message };
    }
    console.error("Failed to update order status:", error);
    return { success: false, error: "Failed to update status." };
  }
}

export async function updatePaymentStatusAction(input: {
  orderId: string;
  paymentStatus: PaymentStatus;
  note?: string;
}) {
  try {
    const session = await requireAdmin("/admin/orders");
    await updatePaymentStatus(input, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: "ADMIN",
    });
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${input.orderId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof OrderError) {
      return { success: false, error: error.message };
    }
    console.error("Failed to update payment status:", error);
    return { success: false, error: "Failed to update payment status." };
  }
}

export async function cancelAdminOrderAction(orderId: string, reason?: string) {
  try {
    const session = await requireAdmin("/admin/orders");
    await cancelOrder(
      { orderId, reason },
      {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: "ADMIN",
      }
    );
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof OrderError) {
      return { success: false, error: error.message };
    }
    console.error("Failed to cancel order:", error);
    return { success: false, error: "Failed to cancel order." };
  }
}

export async function updateAdminNotesAction(orderId: string, adminNotes: string) {
  try {
    await requireAdmin("/admin/orders");
    await updateAdminNotes({ orderId, adminNotes });
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof OrderError) {
      return { success: false, error: error.message };
    }
    console.error("Failed to update admin notes:", error);
    return { success: false, error: "Failed to update admin notes." };
  }
}
