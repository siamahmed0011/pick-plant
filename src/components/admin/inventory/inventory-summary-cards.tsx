import { Activity, Boxes, PackageCheck, PackageX, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/formatters";

export function InventorySummaryCards({
  summary,
}: {
  summary: {
    totalProducts: number;
    totalUnits: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    movementsToday: number;
  };
}) {
  const cards = [
    { label: "Total products", value: summary.totalProducts, Icon: Boxes },
    { label: "Units in stock", value: summary.totalUnits, Icon: PackageCheck },
    { label: "Low-stock products", value: summary.lowStockProducts, Icon: TriangleAlert },
    { label: "Out-of-stock products", value: summary.outOfStockProducts, Icon: PackageX },
    { label: "Movements today", value: summary.movementsToday, Icon: Activity },
  ];
  return (
    <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Inventory summary">
      {cards.map(({ label, value, Icon }) => (
        <Card className="p-5" key={label}>
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--muted-surface)] text-[var(--primary)]">
            <Icon size={19} aria-hidden="true" />
          </span>
          <p className="mt-4 text-2xl font-bold">{formatNumber(value)}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{label}</p>
        </Card>
      ))}
    </section>
  );
}
