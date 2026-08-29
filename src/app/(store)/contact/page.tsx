import type { Metadata } from "next";
import { ContactFormView } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Pick Plant team for plant care support, gardening service inquiries, order assistance, or custom corporate plant setups in Bangladesh.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return <ContactFormView />;
}
