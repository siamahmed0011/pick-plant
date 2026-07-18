import Link from "next/link";
import { ArrowRight, Building2, HeartHandshake, Sprout } from "lucide-react";
import { Container } from "@/components/shared/container";
import { services } from "@/data/services";
import { SectionIntro } from "./section-intro";
const icons = [Sprout, Building2, HeartHandshake];
export function ServicesSection() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <Container>
        <SectionIntro
          title="Gardening Services"
          description="বাসা, অফিস ও বাণিজ্যিক জায়গার জন্য পেশাদার সবুজায়ন সেবা।"
          href="/services"
          label="Explore Services"
        />
        <div className="grid gap-5 md:grid-cols-3">
          {services.map((service, index) => {
            const Icon = icons[index];
            return (
              <article className="surface p-7" key={service.id}>
                <span className="grid size-12 place-items-center rounded-xl bg-[var(--primary)] text-white">
                  <Icon />
                </span>
                <h3 className="mt-5 text-xl font-bold">{service.title}</h3>
                <p className="mt-3 min-h-20 leading-7 text-[var(--muted)]">{service.description}</p>
                <Link
                  className="mt-5 inline-flex items-center gap-2 font-semibold text-[var(--primary)]"
                  href="/services"
                >
                  Learn More
                  <ArrowRight size={16} />
                </Link>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
