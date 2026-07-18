import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/product-grid";
import { Container } from "@/components/shared/container";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EmptyState } from "@/components/shared/empty-state";
import { categories } from "@/data/categories";
import { getStorefrontProducts } from "@/lib/storefront/products";
export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = await getStorefrontProducts();
  const category =
    products.find((product) => product.category.slug === slug)?.category ??
    categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const categoryProducts = products.filter((product) => product.category.slug === category.slug);
  return (
    <main className="py-8 sm:py-12">
      <Container>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Categories", href: "/categories" },
            { label: category.name },
          ]}
        />
        <section className="relative mt-6 overflow-hidden rounded-[2rem] bg-[var(--primary)] text-white">
          <div className="grid min-h-72 items-center lg:grid-cols-[1fr_20rem]">
            <div className="p-7 sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[.18em] text-[var(--secondary)]">
                Plant collection
              </p>
              <h1 className="mt-3 text-3xl font-bold sm:text-5xl">{category.name}</h1>
              <p className="mt-3 max-w-xl text-lg leading-8 text-white/75">
                {category.description}
              </p>
              <p className="mt-5 text-sm font-semibold">
                {categoryProducts.length} products available
              </p>
            </div>
            <div className="relative min-h-56 bg-[var(--secondary)]/40">
              <Image
                src={category.image}
                alt={`${category.bengaliName} category`}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>
        <section className="mt-10" aria-label={`${category.name} products`}>
          {categoryProducts.length ? (
            <ProductGrid items={categoryProducts} />
          ) : (
            <EmptyState
              title="No plants found"
              description="এই category-তে এখনো কোনো গাছ যোগ করা হয়নি।"
            />
          )}
        </section>
      </Container>
    </main>
  );
}
