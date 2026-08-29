import type { Metadata } from "next";
import { auth } from "@/auth";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedCategories } from "@/components/home/featured-categories";
import { RecommendedPlants } from "@/components/home/recommended-plants";
import { ComboOffers } from "@/components/home/combo-offers";
import { PlantFinderBanner } from "@/components/home/plant-finder-banner";
import { PopularPlants } from "@/components/home/popular-plants";
import { SeasonalPlants } from "@/components/home/seasonal-plants";
import { AccessoriesSection } from "@/components/home/accessories-section";
import { BenefitsSection } from "@/components/home/benefits-section";
import { ServicesSection } from "@/components/home/services-section";
import { CareGuidesSection } from "@/components/home/care-guides-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { getStorefrontProducts } from "@/lib/storefront/products";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};


export default async function HomePage() {
  const [session, products] = await Promise.all([
    auth(),
    getStorefrontProducts(),
  ]);

  const recommended = products.filter((p) => p.featured).slice(0, 4);
  const popular = products.slice(0, 4);
  const seasonal = products.slice(4, 8);

  return (
    <main>
      <HeroSection user={session?.user ?? null} />
      <FeaturedCategories />
      <RecommendedPlants items={recommended.length > 0 ? recommended : products.slice(0, 4)} />
      <ComboOffers />
      <PlantFinderBanner />
      <PopularPlants items={popular.length > 0 ? popular : products.slice(0, 4)} />
      <SeasonalPlants items={seasonal.length > 0 ? seasonal : products.slice(4, 8)} />
      <AccessoriesSection />
      <BenefitsSection />
      <ServicesSection />
      <CareGuidesSection />
      <TestimonialsSection />
      <NewsletterSection />
    </main>
  );
}
