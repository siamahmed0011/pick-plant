import "server-only";

import {
  getOrderConfirmationEmailTemplate,
  getOrderStatusUpdateEmailTemplate,
  getPasswordResetEmailTemplate,
  getVerificationEmailTemplate,
  type OrderDetailInput,
} from "./templates";

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult =
  | { success: true; id?: string }
  | { success: false; error: string };

export type EmailConfigValidation =
  | { valid: true; apiKey: string; from: string; siteUrl: string }
  | { valid: false; error: string };

const MAX_EMAIL_LEN = 320;
const MAX_SUBJECT_LEN = 256;
const MAX_HTML_LEN = 250 * 1024; // 250KB
const MAX_TEXT_LEN = 100 * 1024; // 100KB

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmailConfig(): EmailConfigValidation {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    if (!apiKey || !apiKey.trim()) {
      return { valid: false, error: "RESEND_API_KEY is required in production." };
    }
    if (!from || !from.trim()) {
      return { valid: false, error: "EMAIL_FROM is required in production." };
    }
    if (!rawSiteUrl || !rawSiteUrl.trim()) {
      return { valid: false, error: "NEXT_PUBLIC_SITE_URL is required in production." };
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawSiteUrl.trim());
    } catch {
      return { valid: false, error: "NEXT_PUBLIC_SITE_URL is an invalid URL string." };
    }

    if (parsedUrl.protocol !== "https:") {
      return { valid: false, error: "NEXT_PUBLIC_SITE_URL must use https:// protocol in production." };
    }

    const host = parsedUrl.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host.endsWith(".local") ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return { valid: false, error: "NEXT_PUBLIC_SITE_URL cannot point to localhost or private IP addresses in production." };
    }

    if (parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) {
      return { valid: false, error: "NEXT_PUBLIC_SITE_URL cannot contain credentials, query parameters, or hash fragments." };
    }

    const cleanSiteUrl = parsedUrl.origin;
    return { valid: true, apiKey: apiKey.trim(), from: from.trim(), siteUrl: cleanSiteUrl };
  }

  // Development explicit handling
  const devApiKey = apiKey?.trim();
  const devFrom = from?.trim() || "Pick Plant <noreply@resend.dev>";
  const devSiteUrl = (rawSiteUrl?.trim() || "http://localhost:3000").replace(/\/+$/, "");

  if (!devApiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[DEV ONLY] RESEND_API_KEY is not configured. Email payload was not sent to Resend.");
    }
    return { valid: false, error: "RESEND_API_KEY is not configured." };
  }

  return { valid: true, apiKey: devApiKey, from: devFrom, siteUrl: devSiteUrl };
}

export function getSiteUrl(): string {
  const config = validateEmailConfig();
  if (config.valid) return config.siteUrl;
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const config = validateEmailConfig();
  if (!config.valid) {
    return { success: false, error: config.error };
  }

  const recipient = options.to.trim();
  if (!recipient || recipient.length > MAX_EMAIL_LEN || !EMAIL_REGEX.test(recipient)) {
    return { success: false, error: "Invalid recipient email address." };
  }

  if (!options.subject || options.subject.length > MAX_SUBJECT_LEN) {
    return { success: false, error: "Email subject exceeds maximum allowed length." };
  }

  if (options.html && options.html.length > MAX_HTML_LEN) {
    return { success: false, error: "Email HTML body exceeds maximum allowed size." };
  }

  if (options.text && options.text.length > MAX_TEXT_LEN) {
    return { success: false, error: "Email plain text body exceeds maximum allowed size." };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [recipient],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      console.error(
        `Email delivery failed with HTTP status ${response.status}`,
        typeof data?.message === "string" ? `: ${data.message}` : ""
      );
      return {
        success: false,
        error: "Failed to deliver email through provider.",
      };
    }

    return {
      success: true,
      id: typeof data?.id === "string" ? data.id : undefined,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Email API request timed out after 10 seconds.");
      return { success: false, error: "Email request timed out." };
    }
    console.error("Email service error:", error instanceof Error ? error.message : "Unknown network error");
    return {
      success: false,
      error: "An unexpected error occurred while sending email.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function sendVerificationEmail(
  email: string,
  rawToken: string
): Promise<SendEmailResult> {
  const siteUrl = getSiteUrl();
  const template = getVerificationEmailTemplate({
    recipientEmail: email,
    rawToken,
    siteUrl,
  });

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  rawToken: string
): Promise<SendEmailResult> {
  const siteUrl = getSiteUrl();
  const template = getPasswordResetEmailTemplate({
    recipientEmail: email,
    rawToken,
    siteUrl,
  });

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendOrderConfirmationEmail(
  order: OrderDetailInput
): Promise<SendEmailResult> {
  if (!order.customerEmail) {
    return { success: false, error: "Order has no customer email address." };
  }

  const siteUrl = getSiteUrl();
  const template = getOrderConfirmationEmailTemplate({
    order,
    siteUrl,
  });

  return sendEmail({
    to: order.customerEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendOrderStatusUpdateEmail(
  order: {
    id?: string | null;
    userId?: string | null;
    customerEmail: string | null;
    customerName?: string | null;
    orderNumber: string;
  },
  newStatus: string
): Promise<SendEmailResult> {
  if (!order.customerEmail) {
    return { success: false, error: "Order has no customer email address." };
  }

  const siteUrl = getSiteUrl();
  const template = getOrderStatusUpdateEmailTemplate({
    id: order.id,
    userId: order.userId,
    orderNumber: order.orderNumber,
    customerName: order.customerName || "Customer",
    newStatus,
    siteUrl,
  });

  return sendEmail({
    to: order.customerEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
