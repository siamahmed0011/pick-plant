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
  value,
  onChange,
  required = false,
  className,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  visible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  describedBy?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-[var(--text)] mb-2" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="pr-12 h-12 text-base sm:text-sm rounded-xl border-[var(--border)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] transition"
          aria-describedby={describedBy}
          value={value}
          onChange={onChange}
          required={required}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 grid size-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--muted-surface)] hover:text-[var(--primary)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onClick={() => onVisibilityChange(!visible)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
