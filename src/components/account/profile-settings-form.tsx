"use client";

import { useState } from "react";
import { LoaderCircle, Lock, ShieldCheck } from "lucide-react";
import { updateProfileAction } from "@/app/account/actions";
import { StatusNotice } from "@/components/auth/status-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileSettingsForm({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    if (!fullName) {
      setError("Please enter your full name.");
      return;
    }
    if (phone && !/^\+?[0-9\s-]{7,20}$/.test(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    setError(null);
    setMessage(null);
    setPending(true);
    try {
      const result = await updateProfileAction(formData);
      setMessage(result.message);
    } catch {
      setMessage("Profile services are temporarily unavailable. Please try again later.");
    } finally {
      setPending(false);
    }
  }

  const userInitials = (name ?? "C").charAt(0).toUpperCase();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px] items-start">
      {/* Main Profile Form Card */}
      <div className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-5 sm:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        <form
          className="space-y-4"
          onSubmit={handleSubmit}
          onChange={() => setDirty(true)}
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#66746A] mb-1.5" htmlFor="profile-name">
                Full name <span className="text-red-500">*</span>
              </label>
              <Input
                id="profile-name"
                name="name"
                autoComplete="name"
                defaultValue={name ?? ""}
                placeholder="e.g. Tanvir Ahmed"
                className="h-11 rounded-[14px] text-sm border-[#DDE7DD] text-[#1F2D22] focus-visible:ring-2 focus-visible:ring-[#1E5A3A]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#66746A] mb-1.5" htmlFor="profile-phone">
                Phone number <span className="text-[11px] font-normal text-[#7A877F]">(optional)</span>
              </label>
              <Input
                id="profile-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+880 1700-000000"
                className="h-11 rounded-[14px] text-sm border-[#DDE7DD] text-[#1F2D22] focus-visible:ring-2 focus-visible:ring-[#1E5A3A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#66746A] mb-1.5" htmlFor="profile-email">
              Email address <span className="inline-flex items-center gap-1 text-[11px] font-normal text-[#7A877F] lowercase">(read-only)</span>
            </label>
            <div className="relative">
              <Input
                id="profile-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email ?? ""}
                readOnly
                aria-describedby="profile-email-note"
                className="h-11 rounded-[14px] text-sm bg-stone-100/80 border-[#DDE7DD] text-[#66746A] cursor-not-allowed pr-10"
              />
              <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
            </div>
            <p id="profile-email-note" className="mt-1 text-xs text-[#7A877F]">
              Email address is linked to account security. Contact support if you need to change your email address.
            </p>
          </div>

          {dirty && !message && (
            <StatusNotice variant="info">
              You have unsaved changes. Click save changes to update your profile.
            </StatusNotice>
          )}

          {error && (
            <StatusNotice variant="error" role="alert">
              {error}
            </StatusNotice>
          )}

          {message && <StatusNotice variant="info">{message}</StatusNotice>}

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="submit"
              disabled={pending}
              className="h-11 px-6 font-semibold rounded-[14px] bg-[#1E5A3A] text-white hover:bg-[#17482F] transition shadow-xs text-xs sm:text-sm"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="animate-spin" size={16} />
                  Saving...
                </span>
              ) : (
                "Save changes"
              )}
            </Button>

            {dirty && (
              <Button
                type="reset"
                variant="outline"
                onClick={() => {
                  setDirty(false);
                  setError(null);
                  setMessage(null);
                }}
                className="h-11 px-5 font-semibold rounded-[14px] border-[#DDE7DD] bg-[#FFFFFF] text-[#1F2D22] hover:bg-[#EEF5F0] text-xs sm:text-sm"
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Supporting Account Summary Side Card */}
      <div className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#EAF5EE] text-[#1E5A3A] font-bold text-lg border border-[#DDE7DD]/60">
            {userInitials}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1F2D22] truncate">{name ?? "Customer"}</p>
            <p className="text-xs text-[#66746A] truncate">{email ?? ""}</p>
          </div>
        </div>

        <div className="border-t border-[#DDE7DD] pt-3 space-y-2 text-xs text-[#66746A]">
          <div className="flex items-center justify-between">
            <span>Account Status</span>
            <span className="font-semibold text-emerald-800 flex items-center gap-1">
              <ShieldCheck size={14} /> Active
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Data Protection</span>
            <span className="font-semibold text-[#1F2D22]">Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
