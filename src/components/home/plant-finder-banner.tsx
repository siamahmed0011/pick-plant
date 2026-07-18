import Link from "next/link";
import { ArrowRight, Search, SunMedium, Timer, Waves } from "lucide-react";
import { Container } from "@/components/shared/container";
export function PlantFinderBanner() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-[var(--primary)] p-7 text-white sm:p-12">
          <div className="absolute -right-16 -top-20 size-72 rounded-full border-[50px] border-white/5" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--secondary)]">
                <Search size={17} /> Personal plant matching
              </span>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Find Your Perfect Plant</h2>
              <p className="mt-4 max-w-2xl leading-7 text-white/75">
                {"আলো, জায়গা, যত্নের সময় এবং অভিজ্ঞতা অনুযায়ী আপনার জন্য উপযুক্ত গাছ খুঁজে নিন।"}
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/70">
                <span className="flex items-center gap-1">
                  <SunMedium size={16} />
                  Light
                </span>
                <span className="flex items-center gap-1">
                  <Waves size={16} />
                  Water
                </span>
                <span className="flex items-center gap-1">
                  <Timer size={16} />
                  Care time
                </span>
              </div>
            </div>
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 font-semibold text-[var(--primary)]"
              href="/plant-finder"
            >
              Start Plant Finder
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
