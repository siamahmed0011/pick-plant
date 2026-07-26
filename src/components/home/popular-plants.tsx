import { Container } from "@/components/shared/container";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionIntro } from "./section-intro";
import type { Product } from "@/types";

export function PopularPlants({ items = [] }: { items?: Product[] }) {
  if (items.length === 0) return null;

  return (
    <section className="bg-white py-12 sm:py-16">
      <Container>
        <SectionIntro
          title="Popular Plants"
          description="আমাদের ক্রেতাদের সবচেয়ে পছন্দের গাছগুলো দেখুন।"
          href="/plants"
          label="View All Plants"
        />
        <ProductGrid items={items.slice(0, 4)} />
      </Container>
    </section>
  );
}
