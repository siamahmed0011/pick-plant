import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function ProductFormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <header className="border-b pb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
      </header>
      <div className="mt-5 grid gap-5">{children}</div>
    </Card>
  );
}
