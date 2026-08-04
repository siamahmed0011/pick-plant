"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, LoaderCircle, MailCheck, X } from "lucide-react";
import {
  loginAction,
  registrationAction,
  type AuthActionResult,
} from "@/app/(auth)/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { StatusNotice } from "@/components/auth/status-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formDataToRecord,
  loginSchema,
  registrationSchema,
} from "@/lib/auth/validation";

type AuthMode = "login" | "register";

const pageCopy = {
  login: {
    badge: "Welcome Back",
    shellTitle: "Sign In & Grow Your Garden",
    shellSubtitle: "Access your saved plant wishlist, track order shipments, and manage your account.",
    title: "Sign in to Pick Plant",
    subtitle: "Welcome back! Please enter your account credentials to continue.",
    submit: "Sign in",
    pendingText: "Signing in securely…",
    alternate: "Don't have an account? Create an account",
    alternateHref: "/register",
  },
  register: {
    badge: "Join the Family",
    shellTitle: "Start Your Plant Journey",
    shellSubtitle: "Create an account for exclusive member discounts, order tracking, and plant care guidance.",
    title: "Create your account",
    subtitle: "Fill in your details below to create a secure Pick Plant account.",
    submit: "Create account",
    pendingText: "Creating your account…",
    alternate: "Already have an account? Sign in",
    alternateHref: "/login",
  },
};

function validateForm(formData: FormData, mode: AuthMode) {
  const schema = mode === "login" ? loginSchema : registrationSchema;
  const result = schema.safeParse(formDataToRecord(formData));
  return result.success
    ? []
    : [...new Set(result.error.issues.map((issue) => issue.message))];
}

export function AuthForm({
  mode,
  callbackUrl = "/account",
}: {
  mode: AuthMode;
  callbackUrl?: string;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<AuthActionResult | null>(null);
  const [pending, setPending] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const content = pageCopy[mode];

  // Password requirement real-time checks for registration
  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const validationErrors = validateForm(formData, mode);
    setErrors(validationErrors);
    setResult(null);

    if (validationErrors.length > 0) return;

    setPending(true);
    try {
      const actionResult =
        mode === "login" ? await loginAction(formData) : await registrationAction(formData);

      if (!actionResult.ok && actionResult.fieldErrors) {
        setErrors(actionResult.fieldErrors);
      }

      if (actionResult.ok) {
        if (actionResult.redirectTo) {
          window.location.assign(actionResult.redirectTo);
          return;
        }
        if (mode === "register") {
          setRegSuccess(true);
        }
      }

      setResult(actionResult);
    } catch {
      setResult({
        ok: false,
        message: "We could not reach secure account services. Please try again later.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      badgeText={content.badge}
      title={content.shellTitle}
      subtitle={content.shellSubtitle}
    >
      <div>
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]">
            {content.badge}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
            {content.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            {content.subtitle}
          </p>
        </div>

        {/* Registration Success State Directing to Email Verification */}
        {mode === "register" && regSuccess ? (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[var(--muted-surface)] text-[var(--primary)] shadow-sm">
              <MailCheck size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text)]">Check your inbox</h2>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                {result?.message ?? "Your account was created successfully. Please check your email address to complete verification."}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-3">
              <Link
                href="/verify-email"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-6 font-semibold text-white transition hover:bg-[var(--primary-hover)]"
              >
                Go to Email Verification
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] px-6 font-semibold text-[var(--text)] transition hover:bg-[var(--muted-surface)]"
              >
                Sign in to your account
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {mode === "register" && (
              <div>
                <label className="block text-sm font-semibold text-[var(--text)] mb-2" htmlFor="full-name">
                  Full name
                </label>
                <Input
                  id="full-name"
                  name="name"
                  autoComplete="name"
                  placeholder="e.g. Tanvir Ahmed"
                  className="h-12 rounded-xl text-base sm:text-sm border-[var(--border)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-2" htmlFor="email">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12 rounded-xl text-base sm:text-sm border-[var(--border)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                required
              />
            </div>

            <PasswordField
              id="password"
              name="password"
              label="Password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              visible={showPassword}
              onVisibilityChange={setShowPassword}
              placeholder={mode === "login" ? "Enter your password" : "At least 8 characters"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              describedBy={mode === "register" ? "password-requirements-list" : undefined}
            />

            {/* Password Requirements Checklist for Registration */}
            {mode === "register" && (
              <div
                id="password-requirements-list"
                className="rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/60 p-3.5 text-xs text-[var(--muted)] space-y-1.5"
              >
                <p className="font-semibold text-[var(--text)] mb-1">Password must include:</p>
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
            )}

            {mode === "register" && (
              <>
                <PasswordField
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm password"
                  autoComplete="new-password"
                  visible={showConfirmPassword}
                  onVisibilityChange={setShowConfirmPassword}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                {/* Real-time Confirmation Feedback */}
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

                <label className="flex items-start gap-3 pt-1 text-xs sm:text-sm text-[var(--muted)] cursor-pointer">
                  <input
                    className="mt-0.5 size-4 rounded border-[var(--border)] accent-[var(--primary)] focus:ring-[var(--primary)]"
                    name="terms"
                    type="checkbox"
                    required
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/privacy" className="font-semibold text-[var(--primary)] hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and Pick Plant account policies.
                  </span>
                </label>
              </>
            )}

            <input type="hidden" name="callbackUrl" value={callbackUrl} />

            {/* Validation Errors Notice */}
            {errors.length > 0 && (
              <StatusNotice variant="error" role="alert">
                <ul className="list-disc pl-4 space-y-1">
                  {errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </StatusNotice>
            )}

            {/* Server Action Result Notice */}
            {result && !result.ok && (
              <StatusNotice variant="error" role="alert">
                {result.message}
              </StatusNotice>
            )}

            {result && result.ok && !regSuccess && (
              <StatusNotice variant="success" role="status">
                {result.message}
              </StatusNotice>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white transition shadow-sm"
              disabled={pending}
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <LoaderCircle className="animate-spin" size={18} />
                  {content.pendingText}
                </span>
              ) : (
                content.submit
              )}
            </Button>
          </form>
        )}

        <div className="mt-6 space-y-3 text-center text-sm text-[var(--muted)]">
          <p>
            <Link
              className="font-semibold text-[var(--primary)] hover:underline"
              href={content.alternateHref}
            >
              {content.alternate}
            </Link>
          </p>

          {mode === "login" && (
            <p>
              <Link
                className="text-xs font-medium text-[var(--muted)] hover:text-[var(--primary)] hover:underline"
                href="/forgot-password"
              >
                Forgot password?
              </Link>
            </p>
          )}
        </div>
      </div>
    </AuthShell>
  );
}
