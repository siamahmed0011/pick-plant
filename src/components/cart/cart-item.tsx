import type { Product } from "@/types";
import { ProductPrice } from "@/components/product/product-price";
export function CartItem({ product }: { product: Product }) {
  return (
    <article className="surface flex items-center justify-between gap-4 p-4">
      <div>
        <h3 className="font-bold">{product.name}</h3>
        <p className="text-sm text-[var(--muted)]">{product.bengaliName}</p>
      </div>
      <ProductPrice regularPrice={product.regularPrice} salePrice={product.salePrice} />
    </article>
  );
}
