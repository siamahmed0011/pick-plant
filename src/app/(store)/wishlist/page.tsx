"use client";

import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { useWishlist } from "@/providers/wishlist-provider";
import { Container } from "@/components/shared/container";
import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const { items, clear } = useWishlist();

  return (
    <main className="py-6 sm:py-8 lg:py-10 bg-[#F7F8F5] min-h-[calc(100vh-14rem)]">
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#1E5A3A]">
              WISHLIST
            </p>
            <h1 className="mt-1 text-[26px] sm:text-[30px] lg:text-[40px] font-bold tracking-tight text-[#1F2D22]">
              Your wishlist
            </h1>
            <p className="mt-1 text-sm sm:text-base text-[#66746A] font-bengali-system">
              পছন্দের গাছ ও গার্ডেনিং পণ্যগুলো এখানে সংরক্ষিত থাকবে।
            </p>
          </div>

          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clear}
              className="h-9 px-3.5 text-xs font-semibold rounded-[14px] border-[#DDE7DD] bg-[#FFFFFF] text-red-600 hover:bg-red-50 transition self-start sm:self-auto"
            >
              <Trash2 size={14} className="mr-1.5" /> Clear wishlist
            </Button>
          )}
        </div>

        {items.length > 0 ? (
          <ProductGrid items={items} />
        ) : (
          <div className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-6 sm:p-8 text-center shadow-[0_4px_16px_rgba(0,0,0,0.04)] max-w-md mx-auto my-6 sm:my-8">
            <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#EEF5F0] text-[#1E5A3A] border border-[#DDE7DD] mb-3">
              <Heart size={22} />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F2D22]">Your wishlist is empty</h2>
            <p className="mt-1.5 text-xs text-[#66746A] leading-relaxed">
              Save plants you like and find them here later. Click the heart icon on any plant card to save it.
            </p>
            <div className="mt-4">
              <Link
                href="/plants"
                className="inline-flex h-10 items-center justify-center rounded-[14px] bg-[#1E5A3A] px-5 text-xs font-semibold text-white transition hover:bg-[#17482F] shadow-xs"
              >
                Browse plants
              </Link>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
