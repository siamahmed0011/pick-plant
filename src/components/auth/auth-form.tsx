"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import {
  loginAction,
  registrationAction,
  type AuthActionResult,
} from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  formDataToRecord,
  loginSchema,
  registrationSchema,
} from "@/lib/auth/validation";

type AuthMode = "login" | "register";

const copy = {
  login: {
    eyebrow: "Welcome back",
    title: "Sign in to Pick Plant",
    description: "Sign in securely to manage your Pick Plant account.",
    submit: "Sign in",
    alternate: "Create an account",
    alternateHref: "/register",
  },
  register: {
    eyebrow: "Grow with us",
    title: "Create your account",
    description: "Create a secure customer account to manage your plants and orders.",
    submit: "Create account",
    alternate: "Already have an account? Sign in",
    alternateHref: "/login",
  },
} satisfies Record<AuthMode, Record<string, string>>;

function validate(formData: FormData, mode: AuthMode) {
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<AuthActionResult | null>(null);
  const [pending, setPending] = useState(false);
  const content = copy[mode];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const validationErrors = validate(formData, mode);
    setErrors(validationErrors);
    setResult(null);
    if (validationErrors.length) return;
    setPending(true);
    try {
      const actionResult =
        mode === "login" ? await loginAction(formData) : await registrationAction(formData);

      if (!actionResult.ok && actionResult.fieldErrors) {
        setErrors(actionResult.fieldErrors);
      }

      if (actionResult.ok && actionResult.redirectTo) {
        window.location.assign(actionResult.redirectTo);
        return;
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
    <Card className="mx-auto w-full max-w-lg p-6 sm:p-9">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
        {content.eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">{content.title}</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">{content.description}</p>
      <form className="mt-8 grid gap-5" onSubmit={handleSubmit} noValidate>
        {mode === "register" && (
          <label className="grid gap-2 font-medium">
            Full name
            <Input name="name" autoComplete="name" placeholder="Your full name" />
          </label>
        )}
        <label className="grid gap-2 font-medium">
          Email address
          <Input name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        </label>
        <label className="grid gap-2 font-medium">
          Password
          <span className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="At least 8 characters"
              className="pr-12"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--muted-surface)] hover:text-[var(--primary)]"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
        {mode === "register" && (
          <>
            <label className="grid gap-2 font-medium">
              Confirm password
              <span className="relative">
                <Input
                  name="confirmPassword"
                  type={showConfirmation ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className="pr-12"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--muted-surface)] hover:text-[var(--primary)]"
                  aria-label={
                    showConfirmation ? "Hide password confirmation" : "Show password confirmation"
                  }
                  onClick={() => setShowConfirmation((visible) => !visible)}
                >
                  {showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-[var(--muted)]">
              <input className="mt-1 size-4 accent-[var(--primary)]" name="terms" type="checkbox" />
              <span>I agree to the terms and the secure account policy.</span>
            </label>
          </>
        )}
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        {errors.length > 0 && (
          <div
            className="rounded-xl border border-[var(--danger)]/30 bg-red-50 p-3 text-sm text-[var(--danger)]"
            role="alert"
          >
            <ul className="grid gap-1">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        {result && (
          <p
            className="rounded-xl bg-[var(--muted-surface)] p-3 text-sm text-[var(--primary)]"
            role="status"
            aria-live="polite"
          >
            {result.message}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" size={18} />}
          {pending ? "Checking secure account access…" : content.submit}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        <Link
          className="font-semibold text-[var(--primary)] hover:underline"
          href={content.alternateHref}
        >
          {content.alternate}
        </Link>
      </p>
      {mode === "login" && (
        <Link
          className="mt-3 block text-center text-sm text-[var(--muted)] hover:text-[var(--primary)]"
          href="/forgot-password"
        >
          Forgot password?
        </Link>
      )}
    </Card>
  );
}
