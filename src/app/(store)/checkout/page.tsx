import { getOptionalSession } from "@/lib/auth/session";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata = {
  title: "Checkout | Pick Plant",
  description: "Complete your plant order securely.",
};

export default async function CheckoutPage() {
  const session = await getOptionalSession();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-[var(--primary)] mb-8">Checkout</h1>
      <CheckoutForm
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
