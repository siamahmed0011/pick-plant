import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border bg-white px-3 outline-none placeholder:text-[var(--muted)]",
        className
      )}
      {...props}
    />
  );
}
