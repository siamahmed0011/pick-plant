import { mainNavigation } from "./navigation";
export const siteConfig = {
  name: "Pick Plant",
  description: "আপনার বিশ্বস্ত অনলাইন প্ল্যান্ট শপ",
  email: "hello@pickplant.example",
  phone: "+880 1XXX-XXXXXX",
  address: "Dhaka, Bangladesh",
  social: { facebook: "#", instagram: "#", youtube: "#" },
  mainNavigation,
  footerNavigation: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Plant Care", href: "/plant-care" },
  ],
} as const;
