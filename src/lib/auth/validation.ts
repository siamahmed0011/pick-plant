import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be 128 characters or fewer.")
  .regex(/[A-Za-z]/, "Password must contain at least one letter.")
  .regex(/[0-9]/, "Password must contain at least one number.");

const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter your full name.")
  .max(100, "Name must be 100 characters or fewer.");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  callbackUrl: z.string().optional(),
});

export const registrationSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    terms: z.preprocess(
      (value) => value === "on" || value === "true" || value === true,
      z.boolean(),
    ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.terms, {
    message: "Accept the terms to continue.",
    path: ["terms"],
  });

export const adminProvisionSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export function formDataToRecord(formData: FormData) {
  return Object.fromEntries(formData.entries());
}
