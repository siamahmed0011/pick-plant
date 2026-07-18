import Link from "next/link";
import { RecoveryForm } from "@/components/auth/recovery-form";
import { StatusNotice } from "@/components/auth/status-notice";
import { Container } from "@/components/shared/container";
import { Card } from "@/components/ui/card";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const tokenValue = (await searchParams).token;
  const token =
    typeof tokenValue === "string" && tokenValue.length <= 2048 ? tokenValue : undefined;

  return (
    <main className="store-section w-full">
      <Container>
        {token ? (
          <RecoveryForm mode="reset" token={token} />
        ) : (
          <Card className="mx-auto max-w-lg p-6 sm:p-9">
            <h1 className="text-3xl font-bold tracking-[-0.02em]">Reset password</h1>
            <div className="mt-6">
              <StatusNotice variant="error" role="alert">
                The reset token is missing or invalid. Expired and invalid tokens will be verified
                securely when recovery services are connected.
              </StatusNotice>
            </div>
            <Link
              className="mt-6 inline-flex font-semibold text-[var(--primary)] hover:underline"
              href="/forgot-password"
            >
              Request a new recovery link
            </Link>
          </Card>
        )}
      </Container>
    </main>
  );
}
