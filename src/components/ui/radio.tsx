import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";
export function Radio({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input type="radio" className={cn("size-4 accent-[var(--primary)]", className)} {...props} />
  );
}
