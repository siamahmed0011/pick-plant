"use client";

import { useState } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import { changePasswordAction } from "@/app/account/actions";
import { PasswordField } from "@/components/auth/password-field";
import { StatusNotice } from "@/components/auth/status-notice";
import { Button } from "@/components/ui/button";

export function SecuritySettingsForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [currentVisible, setCurrentVisible] = useState(false);
  const [newVisible, setNewVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // Password requirement real-time checks
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const curr = String(formData.get("currentPassword") ?? "").trim();
    const next = String(formData.get("newPassword") ?? "");
    const conf = String(formData.get("confirmPassword") ?? "");

    const validationErrors: string[] = [];
    if (!curr) validationErrors.push("Please enter your current password.");
    if (next.length < 8) validationErrors.push("New password must be at least 8 characters.");
    if (!hasLetter || !hasNumber) validationErrors.push("Password must contain at least one letter and one number.");
    if (next !== conf) validationErrors.push("New passwords must match.");

    setErrors(validationErrors);
    setMessage(null);

    if (validationErrors.length > 0) return;

    setPending(true);
    try {
      const result = await changePasswordAction(formData);
      setMessage(result.message);
    } catch {
      setMessage("Password updates are temporarily unavailable. Please try again later.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-[#1F2D22]">Change password</h2>
        <p className="text-xs text-[#66746A] mt-0.5">
          Update your account password using your current password.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <PasswordField
          id="current-password"
          name="currentPassword"
          label="Current password"
          autoComplete="current-password"
          visible={currentVisible}
          onVisibilityChange={setCurrentVisible}
          placeholder="Enter current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <PasswordField
          id="security-new-password"
          name="newPassword"
          label="New password"
          autoComplete="new-password"
          visible={newVisible}
          onVisibilityChange={setNewVisible}
          describedBy="security-password-requirements"
          placeholder="At least 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        {/* Short requirement text */}
        <div
          id="security-password-requirements"
          className="rounded-[14px] border border-[#DDE7DD] bg-[#EEF5F0]/60 p-3 text-xs text-[#66746A] space-y-1"
        >
          <p className="font-semibold text-[#1F2D22]">Password must include:</p>
          <div className="flex items-center gap-2">
            <span className={`grid size-3.5 place-items-center rounded-full text-white ${hasMinLength ? "bg-emerald-600" : "bg-gray-300"}`}>
              <Check size={9} />
            </span>
            <span className={hasMinLength ? "font-medium text-emerald-800" : ""}>At least 8 characters</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`grid size-3.5 place-items-center rounded-full text-white ${hasLetter && hasNumber ? "bg-emerald-600" : "bg-gray-300"}`}>
              <Check size={9} />
            </span>
            <span className={hasLetter && hasNumber ? "font-medium text-emerald-800" : ""}>At least one letter and one number</span>
          </div>
        </div>

        <PasswordField
          id="security-confirm-password"
          name="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          visible={confirmationVisible}
          onVisibilityChange={setConfirmationVisible}
          placeholder="Repeat the new password"
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

        {errors.length > 0 && (
          <StatusNotice variant="error" role="alert">
            <ul className="list-disc pl-4 space-y-1">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </StatusNotice>
        )}

        {message && <StatusNotice variant="info">{message}</StatusNotice>}

        <Button
          type="submit"
          disabled={pending}
          className="h-11 px-6 font-semibold rounded-[14px] bg-[#1E5A3A] text-white hover:bg-[#17482F] transition shadow-xs text-xs sm:text-sm"
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <LoaderCircle className="animate-spin" size={16} />
              Updating password...
            </span>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
    </div>
  );
}
