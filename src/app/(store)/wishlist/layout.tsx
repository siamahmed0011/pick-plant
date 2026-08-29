import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "View your saved plants and gardening items on your Pick Plant wishlist.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
