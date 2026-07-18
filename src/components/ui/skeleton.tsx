import { cn } from "@/lib/utils";
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-[var(--radius)] bg-[var(--muted-surface)]", className)}
    />
  );
}
