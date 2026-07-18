"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { forgotPasswordAction, resetPasswordAction } from "@/app/(auth)/actions";
import { PasswordField } from "@/components/auth/password-field";
import { StatusNotice } from "@/components/auth/status-notice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type RecoveryMode = "forgot" | "reset";
type DeferredResult = { ok: false; message: string };

export function RecoveryForm({ mode, token }: { mode: RecoveryMode; token?: string }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<DeferredResult | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const validationErrors: string[] = [];
    if (mode === "forgot") {
      const email = String(formData.get("email") ?? "");
      if (!/^\S+@\S+\.\S+$/.test(email)) validationErrors.push("Enter a valid email address.");
    } else {
      const password = String(formData.get("password") ?? "");
      const confirmation = String(formData.get("confirmPassword") ?? "");
      if (password.length < 8) validationErrors.push("New password must be at least 8 characters.");
      if (password !== confirmation) validationErrors.push("New passwords must match.");
    }
    setErrors(validationErrors);
    setResult(null);
    if (validationErrors.length) return;
    setPending(true);
    try {
      const actionResult =
        mode === "forgot"
          ? await forgotPasswordAction(formData)
          : await resetPasswordAction(formData);
      setResult(actionResult);
    } catch {
      setResult({
        ok: false,
        message: "Recovery services are unavailable. Please try again later.",
      });
    } finally {
      setPending(false);
    }
  }

  const isReset = mode === "reset";
  return (
    <Card className="mx-auto w-full max-w-lg p-6 sm:p-9">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
        Account recovery
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
        {isReset ? "Choose a new password" : "Forgot your password?"}
      </h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        {isReset
          ? "Enter a strong new password. Token validation and password updates remain inactive until secure backend integration."
          : "Enter your email address. Recovery email delivery will activate with secure account and email storage."}
      </p>
      {isReset && (
        <div className="mt-5">
          <StatusNotice>
            A token was supplied, but it is treated as untrusted and cannot be checked for validity
            or expiry yet.
          </StatusNotice>
        </div>
      )}
      <form className="mt-7 grid gap-5" onSubmit={handleSubmit} noValidate>
        {isReset ? (
          <>
            <PasswordField
              id="new-password"
              name="password"
              label="New password"
              autoComplete="new-password"
              visible={passwordVisible}
              onVisibilityChange={setPasswordVisible}
              describedBy="password-requirements"
            />
            <p id="password-requirements" className="-mt-3 text-sm text-[var(--muted)]">
              Use at least 8 characters. Future server validation will enforce the final password
              policy.
            </p>
            <PasswordField
              id="confirm-new-password"
              name="confirmPassword"
              label="Confirm new password"
              autoComplete="new-password"
              visible={confirmationVisible}
              onVisibilityChange={setConfirmationVisible}
              placeholder="Repeat the new password"
            />
            <input type="hidden" name="token" value={token} />
          </>
        ) : (
          <label className="grid gap-2 font-medium" htmlFor="recovery-email">
            Email address
            <Input
              id="recovery-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
        )}
        {errors.length > 0 && (
          <StatusNotice variant="error" role="alert">
            <ul className="grid gap-1">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </StatusNotice>
        )}
        {result && <StatusNotice>{result.message}</StatusNotice>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending && <LoaderCircle className="animate-spin" size={18} />}
          {pending
            ? "Checking availability…"
            : isReset
              ? "Request password update"
              : "Request recovery link"}
        </Button>
      </form>
      <Link
        className="mt-6 block text-center text-sm font-semibold text-[var(--primary)] hover:underline"
        href="/login"
      >
        Back to login
      </Link>
    </Card>
  );
}
