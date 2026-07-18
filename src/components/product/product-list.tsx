import type { Product } from "@/types";
import { ProductImage } from "./product-image";
import { ProductPrice } from "./product-price";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export function ProductList({ items }: { items: Product[] }) {
  return (
    <div className="grid gap-4">
      {items.map((product) => (
        <article
          className="surface grid gap-5 p-4 sm:grid-cols-[10rem_1fr_auto] sm:items-center"
          key={product.id}
        >
          <ProductImage src={product.image} alt={`${product.bengaliName} plant`} />
          <div>
            <Link
              href={`/plants/${product.slug}`}
              className="text-lg font-bold hover:text-[var(--primary)]"
            >
              {product.name}
            </Link>
            <p className="text-sm text-[var(--muted)]">{product.bengaliName}</p>
            <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">
              {product.shortDescription}
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--primary)]">
              {product.stock > 0 ? "In stock" : "Out of stock"}
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 sm:block">
            <ProductPrice regularPrice={product.regularPrice} salePrice={product.salePrice} />
            <Button size="sm" className="mt-3">
              Add to Cart
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
