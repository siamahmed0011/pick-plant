import { Container } from "@/components/shared/container";
import { ProductGrid } from "@/components/product/product-grid";
import { products } from "@/data/products";
import { SectionIntro } from "./section-intro";
export function PopularPlants() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <Container>
        <SectionIntro
          title="Popular Plants"
          description="আমাদের ক্রেতাদের সবচেয়ে পছন্দের গাছগুলো দেখুন।"
          href="/plants"
          label="View All Plants"
        />
        <ProductGrid items={products.slice(2, 6)} />
      </Container>
    </section>
  );
}
