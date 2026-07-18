import type { Category } from "@/types";

const categorySeeds = [
  ["Fruit Plants", "ফলের গাছ", "fruit-plants", "ছাদ, বারান্দা ও বাগানের জন্য ফলের গাছ।"],
  ["Flower Plants", "ফুলের গাছ", "flower-plants", "রঙিন ও সুগন্ধি ফুলের গাছের সংগ্রহ।"],
  ["Indoor Plants", "ইনডোর গাছ", "indoor-plants", "ঘরের ভেতরের পরিবেশের জন্য উপযুক্ত গাছ।"],
  ["Outdoor Plants", "আউটডোর গাছ", "outdoor-plants", "খোলা জায়গা ও বাগানের জন্য শক্ত গাছ।"],
  ["Medicinal Plants", "ঔষধি গাছ", "medicinal-plants", "পরিচিত ঔষধি ও উপকারী গাছ।"],
  ["Spice Plants", "মসলার গাছ", "spice-plants", "রান্নায় ব্যবহৃত মসলা জাতীয় গাছ।"],
  ["Seasonal Plants", "মৌসুমি গাছ", "seasonal-plants", "ঋতুভিত্তিক ফুল ও ফলের গাছ।"],
  ["Seeds", "বীজ", "seeds", "মানসম্মত ফুল, ফল ও সবজির বীজ।"],
  ["Pots & Planters", "টব ও প্ল্যান্টার", "pots-planters", "নান্দনিক টব ও প্ল্যান্টার।"],
  ["Gardening Tools", "বাগানের সরঞ্জাম", "gardening-tools", "গাছের যত্নের প্রয়োজনীয় সরঞ্জাম।"],
] as const;

export const categories: Category[] = categorySeeds.map(
  ([name, bengaliName, slug, description], index) => ({
    id: `cat-${index + 1}`,
    name,
    bengaliName,
    slug,
    description,
    image: "/images/placeholders/category.svg",
    active: true,
  })
);
