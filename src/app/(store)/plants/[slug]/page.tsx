import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeartPulse, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { ProductActions } from "@/components/product/product-actions";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPrice } from "@/components/product/product-price";
import { ProductOptions } from "@/components/product/product-options";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { ProductDetailTabs } from "@/components/product/product-detail-tabs";
import { ProductCareSummary } from "@/components/product/product-care-summary";
import { ProductMobileActions } from "@/components/product/product-mobile-actions";
import { ProductGrid } from "@/components/product/product-grid";
import { Container } from "@/components/shared/container";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { products as staticProducts } from "@/data/products";
import { getStorefrontProducts } from "@/lib/storefront/products";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return staticProducts.map((product) => ({ slug: product.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const products = await getStorefrontProducts();
  const product = products.find((item) => item.slug === slug);
  return product
    ? { title: `${product.name} | Pick Plant`, description: product.shortDescription }
    : { title: "Plant Not Found | Pick Plant" };
}
export default async function PlantDetailsPage({ params }: Props) {
  const { slug } = await params;
  const products = await getStorefrontProducts();
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();
  const discount = product.salePrice
    ? Math.round((1 - product.salePrice / product.regularPrice) * 100)
    : 0;
  const images = product.galleryImages?.length
    ? product.galleryImages
    : [product.image, product.image, product.image];
  const related = products
    .filter((item) => item.id !== product.id && item.category.slug === product.category.slug)
    .slice(0, 4);
  const recent = products.filter((item) => item.id !== product.id).slice(0, 4);
  return (
    <main className="pb-24 pt-8 lg:pb-12">
      <Container>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "All Plants", href: "/plants" },
            { label: product.category.name, href: `/categories/${product.category.slug}` },
            { label: product.name },
          ]}
        />
        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <ProductGallery images={images} name={product.name} />
          <section>
            <div className="flex gap-2">
              <Badge>{product.category.name}</Badge>
              {discount > 0 && (
                <Badge className="bg-[var(--accent)] text-white">-{discount}%</Badge>
              )}
            </div>
            <h1 className="mt-5 text-3xl font-bold sm:text-5xl">{product.name}</h1>
            <p className="mt-2 text-xl text-[var(--primary)]">{product.bengaliName}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              <em>{product.scientificName}</em> · SKU PP-{product.id.toUpperCase()} · ★ 4.9 (24
              reviews)
            </p>
            <div className="mt-6 text-2xl">
              <ProductPrice regularPrice={product.regularPrice} salePrice={product.salePrice} />
            </div>
            <p className="mt-5 leading-8 text-[var(--muted)]">{product.shortDescription}</p>
            <p className="mt-4 font-semibold text-[var(--primary)]">
              {product.stock} plants in stock
            </p>
            <div className="mt-7">
              <ProductOptions />
            </div>
            <div className="mt-7">
              <QuantitySelector stock={product.stock} />
            </div>
            <div className="mt-7">
              <ProductActions />
            </div>
            <dl className="mt-8 grid grid-cols-2 gap-3 rounded-2xl border bg-white p-5 text-sm">
              <div>
                <dt>Light Requirement</dt>
                <dd className="text-[var(--muted)]">{product.lightRequirement}</dd>
              </div>
              <div>
                <dt>Watering</dt>
                <dd className="text-[var(--muted)]">{product.wateringFrequency}</dd>
              </div>
              <div>
                <dt>Difficulty</dt>
                <dd className="text-[var(--muted)]">{product.difficulty}</dd>
              </div>
              <div>
                <dt>Pet Friendly</dt>
                <dd className="text-[var(--muted)]">{product.petFriendly ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt>Indoor / Outdoor</dt>
                <dd className="text-[var(--muted)]">{product.indoorOutdoor ?? "Indoor"}</dd>
              </div>
              <div>
                <dt>Plant / Pot Size</dt>
                <dd className="text-[var(--muted)]">
                  {product.plantSize ?? "Medium"} / {product.potSize ?? "6 inch"}
                </dd>
              </div>
              <div>
                <dt>Temperature</dt>
                <dd className="text-[var(--muted)]">{product.temperature ?? "18–30°C"}</dd>
              </div>
              <div>
                <dt>Humidity</dt>
                <dd className="text-[var(--muted)]">{product.humidity ?? "Medium"}</dd>
              </div>
            </dl>
          </section>
        </div>
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Healthy Plant Guarantee", Icon: HeartPulse },
            { title: "Safe Packaging", Icon: PackageCheck },
            { title: "Delivery Across Bangladesh", Icon: Truck },
            { title: "Plant Care Support", Icon: ShieldCheck },
          ].map(({ title, Icon }) => (
            <article className="surface p-5" key={title}>
              <Icon className="text-[var(--primary)]" />
              <h2 className="mt-3 font-bold">{title}</h2>
            </article>
          ))}
        </section>
        <ProductDetailTabs />
        <ProductCareSummary product={product} />
        <section className="mt-14">
          <h2 className="text-3xl font-bold">You May Also Like</h2>
          <p className="mt-2 text-[var(--muted)]">
            একই ক্যাটাগরি ও যত্নের ধরন অনুযায়ী নির্বাচিত আরও কিছু গাছ।
          </p>
          <div className="mt-6">
            {related.length ? <ProductGrid items={related} /> : <ProductGrid items={recent} />}
          </div>
        </section>
        <section className="mt-14">
          <h2 className="text-3xl font-bold">Recently Viewed</h2>
          <p className="mt-2 text-[var(--muted)]">আপনার জন্য ছোট একটি mock selection।</p>
          <div className="mt-6">
            <ProductGrid items={recent} />
          </div>
        </section>
      </Container>
      <ProductMobileActions price={product.salePrice ?? product.regularPrice} name={product.name} />
    </main>
  );
}
