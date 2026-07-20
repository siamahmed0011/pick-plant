import Link from "next/link";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import type { InventoryMovementItem } from "@/types/admin-inventory";

const dateTime = new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" });

function movementLabel(value: string) {
  return value.split("_").map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(" ");
}

export function InventoryHistoryTable({ movements, compact = false }: { movements: InventoryMovementItem[]; compact?: boolean }) {
  if (!movements.length) {
    return <Card className="mt-6 grid min-h-48 place-items-center p-6 text-center"><div><History className="mx-auto text-[var(--muted)]" aria-hidden="true" /><h2 className="mt-3 text-lg font-bold">No inventory movements found</h2><p className="mt-1 text-sm text-[var(--muted)]">Stock changes will appear here after an adjustment.</p></div></Card>;
  }
  return (
    <div className="surface mt-6 overflow-hidden">
      <Table className={`text-sm ${compact ? "min-w-[900px]" : "min-w-[1380px]"}`}>
        <caption className="sr-only">Read-only inventory movement history</caption>
        <thead className="bg-[var(--muted-surface)] text-[var(--primary)]"><tr><th className="px-3 py-3">Date</th>{!compact && <th className="px-3 py-3">Product</th>}<th className="px-3 py-3">Type</th><th className="px-3 py-3">Change</th><th className="px-3 py-3">Previous</th><th className="px-3 py-3">New</th><th className="px-3 py-3">Reason</th><th className="px-3 py-3">Note</th><th className="px-3 py-3">Performed by</th>{!compact && <th className="px-3 py-3">Reference</th>}</tr></thead>
        <tbody className="divide-y">
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td className="whitespace-nowrap px-3 py-3 text-[var(--muted)]">{dateTime.format(new Date(movement.createdAt))}</td>
              {!compact && <td className="px-3 py-3"><span className="block font-bold">{movement.productId ? <Link href={`/admin/inventory/${movement.productId}`} className="hover:underline">{movement.productName}</Link> : movement.productName}</span><span className="text-xs text-[var(--muted)]">SKU {movement.productSku}{!movement.productId && " · Deleted product"}</span></td>}
              <td className="px-3 py-3"><Badge>{movementLabel(movement.type)}</Badge></td>
              <td className={`px-3 py-3 text-base font-bold ${movement.quantity > 0 ? "text-emerald-700" : "text-red-700"}`}>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</td>
              <td className="px-3 py-3">{movement.previousStock}</td><td className="px-3 py-3 font-bold">{movement.newStock}</td>
              <td className="px-3 py-3">{movement.reason}</td><td className="max-w-64 px-3 py-3 text-[var(--muted)]">{movement.note ?? "—"}</td>
              <td className="px-3 py-3"><span className="block">{movement.performedByName ?? "Admin"}</span><span className="text-xs text-[var(--muted)]">{movement.performedByEmail ?? "Actor unavailable"}</span></td>
              {!compact && <td className="px-3 py-3 text-[var(--muted)]">{movement.reference ?? "—"}</td>}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
