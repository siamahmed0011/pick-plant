import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type NoticeVariant = "info" | "error" | "success" | "warning";

export function StatusNotice({
  children,
  variant = "info",
  role = "status",
}: {
  children: React.ReactNode;
  variant?: NoticeVariant;
  role?: "status" | "alert";
}) {
  const iconMap = {
    info: Info,
    error: AlertCircle,
    success: CheckCircle2,
    warning: AlertTriangle,
  };

  const Icon = iconMap[variant];

  const styleMap: Record<NoticeVariant, string> = {
    error: "border-[var(--danger)]/30 bg-red-50/90 text-[var(--danger)] dark:bg-red-950/20",
    success: "border-emerald-500/30 bg-emerald-50/90 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300",
    warning: "border-amber-500/30 bg-amber-50/90 text-amber-900 dark:bg-amber-950/20 dark:text-amber-300",
    info: "border-[var(--border)] bg-[var(--muted-surface)] text-[var(--primary)]",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 text-sm leading-relaxed font-medium shadow-sm transition-all",
        styleMap[variant]
      )}
      role={role}
      aria-live="polite"
    >
      <Icon className="mt-0.5 shrink-0 size-5" aria-hidden="true" />
      <div className="flex-1 space-y-1">{children}</div>
    </div>
  );
}
