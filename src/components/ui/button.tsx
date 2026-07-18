import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};
const variants = {
  primary:
    "bg-[var(--primary)] text-white shadow-sm hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-md",
  secondary:
    "bg-[var(--muted-surface)] text-[var(--primary)] hover:-translate-y-0.5 hover:bg-white",
  outline:
    "border border-[var(--primary)] text-[var(--primary)] hover:-translate-y-0.5 hover:bg-[var(--muted-surface)]",
  ghost: "hover:bg-[var(--muted-surface)]",
  danger: "bg-[var(--danger)] text-white hover:-translate-y-0.5 hover:brightness-90",
};
const sizes = { sm: "h-9 px-3 text-sm", md: "h-11 px-5", lg: "h-12 px-7 text-lg", icon: "size-11" };
export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
