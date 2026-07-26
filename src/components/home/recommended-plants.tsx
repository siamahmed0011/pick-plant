import { Container } from "@/components/shared/container";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionIntro } from "./section-intro";
import type { Product } from "@/types";

export function RecommendedPlants({ items = [] }: { items?: Product[] }) {
  if (items.length === 0) return null;

  return (
    <section className="bg-white py-12 sm:py-16">
      <Container>
        <SectionIntro
          title="Recommended For You"
          description="সহজ যত্ন ও জনপ্রিয়তার ভিত্তিতে নির্বাচিত কিছু গাছ।"
        />
        <ProductGrid items={items.slice(0, 4)} />
      </Container>
    </section>
  );
}
