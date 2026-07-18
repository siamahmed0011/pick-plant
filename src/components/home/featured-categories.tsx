import { Container } from "@/components/shared/container";
import { CategoryGrid } from "@/components/category/category-grid";
import { categories } from "@/data/categories";
import { SectionIntro } from "./section-intro";
export function FeaturedCategories() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <SectionIntro
          title="Featured Categories"
          description="আপনার প্রয়োজন ও জায়গা অনুযায়ী সঠিক ক্যাটাগরি বেছে নিন।"
          href="/categories"
          label="View All Categories"
        />
        <CategoryGrid items={categories} />
      </Container>
    </section>
  );
}
