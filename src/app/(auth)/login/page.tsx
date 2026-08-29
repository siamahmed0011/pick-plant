import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { getSafeCallbackUrl } from "@/lib/auth/callback";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Pick Plant account to manage orders, view your wishlist, and access exclusive offers.",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = getSafeCallbackUrl(callbackUrl);

  return <AuthForm mode="login" callbackUrl={safeCallbackUrl} />;
}
