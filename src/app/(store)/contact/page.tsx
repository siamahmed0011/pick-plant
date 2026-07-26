import type { Metadata } from "next";
import { ContactFormView } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact Us | Pick Plant Support & Inquiries",
  description: "Get in touch with Pick Plant team for plant care support, gardening service inquiries, order assistance, or custom corporate plant setups in Bangladesh.",
};

export default function ContactPage() {
  return <ContactFormView />;
}
