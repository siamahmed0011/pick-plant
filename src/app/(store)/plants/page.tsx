import type { Metadata } from "next";
import { ProductCatalogue } from "@/components/product/product-catalogue";
import { getStorefrontProducts } from "@/lib/storefront/products";

export const metadata: Metadata = {
  title: "Buy Plants Online",
  description: "Shop a wide range of indoor plants, outdoor plants, succulents, fruit plants, and gardening accessories. Fast delivery across Bangladesh.",
  alternates: {
    canonical: "/plants",
  },
};


export default async function PlantsPage() {
  const products = await getStorefrontProducts();
  return <ProductCatalogue products={products} />;
}
