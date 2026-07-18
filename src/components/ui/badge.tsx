import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";
export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-semibold text-[var(--primary)]",
        className
      )}
      {...props}
    />
  );
}
