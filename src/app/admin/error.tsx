"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto grid min-h-80 max-w-2xl place-items-center p-6 text-center sm:p-10">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-[var(--danger)]">
          <AlertTriangle size={22} aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">The admin dashboard could not be displayed</h1>
        <p className="mx-auto mt-2 max-w-lg leading-7 text-[var(--muted)]">
          A temporary problem prevented this page from loading. No technical or database details are
          shown here.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-xl border border-[var(--primary)] px-5 font-semibold text-[var(--primary)] hover:bg-[var(--muted-surface)]"
          >
            Return to storefront
          </Link>
        </div>
      </div>
    </Card>
  );
}
