"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers3 } from "lucide-react";
import { bulkAdjustStockAction } from "@/app/admin/inventory/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { inventoryReasonOptions } from "@/lib/admin/inventory-validation";
import { initialInventoryActionState, type BulkInventoryMode, type InventoryListItem } from "@/types/admin-inventory";

export function BulkStockDialog({
  selected,
  onClear,
}: {
  selected: InventoryListItem[];
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<BulkInventoryMode>("INCREASE");
  const [quantity, setQuantity] = useState("1");
  const [exactValues, setExactValues] = useState<Record<string, string>>({});
  const [state, formAction, pending] = useActionState(bulkAdjustStockAction, initialInventoryActionState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
      onClear();
    }
  }, [onClear, router, state.status]);

  const entries = selected.map((product) => ({
    productId: product.id,
    expectedStock: product.stockQuantity,
    ...(mode === "SET_EXACT" && /^\d+$/.test(exactValues[product.id] ?? "")
      ? { value: Number(exactValues[product.id]) }
      : {}),
  }));
  const parsedQuantity = /^\d+$/.test(quantity) ? Number(quantity) : 0;
  const totalDifference = useMemo(() => {
    if (mode === "INCREASE") return selected.length * parsedQuantity;
    if (mode === "DECREASE") return -selected.length * parsedQuantity;
    if (mode === "SET_EXACT") {
      return selected.reduce((total, product) => total + (Number(exactValues[product.id]) - product.stockQuantity), 0);
    }
    return 0;
  }, [exactValues, mode, parsedQuantity, selected]);

  return (
    <>
      <Button type="button" disabled={!selected.length} onClick={() => { setExactValues(Object.fromEntries(selected.map((product) => [product.id, String(product.stockQuantity)]))); setOpen(true); }}>
        <Layers3 size={17} aria-hidden="true" /> Bulk update ({selected.length})
      </Button>
      <Modal open={open && state.status !== "success"} title="Bulk inventory update" onClose={() => setOpen(false)}>
        <form
          action={formAction}
          className="grid gap-4"
          onSubmit={(event) => {
            if (!window.confirm(`Apply this inventory update to ${selected.length} products?`)) event.preventDefault();
          }}
        >
          <input type="hidden" name="entries" value={JSON.stringify(entries)} />
          <p className="rounded-xl bg-[var(--muted-surface)] p-4 text-sm">
            <strong>{selected.length} products selected.</strong>{mode !== "SET_THRESHOLD" && <> Net stock change: <strong>{totalDifference > 0 ? "+" : ""}{totalDifference}</strong>.</>}
          </p>
          <label className="grid gap-2 text-sm font-semibold">
            Operation
            <Select name="mode" value={mode} onChange={(event) => setMode(event.target.value as BulkInventoryMode)}>
              <option value="INCREASE">Increase all</option>
              <option value="DECREASE">Decrease all</option>
              <option value="SET_EXACT">Set exact individually</option>
              <option value="SET_THRESHOLD">Set low-stock threshold</option>
            </Select>
          </label>
          {mode === "SET_EXACT" ? (
            <div className="max-h-64 overflow-y-auto rounded-xl border" aria-label="Exact stock values">
              {selected.map((product) => (
                <label className="grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-3 border-b p-3 text-sm last:border-0" key={product.id}>
                  <span><strong className="block truncate">{product.name}</strong><span className="text-[var(--muted)]">Current: {product.stockQuantity}</span></span>
                  <Input type="number" min="0" step="1" inputMode="numeric" aria-label={`Exact stock for ${product.name}`} value={exactValues[product.id] ?? ""} onChange={(event) => setExactValues((current) => ({ ...current, [product.id]: event.target.value }))} />
                </label>
              ))}
            </div>
          ) : (
            <label className="grid gap-2 text-sm font-semibold">
              {mode === "SET_THRESHOLD" ? "New threshold" : "Quantity per product"}
              <Input name="quantity" type="number" min="0" step="1" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} aria-invalid={Boolean(state.fieldErrors?.quantity)} />
            </label>
          )}
          {mode === "SET_EXACT" && <input type="hidden" name="quantity" value="0" />}
          {state.fieldErrors?.entries?.[0] && <p className="text-sm text-[var(--danger)]" role="alert">{state.fieldErrors.entries[0]}</p>}
          {state.fieldErrors?.quantity?.[0] && <p className="text-sm text-[var(--danger)]" role="alert">{state.fieldErrors.quantity[0]}</p>}
          {mode !== "SET_THRESHOLD" ? (
            <>
              <label className="grid gap-2 text-sm font-semibold">
                Reason
                <Select name="reason" defaultValue="" required>
                  <option value="" disabled>Select a reason</option>
                  {inventoryReasonOptions.map((reason) => <option value={reason.value} key={reason.value}>{reason.label}</option>)}
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">Shared note <span className="font-normal text-[var(--muted)]">(required for Other)</span><Textarea name="note" maxLength={500} className="min-h-20" /></label>
              <label className="grid gap-2 text-sm font-semibold">Reference <span className="font-normal text-[var(--muted)]">(optional)</span><Input name="reference" maxLength={160} /></label>
            </>
          ) : (
            <><input type="hidden" name="reason" value="" /><input type="hidden" name="note" value="" /><input type="hidden" name="reference" value="" /></>
          )}
          {(state.fieldErrors?.reason?.[0] || state.fieldErrors?.note?.[0]) && <p className="text-sm text-[var(--danger)]" role="alert">{state.fieldErrors.reason?.[0] ?? state.fieldErrors.note?.[0]}</p>}
          {state.message && <p className={`rounded-xl p-3 text-sm ${state.status === "success" ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-[var(--danger)]"}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending || !selected.length}>{pending ? "Processing bulk update..." : "Confirm bulk update"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
