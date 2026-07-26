import { z } from "zod";
import { CouponType } from "@/generated/prisma/enums";

export const applyCouponSchema = z.object({
  code: z.string().min(1, "Please enter a coupon code").transform((val) => val.trim().toUpperCase()),
});

export const couponFormSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(30, "Code must be at most 30 characters")
    .transform((val) => val.trim().toUpperCase()),
  name: z.string().min(2, "Name is required"),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(CouponType),
  value: z.number().positive("Coupon value must be greater than zero"),
  minimumOrderAmount: z.number().nonnegative().optional().nullable(),
  maximumDiscountAmount: z.number().nonnegative().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  usageLimitPerCustomer: z.number().int().positive().optional().nullable(),
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  appliesToAllProducts: z.boolean().default(true),
  targetProductIds: z.array(z.string().uuid()).optional().default([]),
  targetCategoryIds: z.array(z.string().uuid()).optional().default([]),
});

export type CouponInput = z.infer<typeof couponFormSchema>;
