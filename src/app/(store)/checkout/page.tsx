import {
  AuthenticationServiceUnavailableError,
  getCheckoutSession,
  InvalidOrExpiredSessionError,
} from "@/lib/auth/session";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getAvailablePaymentMethods } from "@/lib/payments/payment-service";
import { asOnlinePaymentProvider } from "@/lib/orders/payment-initiation-eligibility";

export const metadata = {
  title: "Checkout | Pick Plant",
  description: "Complete your plant order securely.",
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  let session = null;
  let authenticationError: string | null = null;

  try {
    session = await getCheckoutSession();
  } catch (error) {
    authenticationError =
      error instanceof InvalidOrExpiredSessionError
        ? "Your session has expired. Please sign in again before checking out."
        : error instanceof AuthenticationServiceUnavailableError
          ? "Checkout authentication is temporarily unavailable. Please try again."
          : "Checkout authentication could not be verified. Please try again.";
  }
  const availableOnlineProviders = getAvailablePaymentMethods()
    .filter((method) => method.enabled)
    .map((method) => asOnlinePaymentProvider(method.provider))
    .filter((provider) => provider !== null);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-[var(--primary)] mb-8">Checkout</h1>
      <CheckoutForm
        availableOnlineProviders={availableOnlineProviders}
        authenticationError={authenticationError}
        initialUser={
          session?.user
            ? {
                name: session.user.name,
                email: session.user.email,
              }
            : null
        }
      />
    </div>
  );
}
