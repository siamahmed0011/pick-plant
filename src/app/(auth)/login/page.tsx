import { AuthForm } from "@/components/auth/auth-form";
import { Container } from "@/components/shared/container";
import { getSafeCallbackUrl } from "@/lib/auth/callback";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = getSafeCallbackUrl(callbackUrl);

  return (
    <main className="store-section">
      <Container>
        <AuthForm mode="login" callbackUrl={safeCallbackUrl} />
      </Container>
    </main>
  );
}
