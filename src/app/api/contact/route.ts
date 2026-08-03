import { NextResponse } from "next/server";
import { submitContactMessage } from "@/lib/contact/contact-service";
import { contactFormSchema } from "@/lib/contact/contact-validation";
import { getClientIp } from "@/lib/rate-limit/helpers";
import { checkContactRateLimit } from "@/lib/rate-limit/rate-limit";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request.headers);
    const rateLimit = await checkContactRateLimit(clientIp);

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Too many contact messages submitted. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

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
