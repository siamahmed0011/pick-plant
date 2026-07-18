"use client";
import { useWishlist } from "@/providers/wishlist-provider";
import { Container } from "@/components/shared/container";
import { ProductGrid } from "@/components/product/product-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
export default function WishlistPage() {
  const { items, clear } = useWishlist();
  return (
    <main className="py-10">
      <Container>
        <header>
          <h1 className="text-4xl font-bold">My Wishlist</h1>
          <p className="mt-3 text-[var(--muted)]">পছন্দের গাছ ও পণ্যগুলো এখানে সংরক্ষিত থাকবে।</p>
        </header>
        <div className="mt-8">
          {items.length ? (
            <>
              <div className="mb-5 flex justify-end">
                <Button variant="outline" onClick={clear}>
                  Clear Wishlist
                </Button>
              </div>
              <ProductGrid items={items} />
            </>
          ) : (
            <EmptyState
              title="Your wishlist is empty"
              description="পছন্দের গাছ সংরক্ষণ করতে heart icon ব্যবহার করুন।"
            />
          )}
        </div>
      </Container>
    </main>
  );
}
