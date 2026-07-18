import { VerificationPanel } from "@/components/auth/verification-panel";
import { Container } from "@/components/shared/container";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const token = (await searchParams).token;
  const hasToken = typeof token === "string" && token.length > 0 && token.length <= 2048;

  return (
    <main className="store-section w-full">
      <Container>
        <VerificationPanel hasToken={hasToken} />
      </Container>
    </main>
  );
}
