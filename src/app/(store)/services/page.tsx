import type { Metadata } from "next";
import { ServicesView } from "@/components/services/services-view";

export const metadata: Metadata = {
  title: "Gardening & Plant Care Services",
  description: "Professional plant services in Bangladesh including plant health consultation, indoor setup, balcony garden design, repotting, and monthly corporate maintenance.",
  alternates: {
    canonical: "/services",
  },
};

export default function ServicesPage() {
  return <ServicesView />;
}
