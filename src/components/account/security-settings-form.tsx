"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { changePasswordAction } from "@/app/account/actions";
import { PasswordField } from "@/components/auth/password-field";
import { StatusNotice } from "@/components/auth/status-notice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SecuritySettingsForm() {
  const [currentVisible, setCurrentVisible] = useState(false);
  const [newVisible, setNewVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmation = String(formData.get("confirmPassword") ?? "");
    const validationErrors: string[] = [];
    if (!currentPassword) validationErrors.push("Enter your current password.");
    if (newPassword.length < 8)
      validationErrors.push("New password must be at least 8 characters.");
    if (newPassword !== confirmation) validationErrors.push("New passwords must match.");
    setErrors(validationErrors);
    setMessage(null);
    if (validationErrors.length) return;
    setPending(true);
    try {
      const result = await changePasswordAction(formData);
      setMessage(result.message);
    } catch {
      setMessage("Password services are unavailable. Please try again later.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-2xl font-bold">Change password</h2>
      <p className="mt-2 leading-7 text-[var(--muted)]">
        Current-password verification and secure updates will activate with database-backed
        credentials.
      </p>
      <form className="mt-7 grid gap-5" onSubmit={handleSubmit} noValidate>
        <PasswordField
          id="current-password"
          name="currentPassword"
          label="Current password"
          autoComplete="current-password"
          visible={currentVisible}
          onVisibilityChange={setCurrentVisible}
          placeholder="Enter current password"
        />
        <PasswordField
          id="security-new-password"
          name="newPassword"
          label="New password"
          autoComplete="new-password"
          visible={newVisible}
          onVisibilityChange={setNewVisible}
          describedBy="security-password-requirements"
        />
        <p id="security-password-requirements" className="-mt-3 text-sm text-[var(--muted)]">
          Use at least 8 characters. Final policy enforcement will happen securely on the server.
        </p>
        <PasswordField
          id="security-confirm-password"
          name="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          visible={confirmationVisible}
          onVisibilityChange={setConfirmationVisible}
          placeholder="Repeat the new password"
        />
        {errors.length > 0 && (
          <StatusNotice variant="error" role="alert">
            <ul className="grid gap-1">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </StatusNotice>
        )}
        {message && <StatusNotice>{message}</StatusNotice>}
        <Button type="submit" disabled={pending} className="w-full sm:w-fit">
          {pending && <LoaderCircle className="animate-spin" size={18} />}
          {pending ? "Checking availability…" : "Request password change"}
        </Button>
      </form>
    </Card>
  );
}
