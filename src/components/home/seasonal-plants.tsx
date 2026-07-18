import { Container } from "@/components/shared/container";
import { ProductGrid } from "@/components/product/product-grid";
import { products } from "@/data/products";
import { SectionIntro } from "./section-intro";
export function SeasonalPlants() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <SectionIntro
          title="Seasonal Collection"
          description="এই মৌসুমে রোপণ ও যত্নের জন্য উপযুক্ত গাছের সংগ্রহ।"
        />
        <ProductGrid items={products.slice(4, 8)} />
      </Container>
    </section>
  );
}
