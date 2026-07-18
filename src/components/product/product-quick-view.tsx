"use client";
import Link from "next/link";
import type { Product } from "@/types";
import { Modal } from "@/components/ui/modal";
import { ProductImage } from "./product-image";
import { ProductPrice } from "./product-price";
import { QuantitySelector } from "./quantity-selector";
import { Button } from "@/components/ui/button";
export function ProductQuickView({
  product,
  open,
  onClose,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Quick View">
      <div className="grid gap-6 sm:grid-cols-2">
        <ProductImage src={product.image} alt={`${product.bengaliName} plant`} />
        <div>
          <h3 className="text-2xl font-bold">{product.name}</h3>
          <p className="text-[var(--muted)]">{product.bengaliName}</p>
          <div className="mt-4">
            <ProductPrice regularPrice={product.regularPrice} salePrice={product.salePrice} />
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{product.shortDescription}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[var(--muted)]">Light</dt>
              <dd className="font-semibold">{product.lightRequirement}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Water</dt>
              <dd className="font-semibold">{product.wateringFrequency}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Difficulty</dt>
              <dd className="font-semibold">{product.difficulty}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Stock</dt>
              <dd className="font-semibold">{product.stock} available</dd>
            </div>
          </dl>
          <div className="mt-5">
            <QuantitySelector stock={product.stock} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button size="sm">Add to Cart</Button>
            <Link
              onClick={onClose}
              href={`/plants/${product.slug}`}
              className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-semibold text-[var(--primary)]"
            >
              View Full Details
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
