import { Container } from "@/components/shared/container";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionIntro } from "./section-intro";
import type { Product } from "@/types";

export function SeasonalPlants({ items = [] }: { items?: Product[] }) {
  if (items.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <SectionIntro
          title="Seasonal Collection"
          description="এই মৌসুমে রোপণ ও যত্নের জন্য উপযুক্ত গাছের সংগ্রহ।"
        />
        <ProductGrid items={items.slice(0, 4)} />
      </Container>
    </section>
  );
}
