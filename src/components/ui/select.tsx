import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("h-11 w-full rounded-xl border bg-white px-3 outline-none", className)}
      {...props}
    />
  );
}
