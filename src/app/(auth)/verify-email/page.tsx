import { VerificationPanel } from "@/components/auth/verification-panel";
import { verifyEmailAction } from "@/app/(auth)/actions";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const tokenParam = (await searchParams).token;
  const token =
    typeof tokenParam === "string" && tokenParam.length > 0 && tokenParam.length <= 2048
      ? tokenParam
      : undefined;

  let initialResult = null;
  if (token) {
    initialResult = await verifyEmailAction(token);
  }

  return <VerificationPanel initialToken={token} initialResult={initialResult} />;
}
