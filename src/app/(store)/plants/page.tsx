import { ProductCatalogue } from "@/components/product/product-catalogue";
import { getStorefrontProducts } from "@/lib/storefront/products";

export default async function PlantsPage() {
  const products = await getStorefrontProducts();
  return <ProductCatalogue products={products} />;
}
