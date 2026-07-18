import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";
export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={cn("surface p-6", className)} {...props} />;
}
