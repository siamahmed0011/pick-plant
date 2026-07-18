import type { NavigationItem } from "@/types";
export const categoryNavigation: NavigationItem[] = [
  ["Fruit Plants", "ছাদ, বারান্দা ও বাগানের জন্য ফলের গাছ।", "fruit-plants"],
  ["Flower Plants", "রঙিন ফুলে আপনার পরিসর সাজান।", "flower-plants"],
  ["Indoor Plants", "ঘরের ভেতরের পরিবেশের জন্য উপযুক্ত গাছ।", "indoor-plants"],
  ["Outdoor Plants", "বাইরের আলো-বাতাসে বেড়ে ওঠা গাছ।", "outdoor-plants"],
  ["Medicinal Plants", "প্রয়োজনীয় ভেষজ ও ঔষধি গাছ।", "medicinal-plants"],
  ["Spice Plants", "ঘরে চাষের উপযোগী মসলার গাছ।", "spice-plants"],
  ["Seasonal Plants", "ঋতুভিত্তিক সুন্দর ও সতেজ গাছ।", "seasonal-plants"],
  ["Seeds", "মানসম্মত ফুল, ফল ও সবজির বীজ।", "seeds"],
  ["Pots & Planters", "গাছের জন্য নান্দনিক টব ও প্ল্যান্টার।", "pots-planters"],
  ["Gardening Tools", "বাগান পরিচর্যার প্রয়োজনীয় সরঞ্জাম।", "gardening-tools"],
].map(([label, description, slug]) => ({ label, description, href: `/categories/${slug}` }));
export const mainNavigation: NavigationItem[] = [
  { label: "Home", href: "/" },
  { label: "All Plants", href: "/plants" },
  { label: "Categories", href: "/categories", children: categoryNavigation },
  { label: "Plant Finder", href: "/plant-finder" },
  { label: "Plant Care", href: "/plant-care" },
  { label: "Services", href: "/services" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];
