import { Container } from "@/components/shared/container";
import { ProductGrid } from "@/components/product/product-grid";
import { products } from "@/data/products";
import { SectionIntro } from "./section-intro";
export function RecommendedPlants() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <Container>
        <SectionIntro
          title="Recommended For You"
          description="সহজ যত্ন ও জনপ্রিয়তার ভিত্তিতে নির্বাচিত কিছু গাছ।"
        />
        <ProductGrid items={products.slice(0, 4)} />
      </Container>
    </section>
  );
}
