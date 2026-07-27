"use client";

import Link from "next/link";
import { LoaderCircle, MailCheck } from "lucide-react";
import { useState } from "react";
import { resendVerificationAction } from "@/app/(auth)/actions";
import { StatusNotice } from "@/components/auth/status-notice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  initialToken?: string;
  initialResult?: { ok: boolean; message: string } | null;
};

export function VerificationPanel({ initialToken, initialResult }: Props) {
  const [resendResult, setResendResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleResend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      setResendResult(null);
      return;
    }
    setError(null);
    setPending(true);
    try {
      const result = await resendVerificationAction(formData);
      setResendResult(result);
    } catch {
      setResendResult({
        ok: false,
        message: "Verification services are unavailable. Please try again later.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-lg p-6 text-center sm:p-9">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--muted-surface)] text-[var(--primary)]">
        <MailCheck size={26} aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">Verify your email</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        Confirm your email address to complete your account setup and access member features.
      </p>
      {initialResult && (
        <div className="mt-6 text-left">
          <StatusNotice
            variant={initialResult.ok ? "info" : "error"}
            role={initialResult.ok ? "status" : "alert"}
          >
            {initialResult.message}
          </StatusNotice>
        </div>
      )}
      {!initialToken && !initialResult && (
        <div className="mt-6 text-left">
          <StatusNotice variant="info" role="status">
            No verification token was provided in the link. Please request a new verification email below.
          </StatusNotice>
        </div>
      )}
      <form className="mt-6 grid gap-4 text-left" onSubmit={handleResend} noValidate>
        <label className="grid gap-2 font-medium" htmlFor="verification-email">
          Resend verification email
          <Input
            id="verification-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        {error && (
          <StatusNotice variant="error" role="alert">
            {error}
          </StatusNotice>
        )}
        {resendResult && (
          <StatusNotice
            variant={resendResult.ok ? "info" : "error"}
            role={resendResult.ok ? "status" : "alert"}
          >
            {resendResult.message}
          </StatusNotice>
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending && <LoaderCircle className="animate-spin" size={18} />}
          {pending ? "Sending request…" : "Request verification email"}
        </Button>
      </form>
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-semibold text-[var(--primary)]">
        <Link href="/login" className="hover:underline">
          Go to login
        </Link>
        <Link href="/account" className="hover:underline">
          Go to account
        </Link>
      </div>
    </Card>
  );
}
