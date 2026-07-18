"use client";

import Link from "next/link";
import { LoaderCircle, MailCheck } from "lucide-react";
import { useState } from "react";
import { resendVerificationAction } from "@/app/(auth)/actions";
import { StatusNotice } from "@/components/auth/status-notice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function VerificationPanel({ hasToken }: { hasToken: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleResend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      setMessage(null);
      return;
    }
    setError(null);
    setPending(true);
    try {
      const result = await resendVerificationAction(formData);
      setMessage(result.message);
    } catch {
      setMessage("Verification services are unavailable. Please try again later.");
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
        Email verification will activate when secure account storage and email delivery are
        integrated.
      </p>
      <div className="mt-6 text-left">
        <StatusNotice variant={hasToken ? "info" : "error"} role={hasToken ? "status" : "alert"}>
          {hasToken
            ? "A verification token was supplied, but it cannot be trusted, validated, or checked for expiry yet."
            : "No verification token was provided. Use a future secure verification link or request another email."}
        </StatusNotice>
      </div>
      <form className="mt-6 grid gap-4 text-left" onSubmit={handleResend} noValidate>
        <label className="grid gap-2 font-medium" htmlFor="verification-email">
          Email address
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
        {message && <StatusNotice>{message}</StatusNotice>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending && <LoaderCircle className="animate-spin" size={18} />}
          {pending ? "Checking availability…" : "Request verification email"}
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
