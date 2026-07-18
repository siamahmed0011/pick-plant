import { Headphones, HeartPulse, PackageCheck, Sprout } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionIntro } from "./section-intro";
const benefits = [
  {
    title: "Healthy Plants",
    text: "প্রতিটি গাছ স্বাস্থ্য পরীক্ষা করে যত্নসহকারে পাঠানো হয়।",
    Icon: HeartPulse,
  },
  {
    title: "Safe Packaging",
    text: "দূরত্ব অনুযায়ী নিরাপদ প্যাকেজিং নিশ্চিত করা হয়।",
    Icon: PackageCheck,
  },
  {
    title: "Care Guidance",
    text: "গাছের সঙ্গে প্রয়োজনীয় যত্নের নির্দেশনা দেওয়া হয়।",
    Icon: Sprout,
  },
  {
    title: "Customer Support",
    text: "অর্ডার ও গাছের যত্নে প্রয়োজনীয় সহায়তা পাওয়া যাবে।",
    Icon: Headphones,
  },
];
export function BenefitsSection() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <SectionIntro
          title="Why Pick Plant"
          description="গাছ বাছাই থেকে ডেলিভারি-পরবর্তী যত্ন পর্যন্ত নির্ভরযোগ্য সহায়তা।"
        />
        <div className="grid gap-px overflow-hidden rounded-[var(--radius)] border bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ title, text, Icon }) => (
            <article className="bg-white p-6" key={title}>
              <span className="grid size-11 place-items-center rounded-xl bg-[var(--secondary)]/35 text-[var(--primary)]">
                <Icon size={22} />
              </span>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
