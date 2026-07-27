import { PaymentProvider } from "@/generated/prisma/enums";

type RedirectPaymentProvider =
  | typeof PaymentProvider.STRIPE
  | typeof PaymentProvider.SSLCOMMERZ;

function isAllowedHostname(
  hostname: string,
  provider: RedirectPaymentProvider,
) {
  if (provider === PaymentProvider.STRIPE) {
    return hostname === "checkout.stripe.com";
  }

  return (
    hostname === "sslcommerz.com" ||
    hostname.endsWith(".sslcommerz.com")
  );
}

export function verifiedPaymentRedirectUrl(
  value: unknown,
  provider: RedirectPaymentProvider,
) {
  if (typeof value !== "string" || !value || value.length > 2048) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      isAllowedHostname(url.hostname, provider)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
