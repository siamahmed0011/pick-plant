import { Quote, Star } from "lucide-react";
import { Container } from "@/components/shared/container";
import { testimonials } from "@/data/testimonials";
import { SectionIntro } from "./section-intro";
export function TestimonialsSection() {
  return (
    <section className="store-section bg-white">
      <Container>
        <SectionIntro
          title="Loved by Plant Lovers"
          description="আমাদের সেবা সম্পর্কে ক্রেতাদের অভিজ্ঞতা।"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <figure
              className="surface flex h-full flex-col p-6 transition duration-200 hover:-translate-y-1"
              key={item.id}
            >
              <Quote className="text-[var(--secondary)]" size={34} />
              <div className="mt-4 flex text-amber-500" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star fill="currentColor" size={16} key={index} />
                ))}
              </div>
              <blockquote className="mt-4 min-h-20 leading-7 text-[var(--muted)]">
                {item.quote}
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3 border-t pt-5">
                <span className="grid size-10 place-items-center rounded-full bg-[var(--muted-surface)] font-bold text-[var(--primary)]">
                  {item.name.slice(0, 1)}
                </span>
                <span>
                  <strong className="block">{item.name}</strong>
                  <span className="text-sm text-[var(--muted)]">{item.location}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
