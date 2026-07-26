import { NextResponse } from "next/server";
import { submitContactMessage } from "@/lib/contact/contact-service";
import { contactFormSchema } from "@/lib/contact/contact-validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = contactFormSchema.parse(body);
    const result = await submitContactMessage(validated);
    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
