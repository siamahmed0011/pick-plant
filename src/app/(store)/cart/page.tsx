"use client";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCart } from "@/providers/cart-provider";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCart();
  if (!items.length)
    return (
      <main className="py-14">
        <Container>
          <EmptyState
            title="Your cart is empty"
            description="আপনার পছন্দের গাছ যোগ করলে এখানে দেখা যাবে।"
          />
          <Link
            className="mt-6 inline-flex rounded-xl bg-[var(--primary)] px-5 py-3 font-semibold text-white"
            href="/plants"
          >
            Continue Shopping
          </Link>
        </Container>
      </main>
    );
  return (
    <main className="py-10">
      <Container>
        <h1 className="text-4xl font-bold">Shopping Cart</h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <section className="grid gap-4">
            {items.map((item) => (
              <article
                className="surface grid gap-4 p-4 sm:grid-cols-[7rem_1fr_auto] sm:items-center"
                key={item.id}
              >
                <ProductImage src={item.image} alt={item.bengaliName} />
                <div>
                  <h2 className="font-bold">{item.name}</h2>
                  <p className="text-sm text-[var(--muted)]">
                    {item.bengaliName} · {item.selectedSize} · {item.selectedPot}
                  </p>
                  <p className="mt-2 font-semibold text-[var(--primary)]">
                    {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    aria-label={`Quantity for ${item.name}`}
                    className="w-16 rounded-lg border p-2"
                    type="number"
                    min="1"
                    max={item.stock}
                    value={item.quantity}
                    onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            ))}
          </section>
          <aside className="surface h-fit p-5">
            <h2 className="text-xl font-bold">Order Summary</h2>
            <p className="mt-5 flex justify-between">
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </p>
            <p className="mt-2 flex justify-between text-sm text-[var(--muted)]">
              <span>Delivery</span>
              <span>Calculated later</span>
            </p>
            <Button className="mt-6 w-full">
              <Link href="/checkout">Checkout</Link>
            </Button>
            <button
              type="button"
              onClick={clearCart}
              className="mt-4 w-full text-sm text-[var(--muted)] hover:underline"
            >
              Clear Cart
            </button>
          </aside>
        </div>
      </Container>
    </main>
  );
}
