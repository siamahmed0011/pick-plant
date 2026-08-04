"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, KeyRound, LoaderCircle, ShieldAlert, X } from "lucide-react";
import { forgotPasswordAction, resetPasswordAction } from "@/app/(auth)/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { StatusNotice } from "@/components/auth/status-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RecoveryMode = "forgot" | "reset";
type DeferredResult = { ok: boolean; message: string };

export function RecoveryForm({ mode, token }: { mode: RecoveryMode; token?: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<DeferredResult | null>(null);
  const [pending, setPending] = useState(false);

  const isReset = mode === "reset";

  // Password rule indicators
  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const validationErrors: string[] = [];

    if (mode === "forgot") {
      const email = String(formData.get("email") ?? "").trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        validationErrors.push("Please enter a valid email address.");
      }
    } else {
      if (password.length < 8) {
        validationErrors.push("New password must be at least 8 characters.");
      }
      if (!hasLetter || !hasNumber) {
        validationErrors.push("Password must contain at least one letter and one number.");
      }
      if (password !== confirmPassword) {
        validationErrors.push("New passwords must match.");
      }
    }

    setErrors(validationErrors);
    setResult(null);

    if (validationErrors.length > 0) return;

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
        message: "Recovery services are temporarily unavailable. Please try again later.",
      });
    } finally {
      setPending(false);
    }
  }

  // Invalid Token State for Reset Password Mode
  if (isReset && !token) {
    return (
      <AuthShell
        badgeText="Account Recovery"
        title="Invalid Recovery Link"
        subtitle="The password reset link is invalid or missing."
      >
        <div className="space-y-6 py-4 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Invalid or expired token</h1>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              Password reset links expire after a short period for security reasons. Please request a new recovery link to proceed.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/forgot-password"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[var(--primary)] px-6 font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              Request a new recovery link
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] px-6 font-semibold text-[var(--text)] transition hover:bg-[var(--muted-surface)]"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      badgeText="Account Recovery"
      title={isReset ? "Secure Password Reset" : "Reset Your Password"}
      subtitle={
        isReset
          ? "Choose a strong new password to protect your Pick Plant account."
          : "We will generate a secure reset link if an account exists for your email."
      }
    >
      <div>
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]">
            Account recovery
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
            {isReset ? "Choose a new password" : "Forgot your password?"}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            {isReset
              ? "Enter and confirm your new password below."
              : "Enter your registered email address to receive password recovery instructions."}
          </p>
        </div>

        {/* Success State for Reset Password */}
        {isReset && result?.ok ? (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <KeyRound size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text)]">Password updated successfully</h2>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                {result.message}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex w-full h-12 items-center justify-center rounded-xl bg-[var(--primary)] px-6 font-semibold text-white transition hover:bg-[var(--primary-hover)]"
              >
                Sign in with new password
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
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
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div
                  id="password-requirements"
                  className="rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/60 p-3.5 text-xs text-[var(--muted)] space-y-1.5"
                >
                  <p className="font-semibold text-[var(--text)] mb-1">New password requirements:</p>
                  <div className="flex items-center gap-2">
                    <span className={`grid size-4 place-items-center rounded-full text-white ${hasMinLength ? "bg-emerald-600" : "bg-gray-300"}`}>
                      <Check size={10} />
                    </span>
                    <span className={hasMinLength ? "font-medium text-emerald-800" : ""}>At least 8 characters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`grid size-4 place-items-center rounded-full text-white ${hasLetter ? "bg-emerald-600" : "bg-gray-300"}`}>
                      <Check size={10} />
                    </span>
                    <span className={hasLetter ? "font-medium text-emerald-800" : ""}>At least one letter (a-z, A-Z)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`grid size-4 place-items-center rounded-full text-white ${hasNumber ? "bg-emerald-600" : "bg-gray-300"}`}>
                      <Check size={10} />
                    </span>
                    <span className={hasNumber ? "font-medium text-emerald-800" : ""}>At least one number (0-9)</span>
                  </div>
                </div>

                <PasswordField
                  id="confirm-new-password"
                  name="confirmPassword"
                  label="Confirm new password"
                  autoComplete="new-password"
                  visible={confirmationVisible}
                  onVisibilityChange={setConfirmationVisible}
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                {confirmPassword.length > 0 && (
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${passwordsMatch ? "text-emerald-700" : "text-[var(--danger)]"}`}>
                    {passwordsMatch ? (
                      <>
                        <Check size={14} /> Passwords match
                      </>
                    ) : (
                      <>
                        <X size={14} /> Passwords do not match
                      </>
                    )}
                  </div>
                )}

                <input type="hidden" name="token" value={token} />
              </>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-[var(--text)] mb-2" htmlFor="recovery-email">
                  Email address
                </label>
                <Input
                  id="recovery-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-12 rounded-xl text-base sm:text-sm border-[var(--border)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  required
                />
              </div>
            )}

            {errors.length > 0 && (
              <StatusNotice variant="error" role="alert">
                <ul className="list-disc pl-4 space-y-1">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </StatusNotice>
            )}

            {result && (
              <StatusNotice variant={result.ok ? "info" : "error"} role={result.ok ? "status" : "alert"}>
                {result.message}
              </StatusNotice>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="w-full h-12 text-base font-semibold rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white transition shadow-sm"
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <LoaderCircle className="animate-spin" size={18} />
                  {isReset ? "Updating password…" : "Requesting recovery link…"}
                </span>
              ) : isReset ? (
                "Update password"
              ) : (
                "Send recovery link"
              )}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link
            className="font-semibold text-[var(--primary)] hover:underline"
            href="/login"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
