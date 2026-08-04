import { RecoveryForm } from "@/components/auth/recovery-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const tokenValue = (await searchParams).token;
  const token =
    typeof tokenValue === "string" && tokenValue.length <= 2048 ? tokenValue : undefined;

  return <RecoveryForm mode="reset" token={token} />;
}
