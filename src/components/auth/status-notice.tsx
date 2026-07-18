import { AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusNotice({
  children,
  variant = "info",
  role = "status",
}: {
  children: React.ReactNode;
  variant?: "info" | "error";
  role?: "status" | "alert";
}) {
  const Icon = variant === "error" ? AlertCircle : Info;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-sm leading-6",
        variant === "error"
          ? "border-[var(--danger)]/30 bg-red-50 text-[var(--danger)]"
          : "border-[var(--border)] bg-[var(--muted-surface)] text-[var(--primary)]"
      )}
      role={role}
      aria-live="polite"
    >
      <Icon className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
