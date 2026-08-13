"use client";
import { useState } from "react";
import { Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/providers/cart-provider";
import type { Product } from "@/types";

export function ProductActions({
  product,
  quantity = 1,
}: {
  product?: Product;
  quantity?: number;
}) {
  const [message, setMessage] = useState("");
  const [wished, setWished] = useState(false);
  const { addItem } = useCart();

  const share = async () => {
    if (navigator.share) await navigator.share({ title: document.title, url: location.href });
    else await navigator.clipboard.writeText(location.href);
    setMessage("Link ready to share");
  };

  const handleAddToCart = () => {
    if (product) {
      if (product.stock <= 0) {
        setMessage("This item is currently out of stock.");
        return;
      }
      addItem(product, quantity);
      setMessage(`${product.name} added to cart.`);
    } else {
      setMessage("Added to cart for this preview");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleAddToCart}
          disabled={Boolean(product && product.stock <= 0)}
        >
          {product && product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
        <Button variant="secondary">Buy Now</Button>
        <Button variant="outline" aria-pressed={wished} onClick={() => setWished((v) => !v)}>
          <Heart size={17} fill={wished ? "currentColor" : "none"} />
          Wishlist
        </Button>
        <Button variant="ghost" onClick={share}>
          <Share2 size={17} />
          Share
        </Button>
      </div>
      {message && (
        <p className="mt-3 text-sm font-semibold text-[var(--primary)]" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
