import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { Container } from "@/components/shared/container";
import { formatCurrency } from "@/lib/formatters";
import { comboOffers } from "@/data/combo-offers";
import { SectionIntro } from "./section-intro";
export function ComboOffers() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <SectionIntro
          title="Plant Combo Offers"
          description="কম খরচে একসঙ্গে একাধিক গাছ ও প্রয়োজনীয় উপকরণ সংগ্রহ করুন।"
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {comboOffers.map((offer) => (
            <article className="surface group overflow-hidden" key={offer.id}>
              <div className="relative aspect-[16/9] bg-[var(--secondary)]/30">
                <Image
                  src={offer.image}
                  alt={`${offer.title} plants`}
                  fill
                  className="object-cover transition group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                  <Package size={17} />
                  {offer.itemCount} items included
                </span>
                <h3 className="mt-3 text-xl font-bold">{offer.title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-[var(--muted)]">
                  {offer.description}
                </p>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <del className="text-sm text-[var(--muted)]">
                      {formatCurrency(offer.originalPrice)}
                    </del>
                    <p className="text-xl font-bold text-[var(--primary)]">
                      {formatCurrency(offer.offerPrice)}
                    </p>
                  </div>
                  <Link
                    className="rounded-xl bg-[var(--primary)] px-4 py-2 font-semibold text-white"
                    href="/plants"
                  >
                    Shop Combo
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
