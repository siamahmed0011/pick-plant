"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
export function ProductMobileActions({ price, name }: { price: number; name: string }) {
  const [wished, setWished] = useState(false);
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t bg-white p-3 lg:hidden">
      <strong className="mr-auto text-[var(--primary)]">{formatCurrency(price)}</strong>
      <button
        type="button"
        aria-label={`Add ${name} to wishlist`}
        aria-pressed={wished}
        onClick={() => setWished((v) => !v)}
        className="grid size-11 place-items-center rounded-xl border"
      >
        <Heart fill={wished ? "currentColor" : "none"} />
      </button>
      <Button>Add to Cart</Button>
    </div>
  );
}
