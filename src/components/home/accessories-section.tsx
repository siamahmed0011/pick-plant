import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/shared/container";
import { formatCurrency } from "@/lib/formatters";
import { accessories } from "@/data/accessories";
import { SectionIntro } from "./section-intro";
export function AccessoriesSection() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <Container>
        <SectionIntro
          title="Pots & Gardening Essentials"
          description="গাছের সৌন্দর্য ও সঠিক যত্নের জন্য প্রয়োজনীয় টব এবং সরঞ্জাম।"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {accessories.map((item) => (
            <Link
              href={`/categories/${item.categorySlug}`}
              className="group surface overflow-hidden"
              key={item.id}
            >
              <div className="relative aspect-[4/3] bg-[var(--background)]">
                <Image
                  src={item.image}
                  alt={item.bengaliName}
                  fill
                  className="object-cover transition group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold">{item.name}</h3>
                <p className="text-sm text-[var(--muted)]">{item.bengaliName}</p>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                  {item.description}
                </p>
                <p className="mt-4 text-lg font-bold text-[var(--primary)]">
                  {formatCurrency(item.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
