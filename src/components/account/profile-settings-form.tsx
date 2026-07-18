"use client";

import { LoaderCircle, UserRound } from "lucide-react";
import { useState } from "react";
import { updateProfileAction } from "@/app/account/actions";
import { StatusNotice } from "@/components/auth/status-notice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      setError("Enter your full name.");
      return;
    }
    if (phone && !/^\+?[0-9\s-]{7,20}$/.test(phone)) {
      setError("Enter a valid phone number or leave it blank.");
      return;
    }
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      const result = await updateProfileAction(formData);
      setMessage(result.message);
    } catch {
      setMessage("Profile services are unavailable. Please try again later.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-center">
        <span className="grid size-20 shrink-0 place-items-center rounded-full bg-[var(--muted-surface)] text-[var(--primary)]">
          <UserRound size={32} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-2xl font-bold">Profile details</h2>
          <p className="mt-1 text-[var(--muted)]">
            Profile photos and updates will be stored when secure account persistence is connected.
          </p>
        </div>
      </div>
      <form
        className="mt-7 grid gap-5"
        onSubmit={handleSubmit}
        onChange={() => setDirty(true)}
        noValidate
      >
        <label className="grid gap-2 font-medium" htmlFor="profile-name">
          Full name
          <Input id="profile-name" name="name" autoComplete="name" defaultValue={name ?? ""} />
        </label>
        <label className="grid gap-2 font-medium" htmlFor="profile-email">
          Email address
          <Input
            id="profile-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email ?? ""}
            readOnly
            aria-describedby="profile-email-note"
            className="bg-[var(--muted-surface)]"
          />
          <span id="profile-email-note" className="text-sm font-normal text-[var(--muted)]">
            Email changes require future verification and are read-only in this phase.
          </span>
        </label>
        <label className="grid gap-2 font-medium" htmlFor="profile-phone">
          Phone number <span className="text-sm font-normal text-[var(--muted)]">(optional)</span>
          <Input
            id="profile-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+880 1XXX-XXXXXX"
          />
        </label>
        {dirty && !message && (
          <StatusNotice>You have local, unsaved changes. Nothing has been persisted.</StatusNotice>
        )}
        {error && (
          <StatusNotice variant="error" role="alert">
            {error}
          </StatusNotice>
        )}
        {message && <StatusNotice>{message}</StatusNotice>}
        <Button type="submit" disabled={pending} className="w-full sm:w-fit">
          {pending && <LoaderCircle className="animate-spin" size={18} />}
          {pending ? "Checking availability…" : "Request profile update"}
        </Button>
      </form>
    </Card>
  );
}
