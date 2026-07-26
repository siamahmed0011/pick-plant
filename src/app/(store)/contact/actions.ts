"use server";

import { submitContactMessage } from "@/lib/contact/contact-service";
import { contactFormSchema, type ContactFormInput } from "@/lib/contact/contact-validation";

export async function submitContactAction(data: ContactFormInput) {
  try {
    const validated = contactFormSchema.parse(data);
    const result = await submitContactMessage(validated);
    return { success: true, message: result.message };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred while sending your message. Please try again." };
  }
}
