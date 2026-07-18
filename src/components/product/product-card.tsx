"use client";
import Link from "next/link";
import { useState } from "react";
import { Droplets, Eye, Heart, ShoppingBag, Star, Sun } from "lucide-react";
import type { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { ProductImage } from "./product-image";
import { ProductPrice } from "./product-price";
import { ProductQuickView } from "./product-quick-view";
import { useCart } from "@/providers/cart-provider";
import { useWishlist } from "@/providers/wishlist-provider";
export function ProductCard({ product }: { product: Product }) {
  const [quickView, setQuickView] = useState(false);
  const { addItem } = useCart();
  const { toggle, has } = useWishlist();
  const discount = product.salePrice
    ? Math.round((1 - product.salePrice / product.regularPrice) * 100)
    : 0;
  return (
    <>
      <article className="group surface flex h-full min-w-0 flex-col overflow-hidden p-3 transition duration-200 hover:-translate-y-1">
        <div className="relative">
          <ProductImage src={product.image} alt={`${product.bengaliName} plant`} />
          <button
            type="button"
            aria-label={`Add ${product.name} to wishlist`}
            aria-pressed={has(product.id)}
            onClick={() => toggle(product)}
            className="icon-button absolute right-3 top-3 size-10 shadow-sm"
          >
            <Heart fill={has(product.id) ? "currentColor" : "none"} size={18} />
          </button>
          {discount > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-white">
              -{discount}%
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-2 pt-4">
          <div className="flex items-center gap-1 text-sm text-amber-600">
            <Star size={15} fill="currentColor" />
            <span className="font-semibold">4.8</span>
            <span className="text-[var(--muted)]">(24)</span>
          </div>
          <Link
            className="mt-2 line-clamp-1 text-lg font-bold hover:text-[var(--primary)]"
            href={`/plants/${product.slug}`}
          >
            {product.name}
          </Link>
          <p className="line-clamp-1 text-sm text-[var(--muted)]">{product.bengaliName}</p>
          <div className="mt-3">
            <ProductPrice regularPrice={product.regularPrice} salePrice={product.salePrice} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-y py-3 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1">
              <Sun size={14} />
              {product.lightRequirement}
            </span>
            <span className="flex items-center gap-1">
              <Droplets size={14} />
              {product.wateringFrequency}
            </span>
            <span>{product.difficulty} care</span>
            <span className="font-semibold text-[var(--primary)]">
              {product.stock > 0 ? "In stock" : "Out of stock"}
            </span>
          </div>
          <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-4">
            <Button onClick={() => addItem(product)} className="w-full" size="sm">
              <ShoppingBag size={16} />
              Add to Cart
            </Button>
            <button
              type="button"
              onClick={() => setQuickView(true)}
              aria-label={`Quick view ${product.name}`}
              className="icon-button size-9 rounded-xl"
            >
              <Eye size={17} />
            </button>
          </div>
        </div>
      </article>
      <ProductQuickView product={product} open={quickView} onClose={() => setQuickView(false)} />
    </>
  );
}
