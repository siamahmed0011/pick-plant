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
export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturedCategories />
      <RecommendedPlants />
      <ComboOffers />
      <PlantFinderBanner />
      <PopularPlants />
      <SeasonalPlants />
      <AccessoriesSection />
      <BenefitsSection />
      <ServicesSection />
      <CareGuidesSection />
      <TestimonialsSection />
      <NewsletterSection />
    </main>
  );
}
