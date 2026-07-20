import { Badge } from "@/components/ui/badge";

export function StockStatusBadge({ stock, threshold }: { stock: number; threshold: number | null }) {
  const status = stock === 0 ? "OUT_OF_STOCK" : threshold !== null && stock <= threshold ? "LOW_STOCK" : "IN_STOCK";
  const label =
    status === "OUT_OF_STOCK" ? "Out of Stock" : status === "LOW_STOCK" ? "Low Stock" : "In Stock";
  const className =
    status === "OUT_OF_STOCK"
      ? "bg-red-100 text-red-800"
      : status === "LOW_STOCK"
        ? "bg-amber-100 text-amber-900"
        : "bg-emerald-100 text-emerald-800";
  return <Badge className={className}>{label}</Badge>;
}
