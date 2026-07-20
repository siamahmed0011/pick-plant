import { z } from "zod";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

export const checkoutItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const checkoutFormSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Please enter a valid email address"),
  customerPhone: z.string().min(6, "Please enter a valid phone number"),
  shippingAddressLine1: z.string().min(3, "Address line 1 is required"),
  shippingAddressLine2: z.string().optional().nullable(),
  shippingCity: z.string().min(2, "City is required"),
  shippingDistrict: z.string().min(2, "District is required"),
  shippingArea: z.string().optional().nullable(),
  shippingPostalCode: z.string().optional().nullable(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  customerNote: z.string().max(1000, "Note is too long").optional().nullable(),
  items: z.array(checkoutItemSchema).min(1, "Your cart is empty"),
});

export type CheckoutInput = z.infer<typeof checkoutFormSchema>;

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.nativeEnum(OrderStatus),
  note: z.string().max(500).optional().nullable(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const updatePaymentStatusSchema = z.object({
  orderId: z.string().uuid(),
  paymentStatus: z.nativeEnum(PaymentStatus),
  note: z.string().max(500).optional().nullable(),
});

export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;

export const updateAdminNotesSchema = z.object({
  orderId: z.string().uuid(),
  adminNotes: z.string().max(2000),
});

export type UpdateAdminNotesInput = z.infer<typeof updateAdminNotesSchema>;
