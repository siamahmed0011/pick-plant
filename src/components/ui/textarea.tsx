import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-xl border bg-white p-3 outline-none placeholder:text-[var(--muted)]",
        className
      )}
      {...props}
    />
  );
}
