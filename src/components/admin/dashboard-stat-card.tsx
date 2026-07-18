import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/formatters";

export function DashboardStatCard({
  label,
  value,
  description,
  Icon,
}: {
  label: string;
  value: number | null;
  description: string;
  Icon: LucideIcon;
}) {
  return (
    <Card className="flex min-h-40 flex-col justify-between p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--muted-surface)] text-[var(--primary)]">
          <Icon size={19} aria-hidden="true" />
        </span>
      </div>
      <div className="mt-5">
        <p className="text-3xl font-bold tracking-[-0.03em]" aria-label={`${label}: ${value ?? "unavailable"}`}>
          {value === null ? "—" : formatNumber(value)}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">{description}</p>
      </div>
    </Card>
  );
}
