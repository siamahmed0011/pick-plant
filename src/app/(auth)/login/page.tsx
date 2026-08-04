import { AuthForm } from "@/components/auth/auth-form";
import { getSafeCallbackUrl } from "@/lib/auth/callback";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = getSafeCallbackUrl(callbackUrl);

  return <AuthForm mode="login" callbackUrl={safeCallbackUrl} />;
}
