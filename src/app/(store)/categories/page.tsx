import { CategoryGrid } from "@/components/category/category-grid";
import { Container } from "@/components/shared/container";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { categories } from "@/data/categories";
export default function CategoriesPage() {
  return (
    <main className="py-8 sm:py-12">
      <Container>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Categories" }]} />
        <header className="mt-6 border-b pb-8">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-[var(--primary)]">
            Explore the collection
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-5xl">Categories</h1>
          <p className="mt-3 max-w-2xl text-lg leading-7 text-[var(--muted)]">
            {"গাছ ও গার্ডেনিং পণ্যের সব বিভাগ এক জায়গায় দেখুন।"}
          </p>
        </header>
        <section className="mt-8" aria-label="Plant categories">
          <CategoryGrid items={categories} />
        </section>
      </Container>
    </main>
  );
}
