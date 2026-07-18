import type { Product } from "@/types";
import { ProductCard } from "./product-card";
export function ProductGrid({ items }: { items: Product[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <ProductCard product={item} key={item.id} />
      ))}
    </div>
  );
}
