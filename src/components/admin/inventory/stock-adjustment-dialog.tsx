"use client";

import { useActionState, useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import { adjustStockAction } from "@/app/admin/inventory/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { inventoryReasonOptions } from "@/lib/admin/inventory-validation";
import { initialInventoryActionState, type StockAdjustmentMode } from "@/types/admin-inventory";

export function StockAdjustmentDialog({
  product,
  label = "Adjust stock",
}: {
  product: { id: string; name: string; stockQuantity: number; lowStockThreshold: number | null };
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<StockAdjustmentMode>("INCREASE");
  const [quantity, setQuantity] = useState("1");
  const [state, formAction, pending] = useActionState(adjustStockAction, initialInventoryActionState);
  const router = useRouter();
  const id = useId();
  const preview = useMemo(() => {
    const value = /^\d+$/.test(quantity) ? Number(quantity) : 0;
    return mode === "INCREASE"
      ? product.stockQuantity + value
      : mode === "DECREASE"
        ? product.stockQuantity - value
        : value;
  }, [mode, product.stockQuantity, quantity]);
  const previewStatus =
    preview < 0
      ? "Stock cannot be below zero."
      : preview === 0
        ? "This product will be out of stock."
        : product.lowStockThreshold !== null && preview <= product.lowStockThreshold
          ? "This product will be low stock."
          : null;

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state.status]);

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <ArrowLeftRight size={15} aria-hidden="true" /> {label}
      </Button>
      <Modal open={open} title={`Adjust stock — ${product.name}`} onClose={() => setOpen(false)}>
        <form
          action={formAction}
          className="grid gap-4"
          onSubmit={(event) => {
            if (mode === "DECREASE" && !window.confirm(`Reduce ${product.name} stock to ${preview}?`)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="expectedStock" value={product.stockQuantity} />
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-[var(--muted-surface)] p-4 text-sm">
            <div><span className="block text-[var(--muted)]">Current stock</span><strong className="text-xl">{product.stockQuantity}</strong></div>
            <div><span className="block text-[var(--muted)]">Calculated stock</span><strong className="text-xl">{preview}</strong></div>
          </div>
          {previewStatus && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="status">{previewStatus}</p>}
          <label className="grid gap-2 text-sm font-semibold" htmlFor={`${id}-mode`}>
            Adjustment mode
            <Select id={`${id}-mode`} name="mode" value={mode} onChange={(event) => setMode(event.target.value as StockAdjustmentMode)}>
              <option value="INCREASE">Increase stock</option>
              <option value="DECREASE">Decrease stock</option>
              <option value="SET_EXACT">Set exact stock</option>
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-semibold" htmlFor={`${id}-quantity`}>
            {mode === "SET_EXACT" ? "Exact stock value" : "Quantity"}
            <Input id={`${id}-quantity`} name="quantity" type="number" min="0" step="1" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} aria-invalid={Boolean(state.fieldErrors?.quantity)} aria-describedby={state.fieldErrors?.quantity ? `${id}-quantity-error` : undefined} />
          </label>
          {state.fieldErrors?.quantity?.[0] && <p id={`${id}-quantity-error`} className="text-sm text-[var(--danger)]" role="alert">{state.fieldErrors.quantity[0]}</p>}
          <label className="grid gap-2 text-sm font-semibold" htmlFor={`${id}-reason`}>
            Reason
            <Select id={`${id}-reason`} name="reason" defaultValue="" required aria-invalid={Boolean(state.fieldErrors?.reason)}>
              <option value="" disabled>Select a reason</option>
              {inventoryReasonOptions.map((reason) => <option value={reason.value} key={reason.value}>{reason.label}</option>)}
            </Select>
          </label>
          {state.fieldErrors?.reason?.[0] && <p className="text-sm text-[var(--danger)]" role="alert">{state.fieldErrors.reason[0]}</p>}
          <label className="grid gap-2 text-sm font-semibold" htmlFor={`${id}-note`}>
            Note <span className="font-normal text-[var(--muted)]">(required for Other)</span>
            <Textarea id={`${id}-note`} name="note" maxLength={500} className="min-h-24" aria-invalid={Boolean(state.fieldErrors?.note)} />
          </label>
          {state.fieldErrors?.note?.[0] && <p className="text-sm text-[var(--danger)]" role="alert">{state.fieldErrors.note[0]}</p>}
          <label className="grid gap-2 text-sm font-semibold" htmlFor={`${id}-reference`}>
            Reference <span className="font-normal text-[var(--muted)]">(optional)</span>
            <Input id={`${id}-reference`} name="reference" maxLength={160} placeholder="Purchase order or ticket" />
          </label>
          {state.message && (
            <p className={`rounded-xl p-3 text-sm ${state.status === "success" ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-[var(--danger)]"}`} role={state.status === "error" ? "alert" : "status"} aria-live="polite">
              {state.message}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending || preview < 0}>{pending ? "Adjusting..." : "Confirm adjustment"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
