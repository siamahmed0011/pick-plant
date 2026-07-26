import { z } from "zod";

export const shippingRateFormSchema = z.object({
  name: z.string().min(2, "Rate name is required"),
  method: z.string().min(2, "Method is required"),
  amount: z.number().nonnegative("Shipping fee cannot be negative"),
  minimumOrderAmount: z.number().nonnegative().optional().nullable(),
  freeShippingThreshold: z.number().nonnegative().optional().nullable(),
  estimatedDeliveryText: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const shippingZoneFormSchema = z.object({
  name: z.string().min(2, "Zone name is required"),
  countries: z.string().default("Bangladesh"),
  regions: z.string().optional().nullable(), // Comma separated cities or districts
  isActive: z.boolean().default(true),
  priority: z.number().int().default(0),
  rates: z.array(shippingRateFormSchema).min(1, "At least one shipping rate is required"),
});

export type ShippingZoneInput = z.infer<typeof shippingZoneFormSchema>;
