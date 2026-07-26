import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^(\+88)?01[3-9]\d{8}$/.test(val.replace(/\s+/g, "")), {
      message: "Please enter a valid Bangladeshi phone number (e.g. 01700000000)",
    }),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(150, "Subject is too long"),
  inquiryType: z.string().default("General Inquiry"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
  consent: z.boolean().refine((val) => val === true, "You must agree to allow us to process your message"),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
