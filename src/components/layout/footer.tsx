import Link from "next/link";
import { Camera, Globe, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { siteConfig } from "@/config/site";
const groups = [
  {
    title: "Shop",
    items: [
      { label: "All Plants", href: "/plants" },
      { label: "Indoor Plants", href: "/categories/indoor-plants" },
      { label: "Fruit Plants", href: "/categories/fruit-plants" },
      { label: "Pots & Planters", href: "/categories/pots-planters" },
    ],
  },
  {
    title: "Explore",
    items: [
      { label: "Plant Finder", href: "/plant-finder" },
      { label: "Plant Care", href: "/plant-care" },
      { label: "Services", href: "/services" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/about" },
      { label: "Terms & Conditions", href: "/about" },
    ],
  },
];
export function Footer() {
  return (
    <footer className="mt-auto border-t bg-[var(--surface)]">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 sm:py-16 lg:grid-cols-[1.3fr_repeat(3,.7fr)_1.2fr] lg:gap-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs leading-7 text-[var(--muted)]">
            {
              "সুস্থ গাছ, সঠিক পরামর্শ এবং নিরাপদ ডেলিভারির মাধ্যমে প্রতিদিনের জীবনে প্রকৃতিকে কাছে আনাই আমাদের লক্ষ্য।"
            }
          </p>
          <div className="mt-6 flex gap-2">
            {[
              { label: "Facebook", Icon: Globe },
              { label: "Instagram", Icon: Camera },
              { label: "YouTube", Icon: MessageCircle },
            ].map(({ label, Icon }) => (
              <a href="#" aria-label={label} className="icon-button size-10" key={label}>
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
        {groups.map((group) => (
          <nav aria-label={`${group.title} links`} key={group.title}>
            <h2 className="text-sm font-bold uppercase tracking-[0.12em]">{group.title}</h2>
            <ul className="mt-5 grid gap-3 text-sm text-[var(--muted)]">
              {group.items.map((item) => (
                <li key={item.label}>
                  <Link className="hover:text-[var(--primary)]" href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em]">Contact</h2>
          <ul className="mt-5 grid gap-4 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <Phone size={16} />
              {siteConfig.phone}
            </li>
            <li className="flex gap-2">
              <Mail size={16} />
              {siteConfig.email}
            </li>
            <li className="flex gap-2">
              <MapPin size={16} />
              {siteConfig.address}
            </li>
          </ul>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Secure payment methods coming soon
          </p>
        </div>
      </Container>
      <div className="border-t">
        <Container className="flex flex-col gap-2 py-5 text-center text-sm text-[var(--muted)] sm:flex-row sm:justify-between">
          <p>Copyright 2026 Pick Plant. All rights reserved.</p>
          <p>Made for greener homes in Bangladesh.</p>
        </Container>
      </div>
    </footer>
  );
}
