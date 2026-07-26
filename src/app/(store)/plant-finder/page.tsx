import type { Metadata } from "next";
import { getStorefrontProducts } from "@/lib/storefront/products";
import { PlantFinderView } from "@/components/plant-finder/plant-finder-view";

export const metadata: Metadata = {
  title: "Plant Finder | Interactive Plant Matcher | Pick Plant",
  description: "Find the best indoor or outdoor plants tailored to your environment, light levels, watering schedule, and care experience.",
};

export default async function PlantFinderPage() {
  const products = await getStorefrontProducts();
  return <PlantFinderView products={products} />;
}
