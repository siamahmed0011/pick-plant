import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/product-grid";
import { Container } from "@/components/shared/container";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EmptyState } from "@/components/shared/empty-state";
import {
  getStorefrontCategories,
  getStorefrontCategoryBySlug,
  getStorefrontCategoryProducts,
} from "@/lib/storefront/categories";

export async function generateStaticParams() {
  const categories = await getStorefrontCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getStorefrontCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found | Pick Plant",
    };
  }

  return {
    title: `${category.name} | Pick Plant`,
    description:
      category.description ||
      `Explore our curated selection of ${category.name} at Pick Plant. High quality plants delivered with care across Bangladesh.`,
    alternates: {
      canonical: `/categories/${category.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getStorefrontCategoryBySlug(slug);
  if (!category) notFound();

  const categoryProducts = await getStorefrontCategoryProducts(category.id);

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
              <p className="text-sm font-bold uppercase tracking-[.18em] text-[#A7E3C7]">
                Plant collection
              </p>
              <h1 className="mt-3 text-3xl font-bold sm:text-5xl">{category.name}</h1>
              {category.description && (
                <p className="mt-3 max-w-xl text-lg leading-8 text-white/75">
                  {category.description}
                </p>
              )}
              <p className="mt-5 text-sm font-semibold">
                {categoryProducts.length}{" "}
                {categoryProducts.length === 1 ? "product" : "products"} available
              </p>
            </div>
            {category.image && (
              <div className="relative min-h-56 bg-[var(--secondary)]/40">
                <Image
                  src={category.image}
                  alt={`${category.bengaliName || category.name} category`}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </section>
        <section className="mt-10" aria-label={`${category.name} products`}>
          {categoryProducts.length ? (
            <ProductGrid items={categoryProducts} />
          ) : (
            <EmptyState
              title="No products are available in this category yet"
              description="We are currently adding new plants and gardening items to this category. Check back soon or browse all our available plants."
              actionHref="/plants"
              actionLabel="Browse All Plants"
            />
          )}
        </section>
      </Container>
    </main>
  );
}

