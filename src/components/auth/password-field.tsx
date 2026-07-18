"use client";

import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  visible,
  onVisibilityChange,
  describedBy,
  placeholder = "At least 8 characters",
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  visible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  describedBy?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 font-medium" htmlFor={id}>
      {label}
      <span className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="pr-12"
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--muted-surface)] hover:text-[var(--primary)]"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onClick={() => onVisibilityChange(!visible)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}
