import { formatCurrency } from "@/lib/formatters";
export function ProductPrice({
  regularPrice,
  salePrice,
}: {
  regularPrice: number;
  salePrice?: number;
}) {
  return (
    <div className="flex items-center gap-2 font-bold text-[var(--primary)]">
      <span>{formatCurrency(salePrice ?? regularPrice)}</span>
      {salePrice && (
        <del className="text-sm font-normal text-[var(--muted)]">
          {formatCurrency(regularPrice)}
        </del>
      )}
    </div>
  );
}
