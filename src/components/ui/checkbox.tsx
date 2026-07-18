import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";
export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input type="checkbox" className={cn("size-4 accent-[var(--primary)]", className)} {...props} />
  );
}
