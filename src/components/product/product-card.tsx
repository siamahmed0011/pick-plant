"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Droplets, Eye, Heart, ShoppingBag, Sun, Package } from "lucide-react";
import type { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { ProductImage } from "./product-image";
import { ProductPrice } from "./product-price";
import { ProductQuickView } from "./product-quick-view";
import { useCart } from "@/providers/cart-provider";
import { useWishlist } from "@/providers/wishlist-provider";

export function ProductCard({ product }: { product: Product }) {
  const [quickView, setQuickView] = useState(false);
  const [addFeedback, setAddFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showAddedState, setShowAddedState] = useState(false);
  const addLockedRef = useRef(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addItem, items } = useCart();
  const { toggle, has } = useWishlist();
  const discount = product.salePrice
    ? Math.round((1 - product.salePrice / product.regularPrice) * 100)
    : 0;

  const isOutOfStock = product.stock <= 0;

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    },
    [],
  );

  const clearFeedbackTimer = () => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  };

  const handleAddToCart = () => {
    if (addLockedRef.current) return;

    addLockedRef.current = true;
    clearFeedbackTimer();
    const existingItem = items.find(
      (item) =>
        item.productId === product.id &&
        item.selectedSize === "Medium" &&
        item.selectedPot === "Nursery Pot",
    );

    try {
      addItem(product);
      setShowAddedState(true);
      setAddFeedback({
        type: "success",
        message: existingItem
          ? `Quantity increased for ${product.name}.`
          : `${product.name} added to cart.`,
      });
      feedbackTimerRef.current = setTimeout(() => {
        addLockedRef.current = false;
        setShowAddedState(false);
        setAddFeedback(null);
        feedbackTimerRef.current = null;
      }, 1500);
    } catch {
      addLockedRef.current = false;
      setShowAddedState(false);
      setAddFeedback({
        type: "error",
        message: "Could not add this item. Please try again.",
      });
      feedbackTimerRef.current = setTimeout(() => {
        setAddFeedback(null);
        feedbackTimerRef.current = null;
      }, 3000);
    }
  };

  return (
    <>
      <article className="group surface flex h-full min-w-0 flex-col overflow-hidden p-3 transition duration-200 hover:-translate-y-1">
        {/* Image + Badges */}
        <div className="relative shrink-0">
          <ProductImage src={product.image} alt={`${product.bengaliName ?? product.name} plant`} />
          <button
            type="button"
            aria-label={`${has(product.id) ? "Remove" : "Add"} ${product.name} from wishlist`}
            aria-pressed={has(product.id)}
            onClick={() => toggle(product)}
            className="icon-button absolute right-3 top-3 size-10 shadow-sm"
          >
            <Heart fill={has(product.id) ? "currentColor" : "none"} size={18} />
          </button>
          {discount > 0 && (
            <span
              aria-label={`${discount}% off`}
              className="absolute left-3 top-3 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-white"
            >
              -{discount}%
            </span>
          )}
          {isOutOfStock && (
            <span
              aria-label="Out of stock"
              className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm"
            >
              Out of Stock
            </span>
          )}
        </div>

        {/* Card body — flex-col so CTA sticks to bottom */}
        <div className="flex flex-1 flex-col p-2 pt-4">
          {/* Category + Difficulty badge */}
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="font-semibold text-[var(--primary)] uppercase tracking-wider text-[11px]">
              {product.category.name}
            </span>
            <span className="rounded-md bg-[var(--muted-surface)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-secondary)]">
              {product.difficulty} Care
            </span>
          </div>

          {/* Product name — 2 line clamp, min-h to keep cards aligned */}
          <Link
            className="mt-2 line-clamp-2 min-h-[3.25rem] text-base font-bold leading-snug hover:text-[var(--primary)] focus-visible:underline"
            href={`/plants/${product.slug}`}
          >
            {product.name}
          </Link>

          {/* Bengali name — min-h so absent values don't collapse card */}
          <p
            className="line-clamp-1 min-h-[1.4rem] text-sm text-[var(--muted)] font-bengali-system"
            lang="bn"
          >
            {product.bengaliName || ""}
          </p>

          {/* Price */}
          <div className="mt-3 shrink-0">
            <ProductPrice regularPrice={product.regularPrice} salePrice={product.salePrice} />
          </div>

          {/* Care attributes — fixed height so long values don't push CTA */}
          <div className="mt-4 grid grid-cols-2 gap-2 border-y py-3 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1 truncate" title={product.lightRequirement}>
              <Sun size={13} className="shrink-0 text-amber-500" aria-hidden="true" />
              <span className="truncate">{product.lightRequirement}</span>
            </span>
            <span className="flex items-center gap-1 truncate" title={product.wateringFrequency}>
              <Droplets size={13} className="shrink-0 text-blue-500" aria-hidden="true" />
              <span className="truncate">{product.wateringFrequency}</span>
            </span>
            <span className="flex items-center gap-1 truncate">
              <Package size={13} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{product.difficulty} care</span>
            </span>
            <span
              className={`flex items-center gap-1 font-semibold ${
                isOutOfStock ? "text-[var(--danger)]" : "text-[var(--primary)]"
              }`}
              aria-label={isOutOfStock ? "Out of stock" : "In stock"}
            >
              <span
                aria-hidden="true"
                className={`inline-block size-2 shrink-0 rounded-full ${
                  isOutOfStock ? "bg-[var(--danger)]" : "bg-[var(--primary)]"
                }`}
              />
              {isOutOfStock ? "Out of stock" : "In stock"}
            </span>
          </div>

          {/* CTA — always at the bottom of the card */}
          <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-4">
            <Button
              onClick={handleAddToCart}
              className="w-full min-h-[44px]"
              size="sm"
              disabled={showAddedState || isOutOfStock}
              aria-label={
                isOutOfStock
                  ? `${product.name} is out of stock`
                  : showAddedState
                  ? `${product.name} added to cart`
                  : `Add ${product.name} to cart`
              }
            >
              <ShoppingBag size={15} className="shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">
                {isOutOfStock ? "Out of Stock" : showAddedState ? "Added ✓" : "Add to Cart"}
              </span>
            </Button>
            <button
              type="button"
              onClick={() => setQuickView(true)}
              aria-label={`Quick view ${product.name}`}
              className="icon-button min-h-[44px] w-[44px] rounded-xl"
            >
              <Eye size={17} aria-hidden="true" />
            </button>
          </div>

          {/* Feedback message */}
          <p
            aria-live="polite"
            aria-atomic="true"
            role="status"
            className={`min-h-5 pt-2 text-xs font-medium ${
              addFeedback?.type === "error"
                ? "text-[var(--danger)]"
                : "text-[var(--primary)]"
            }`}
          >
            {addFeedback?.message ?? ""}
          </p>
        </div>
      </article>
      <ProductQuickView product={product} open={quickView} onClose={() => setQuickView(false)} />
    </>
  );
}
