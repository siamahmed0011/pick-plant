"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, MailCheck, Send } from "lucide-react";
import { resendVerificationAction } from "@/app/(auth)/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { StatusNotice } from "@/components/auth/status-notice";
import { Button } from "@/components/ui/button";
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
    const email = String(formData.get("email") ?? "").trim();

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
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
        message: "Verification services are temporarily unavailable. Please try again later.",
      });
    } finally {
      setPending(false);
    }
  }

  // Determine state category
  const isSuccess = initialResult?.ok === true;
  const isError = initialResult?.ok === false;
  const isMissingToken = !initialToken && !initialResult;

  return (
    <AuthShell
      badgeText="Email Verification"
      title="Verify Account Email"
      subtitle="Complete your email verification to enable full account features and order notifications."
    >
      <div className="space-y-6">
        <div className="text-center">
          <span className={`mx-auto grid size-16 place-items-center rounded-2xl ${
            isSuccess
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : isError
              ? "bg-red-50 text-red-600 border border-red-200"
              : "bg-[var(--muted-surface)] text-[var(--primary)] border border-[var(--border)]"
          }`}>
            {isSuccess ? (
              <CheckCircle2 size={32} />
            ) : isError ? (
              <AlertCircle size={32} />
            ) : (
              <MailCheck size={32} />
            )}
          </span>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
            {isSuccess
              ? "Email Verified!"
              : isError
              ? "Verification Link Expired"
              : "Verify your email"}
          </h1>

          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            {isSuccess
              ? "Your Pick Plant account email has been verified. You can now sign in and enjoy full member privileges."
              : isError
              ? "This verification link is invalid, expired, or has already been used."
              : "Check your inbox for a verification link, or request a new verification email below."}
          </p>
        </div>

        {/* Initial Verification Result Status Notice */}
        {initialResult && (
          <StatusNotice
            variant={initialResult.ok ? "success" : "error"}
            role={initialResult.ok ? "status" : "alert"}
          >
            {initialResult.message}
          </StatusNotice>
        )}

        {/* Missing Token Info */}
        {isMissingToken && (
          <StatusNotice variant="info" role="status">
            No verification token was provided in the URL. Please enter your email below to request a verification link.
          </StatusNotice>
        )}

        {/* Resend Verification Email Section */}
        {(!isSuccess || isMissingToken || isError) && (
          <form className="mt-6 space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--muted-surface)]/50 p-4 sm:p-5" onSubmit={handleResend} noValidate>
            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-2" htmlFor="verification-email">
                Request new verification email
              </label>
              <Input
                id="verification-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12 rounded-xl text-base sm:text-sm bg-white border-[var(--border)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                required
              />
            </div>

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

            <Button
              type="submit"
              disabled={pending}
              className="w-full h-11 font-semibold rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white transition shadow-sm"
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <LoaderCircle className="animate-spin" size={18} />
                  Sending link…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send size={16} /> Send verification email
                </span>
              )}
            </Button>
          </form>
        )}

        {/* Clear Action CTAs */}
        <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[var(--primary)] px-6 font-semibold text-white transition hover:bg-[var(--primary-hover)] shadow-sm"
          >
            Sign in to account
          </Link>
          <Link
            href="/account"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-[var(--border)] px-6 font-semibold text-[var(--text)] transition hover:bg-[var(--muted-surface)]"
          >
            My Account
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
