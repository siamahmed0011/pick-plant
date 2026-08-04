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
      subtitle="Confirm your email address to complete your account setup and access member privileges."
    >
      <div className="space-y-5">
        <div className="text-center">
          <span className={`mx-auto grid size-13 place-items-center rounded-2xl ${
            isSuccess
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : isError
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-[#EEF5F0] text-[#1E5A3A] border border-[#DDE7DD]"
          }`}>
            {isSuccess ? (
              <CheckCircle2 size={26} />
            ) : isError ? (
              <AlertCircle size={26} />
            ) : (
              <MailCheck size={26} />
            )}
          </span>

          <h1 className="mt-3 text-[22px] sm:text-[26px] font-bold tracking-tight text-[#1F2D22]">
            {isSuccess
              ? "Email Verified!"
              : isError
              ? "Verification Link Expired"
              : "Verify your email"}
          </h1>

          <p className="mt-1 text-xs text-[#66746A] leading-relaxed max-w-sm mx-auto">
            {isSuccess
              ? "Your Pick Plant account email has been verified. You can now sign in and enjoy full member features."
              : isError
              ? "This verification link is invalid, expired, or has already been used. Please request a new link below."
              : "Check your inbox for a verification link, or request a new verification email below."}
          </p>
        </div>

        {/* Small Contextual Status Notice */}
        {initialResult && (
          <StatusNotice
            variant={initialResult.ok ? "success" : "error"}
            role={initialResult.ok ? "status" : "alert"}
          >
            {initialResult.message}
          </StatusNotice>
        )}

        {isMissingToken && (
          <StatusNotice variant="info" role="status">
            No verification token was provided in the link. Please enter your email address below to request a verification link.
          </StatusNotice>
        )}

        {/* Resend Verification Email Section */}
        {(!isSuccess || isMissingToken || isError) && (
          <form className="mt-4 space-y-3.5 rounded-[18px] border border-[#DDE7DD] bg-[#EEF5F0]/50 p-4" onSubmit={handleResend} noValidate>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#66746A] mb-1.5" htmlFor="verification-email">
                Request new verification email
              </label>
              <Input
                id="verification-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-11 rounded-[14px] text-sm bg-white border-[#DDE7DD] text-[#1F2D22] focus-visible:ring-2 focus-visible:ring-[#1E5A3A]"
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
              className="w-full h-11 font-semibold rounded-[14px] bg-[#1E5A3A] hover:bg-[#17482F] text-white transition shadow-xs text-xs sm:text-sm"
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <LoaderCircle className="animate-spin" size={16} />
                  Sending email...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send size={15} /> Send verification email
                </span>
              )}
            </Button>
          </form>
        )}

        {/* Action Link hierarchy: 1 Primary CTA + 1 Subtle Text Link */}
        <div className="pt-2 text-center space-y-2">
          {isSuccess ? (
            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-[14px] bg-[#1E5A3A] px-6 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#17482F] shadow-xs"
            >
              Sign in to account
            </Link>
          ) : (
            <Link
              href="/account"
              className="inline-flex h-11 w-full items-center justify-center rounded-[14px] bg-[#1E5A3A] px-6 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#17482F] shadow-xs"
            >
              Go to My Account
            </Link>
          )}

          <p>
            <Link
              href="/login"
              className="text-xs font-semibold text-[#66746A] hover:text-[#1E5A3A] hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
