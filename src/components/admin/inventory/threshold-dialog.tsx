"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Gauge } from "lucide-react";
import { updateLowStockThresholdAction } from "@/app/admin/inventory/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { initialInventoryActionState } from "@/types/admin-inventory";

export function ThresholdDialog({
  product,
}: {
  product: { id: string; name: string; lowStockThreshold: number | null };
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateLowStockThresholdAction, initialInventoryActionState);
  const router = useRouter();
  const id = useId();
  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state.status]);

  return (
    <>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Gauge size={15} aria-hidden="true" /> Threshold
      </Button>
      <Modal open={open} title={`Low-stock threshold — ${product.name}`} onClose={() => setOpen(false)}>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="expectedThreshold" value={product.lowStockThreshold ?? ""} />
          <label className="grid gap-2 text-sm font-semibold" htmlFor={`${id}-threshold`}>
            Alert when stock is at or below
            <Input id={`${id}-threshold`} name="threshold" type="number" min="0" step="1" inputMode="numeric" defaultValue={product.lowStockThreshold ?? 0} aria-invalid={Boolean(state.fieldErrors?.threshold)} />
          </label>
          {state.fieldErrors?.threshold?.[0] && <p className="text-sm text-[var(--danger)]" role="alert">{state.fieldErrors.threshold[0]}</p>}
          {state.message && <p className={`rounded-xl p-3 text-sm ${state.status === "success" ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-[var(--danger)]"}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save threshold"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
