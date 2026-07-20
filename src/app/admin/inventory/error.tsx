"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InventoryError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="surface grid min-h-72 place-items-center p-8 text-center"><div><AlertTriangle className="mx-auto text-amber-700" size={30} aria-hidden="true" /><h1 className="mt-4 text-2xl font-bold">Inventory is temporarily unavailable</h1><p className="mt-2 text-[var(--muted)]">The inventory data could not be loaded. Try again shortly.</p><Button type="button" className="mt-5" onClick={reset}>Try again</Button></div></div>;
}
