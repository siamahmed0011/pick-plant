import type { Product } from "@/types";
import { categories } from "./categories";

const plants = [
  [
    "Snake Plant",
    "স্নেক প্ল্যান্ট",
    "snake-plant",
    "Dracaena trifasciata",
    650,
    0,
    "কম আলোতেও সহজে বেড়ে ওঠে ও ঘরের সৌন্দর্য বাড়ায়।",
  ],
  [
    "Money Plant",
    "মানি প্ল্যান্ট",
    "money-plant",
    "Epipremnum aureum",
    450,
    400,
    "সহজ পরিচর্যার জনপ্রিয় লতানো ইনডোর গাছ।",
  ],
  [
    "Peace Lily",
    "পিস লিলি",
    "peace-lily",
    "Spathiphyllum",
    850,
    0,
    "সবুজ পাতার সঙ্গে সাদা ফুল ঘরে প্রশান্ত পরিবেশ তৈরি করে।",
  ],
  [
    "Areca Palm",
    "এরিকা পাম",
    "areca-palm",
    "Dypsis lutescens",
    1200,
    1050,
    "বসার ঘর বা অফিসে সতেজ ক্রান্তীয় আবহ যোগ করে।",
  ],
  [
    "Rose Plant",
    "গোলাপ গাছ",
    "rose-plant",
    "Rosa",
    350,
    0,
    "সুন্দর ও সুগন্ধি ফুলের জন্য সবার প্রিয় গাছ।",
  ],
  [
    "Mango Plant",
    "আম গাছ",
    "mango-plant",
    "Mangifera indica",
    500,
    0,
    "বাড়ির বাগানে লাগানোর উপযোগী স্বাস্থ্যবান কলমের চারা।",
  ],
  [
    "Lemon Plant",
    "লেবু গাছ",
    "lemon-plant",
    "Citrus limon",
    420,
    380,
    "টবে বা বাগানে চাষের জন্য ফলনশীল লেবুর চারা।",
  ],
  [
    "Tulsi Plant",
    "তুলসী গাছ",
    "tulsi-plant",
    "Ocimum tenuiflorum",
    180,
    0,
    "ঐতিহ্যবাহী ও উপকারী সহজ পরিচর্যার ঔষধি গাছ।",
  ],
] as const;

export const products: Product[] = plants.map(
  (
    [name, bengaliName, slug, scientificName, regularPrice, salePrice, shortDescription],
    index
  ) => ({
    id: `plant-${index + 1}`,
    name,
    bengaliName,
    slug,
    scientificName,
    regularPrice,
    salePrice: salePrice || undefined,
    shortDescription,
    stock: 10 + index,
    image: "/images/placeholders/plant.svg",
    category: categories[index < 4 ? 2 : index === 4 ? 1 : index < 7 ? 0 : 4],
    lightRequirement: index < 4 ? "Indirect light" : "Full to partial sun",
    wateringFrequency: "সপ্তাহে ১-২ বার",
    difficulty: "Easy",
    petFriendly: index === 4,
    featured: index < 4,
    published: true,
  })
);
