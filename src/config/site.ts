import { mainNavigation } from "./navigation";
export const siteConfig = {
  name: "Pick Plant",
  description: "আপনার বিশ্বস্ত অনলাইন প্ল্যান্ট শপ",
  email: "support@pickplant.com",
  phone: "+880 1700-000000",
  address: "House 42, Road 11, Block D, Banani, Dhaka-1213, Bangladesh",
  social: { facebook: "#", instagram: "#", youtube: "#" },
  mainNavigation,
  footerNavigation: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Plant Care", href: "/plant-care" },
  ],
} as const;

