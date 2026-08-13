import nextEnv from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ProductStatus } from "../src/generated/prisma/client";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const categorySeeds = [
  {
    name: "Fruit Plants",
    bengaliName: "ফলের গাছ",
    slug: "fruit-plants",
    description: "ছাদ, বারান্দা ও বাগানের জন্য ফলের গাছ।",
    sortOrder: 1,
  },
  {
    name: "Flower Plants",
    bengaliName: "ফুলের গাছ",
    slug: "flower-plants",
    description: "রঙিন ও সুগন্ধি ফুলের গাছের সংগ্রহ।",
    sortOrder: 2,
  },
  {
    name: "Indoor Plants",
    bengaliName: "ইনডোর গাছ",
    slug: "indoor-plants",
    description: "ঘরের ভেতরের পরিবেশের জন্য উপযুক্ত গাছ।",
    sortOrder: 3,
  },
  {
    name: "Outdoor Plants",
    bengaliName: "আউটডোর গাছ",
    slug: "outdoor-plants",
    description: "খোলা জায়গা ও বাগানের জন্য শক্ত গাছ।",
    sortOrder: 4,
  },
  {
    name: "Medicinal Plants",
    bengaliName: "ঔষধি গাছ",
    slug: "medicinal-plants",
    description: "পরিচিত ঔষধি ও উপকারী গাছ।",
    sortOrder: 5,
  },
  {
    name: "Spice Plants",
    bengaliName: "মসলার গাছ",
    slug: "spice-plants",
    description: "রান্নায় ব্যবহৃত মসলা জাতীয় গাছ।",
    sortOrder: 6,
  },
  {
    name: "Seasonal Plants",
    bengaliName: "মৌসুমি গাছ",
    slug: "seasonal-plants",
    description: "ঋতুভিত্তিক ফুল ও ফলের গাছ।",
    sortOrder: 7,
  },
  {
    name: "Seeds",
    bengaliName: "বীজ",
    slug: "seeds",
    description: "মানসম্মত ফুল, ফল ও সবজির বীজ।",
    sortOrder: 8,
  },
  {
    name: "Pots & Planters",
    bengaliName: "টব ও প্ল্যান্টার",
    slug: "pots-planters",
    description: "নান্দনিক টব ও প্ল্যান্টার।",
    sortOrder: 9,
  },
  {
    name: "Gardening Tools",
    bengaliName: "বাগানের সরঞ্জাম",
    slug: "gardening-tools",
    description: "গাছের যত্নের প্রয়োজনীয় সরঞ্জাম।",
    sortOrder: 10,
  },
];

const sampleProducts = [
  // Fruit Plants
  {
    name: "Mango Plant",
    bengaliName: "আম গাছ",
    slug: "mango-plant",
    sku: "PLANT-MANGO-01",
    categorySlug: "fruit-plants",
    price: 500,
    shortDescription: "বাড়ির বাগানে লাগানোর উপযোগী স্বাস্থ্যবান কলমের চারা।",
    description: "বাড়ির ছাদ বা বাগানের জন্য উচ্চ ফলনশীল কলমের আম চারা। নিয়মিত আলো-বাতাস পেলে দ্রুত বৃদ্ধি পায়।",
    stockQuantity: 15,
    indoorOutdoor: "Outdoor",
    lightRequirement: "Full sun",
    waterRequirement: "Water regularly",
    difficulty: "Easy",
  },
  {
    name: "Lemon Plant",
    bengaliName: "লেবু গাছ",
    slug: "lemon-plant",
    sku: "PLANT-LEMON-01",
    categorySlug: "fruit-plants",
    price: 420,
    compareAtPrice: 480,
    shortDescription: "টবে বা বাগানে চাষের জন্য ফলনশীল লেবুর চারা।",
    description: "বারোমাসি লেবুর চারা, টবে লাগানোর জন্য উপযুক্ত। সুন্দর সুবাস ও প্রচুর ফলন পাওয়া যায়।",
    stockQuantity: 20,
    indoorOutdoor: "Outdoor",
    lightRequirement: "Full sun",
    waterRequirement: "Moderate watering",
    difficulty: "Easy",
  },
  // Flower Plants
  {
    name: "Rose Plant",
    bengaliName: "গোলাপ গাছ",
    slug: "rose-plant",
    sku: "PLANT-ROSE-01",
    categorySlug: "flower-plants",
    price: 350,
    shortDescription: "সুন্দর ও সুগন্ধি ফুলের জন্য সবার প্রিয় গাছ।",
    description: "উজ্জ্বল রঙের গোলাপ গাছ। বারান্দা বা ছাদে নান্দনিক পরিবেশ তৈরি করে।",
    stockQuantity: 18,
    indoorOutdoor: "Outdoor",
    lightRequirement: "Full sun",
    waterRequirement: "Daily watering",
    difficulty: "Medium",
  },
  {
    name: "Jasmine Plant",
    bengaliName: "বেলি ফুল গাছ",
    slug: "jasmine-plant",
    sku: "PLANT-JASMINE-01",
    categorySlug: "flower-plants",
    price: 280,
    shortDescription: "মনোমুগ্ধকর সুবাসের মিষ্টি সাদা বেলি ফুল গাছ।",
    description: "সন্ধ্যায় ফুটন্ত সুগন্ধি বেলি ফুল ঘরের পরিবেশ তাজা রাখে।",
    stockQuantity: 12,
    indoorOutdoor: "Outdoor",
    lightRequirement: "Partial to full sun",
    waterRequirement: "Moderate watering",
    difficulty: "Easy",
  },
  // Indoor Plants
  {
    name: "Snake Plant",
    bengaliName: "স্নেক প্ল্যান্ট",
    slug: "snake-plant",
    sku: "PLANT-SNAKE-01",
    categorySlug: "indoor-plants",
    price: 650,
    shortDescription: "কম আলোতেও সহজে বেড়ে ওঠে ও ঘরের বাতাস বিশুদ্ধ করে।",
    description: "একটি অত্যন্ত জনপ্রিয় ইনডোর প্ল্যান্ট যা ঘরের বায়ু শোধন করে এবং কম যত্নে বেঁচে থাকে।",
    stockQuantity: 25,
    isFeatured: true,
    indoorOutdoor: "Indoor",
    lightRequirement: "Indirect light",
    waterRequirement: "Low watering",
    difficulty: "Easy",
  },
  {
    name: "Money Plant",
    bengaliName: "মানি প্ল্যান্ট",
    slug: "money-plant",
    sku: "PLANT-MONEY-01",
    categorySlug: "indoor-plants",
    price: 450,
    compareAtPrice: 500,
    shortDescription: "সহজ পরিচর্যার জনপ্রিয় লতানো ইনডোর গাছ।",
    description: "সবুজ ও হলুদ শেডের চকচকে পাতার লতানো ইনডোর গাছ। জলে বা মাটিতে সহজে বাড়ে।",
    stockQuantity: 30,
    isFeatured: true,
    indoorOutdoor: "Indoor",
    lightRequirement: "Low to bright indirect light",
    waterRequirement: "Moderate watering",
    difficulty: "Easy",
  },
  {
    name: "Peace Lily",
    bengaliName: "পিস লিলি",
    slug: "peace-lily",
    sku: "PLANT-PEACE-01",
    categorySlug: "indoor-plants",
    price: 850,
    shortDescription: "সবুজ পাতার সঙ্গে সাদা ফুল ঘরে প্রশান্ত পরিবেশ তৈরি করে।",
    description: "আভিজাত্যপূর্ণ ইনডোর গাছ, যার রয়েছে আকর্ষণীয় সাদা ফুল ও গাঢ় সবুজ পাতা।",
    stockQuantity: 10,
    indoorOutdoor: "Indoor",
    lightRequirement: "Low to medium indirect light",
    waterRequirement: "Keep soil moist",
    difficulty: "Easy",
  },
  {
    name: "Areca Palm",
    bengaliName: "এরিকা পাম",
    slug: "areca-palm",
    sku: "PLANT-ARECA-01",
    categorySlug: "indoor-plants",
    price: 1200,
    compareAtPrice: 1350,
    shortDescription: "বসার ঘর বা অফিসে সতেজ ক্রান্তীয় আবহ যোগ করে।",
    description: "বড় পাতাযুক্ত সুন্দর ক্রান্তীয় পাম গাছ। ড্রয়িং রুম বা অফিসের কর্নারের জন্য আদর্শ।",
    stockQuantity: 8,
    indoorOutdoor: "Indoor",
    lightRequirement: "Bright indirect light",
    waterRequirement: "Regular watering",
    difficulty: "Medium",
  },
  // Outdoor Plants
  {
    name: "Bougainvillea Plant",
    bengaliName: "কাগজ ফুল গাছ",
    slug: "bougainvillea-plant",
    sku: "PLANT-BOUGAIN-01",
    categorySlug: "outdoor-plants",
    price: 400,
    shortDescription: "প্রচুর রোদ সহ্যকারী নান্দনিক ফুল গাছ।",
    description: "সব ঋতুতেই রঙিন ফুলে ভরে থাকা শক্তপোক্ত আউটডোর প্ল্যান্ট।",
    stockQuantity: 14,
    indoorOutdoor: "Outdoor",
    lightRequirement: "Full sun",
    waterRequirement: "Low watering",
    difficulty: "Easy",
  },
  // Medicinal Plants
  {
    name: "Tulsi Plant",
    bengaliName: "তুলসী গাছ",
    slug: "tulsi-plant",
    sku: "PLANT-TULSI-01",
    categorySlug: "medicinal-plants",
    price: 180,
    shortDescription: "ঐতিহ্যবাহী ও উপকারী সহজ পরিচর্যার ঔষধি গাছ।",
    description: "ভেষজ গুণাবলীতে ভরপুর পবিত্র ও উপকারী গাছ। ঠান্ডা-কাশিতে মহৌষধ।",
    stockQuantity: 40,
    indoorOutdoor: "Both",
    lightRequirement: "Partial to full sun",
    waterRequirement: "Daily light watering",
    difficulty: "Easy",
  },
  {
    name: "Aloe Vera",
    bengaliName: "অ্যালোভেরা",
    slug: "aloe-vera-plant",
    sku: "PLANT-ALOE-01",
    categorySlug: "medicinal-plants",
    price: 250,
    shortDescription: "ত্বক ও স্বাস্থ্যের জন্য প্রাকৃতিক উপকারী ভেষজ গাছ।",
    description: "রসালো পাতাযুক্ত অ্যালোভেরা গাছ যা ত্বক পরিচর্যা ও স্বাস্থ্যের জন্য অতি উপকারী।",
    stockQuantity: 35,
    indoorOutdoor: "Both",
    lightRequirement: "Bright sunlight",
    waterRequirement: "Low watering",
    difficulty: "Easy",
  },
  // Spice Plants
  {
    name: "Curry Leaf Plant",
    bengaliName: "কারিপাতা গাছ",
    slug: "curry-leaf-plant",
    sku: "PLANT-CURRY-01",
    categorySlug: "spice-plants",
    price: 220,
    shortDescription: "রান্নায় সুস্বাদু সুবাস যোগ করার কারিপাতা গাছ।",
    description: "তাজা কারিপাতা রান্নায় দারুণ গন্ধ আনে। টবে সহজেই ভালো জন্মায়।",
    stockQuantity: 15,
    indoorOutdoor: "Outdoor",
    lightRequirement: "Full sun",
    waterRequirement: "Moderate watering",
    difficulty: "Easy",
  },
  // Seasonal Plants
  {
    name: "Petunia Plant",
    bengaliName: "পিটুনিয়া গাছ",
    slug: "petunia-plant",
    sku: "PLANT-PETUNIA-01",
    categorySlug: "seasonal-plants",
    price: 150,
    shortDescription: "শীতকালীন প্রচুর ফুল ফোটা আকর্ষণীয় গাছ।",
    description: "নানা রঙের মিষ্টি ফুলে টব বা হ্যাঙিং বাসকেট সাজাতে চমৎকার।",
    stockQuantity: 20,
    indoorOutdoor: "Outdoor",
    lightRequirement: "Full sun",
    waterRequirement: "Daily watering",
    difficulty: "Easy",
  },
  // Seeds
  {
    name: "Sunflower Seeds Pack",
    bengaliName: "সূর্যমুখী বীজ প্যাক",
    slug: "sunflower-seeds",
    sku: "SEED-SUNFLOWER-01",
    categorySlug: "seeds",
    price: 120,
    shortDescription: "উচ্চ অঙ্কুরোদ্গম ক্ষমতার সূর্যমুখী ফুলের বীজ।",
    description: "সহজে চাষযোগ্য সুবর্ণ সূর্যমুখী ফুলের বীজ। ২৫টি বীজের প্যাক।",
    stockQuantity: 50,
    indoorOutdoor: "Outdoor",
    lightRequirement: "Full sun",
    waterRequirement: "Keep moist during germination",
    difficulty: "Easy",
  },
  // Pots & Planters
  {
    name: "Ceramic Planter",
    bengaliName: "সিরামিক প্ল্যান্টার",
    slug: "ceramic-planter",
    sku: "POT-CERAMIC-01",
    categorySlug: "pots-planters",
    price: 550,
    compareAtPrice: 620,
    shortDescription: "ইনডোর গাছের জন্য মিনিমাল ডিজাইনের ড্রেনেজযুক্ত টব।",
    description: "উচ্চমানের সিরামিক প্ল্যান্টার যা ঘরের যেকোনো কোণে আধুনিক ছোঁয়া আনে।",
    stockQuantity: 15,
    indoorOutdoor: "Indoor",
    lightRequirement: "N/A",
    waterRequirement: "N/A",
    difficulty: "Easy",
  },
  {
    name: "Hanging Pot",
    bengaliName: "হ্যাঙিং পট",
    slug: "hanging-pot",
    sku: "POT-HANGING-01",
    categorySlug: "pots-planters",
    price: 320,
    shortDescription: "বারান্দার ছোট জায়গায় সবুজ যোগ করার ঝুলন্ত টব।",
    description: "মজবুত প্লাস্টিক ও শিকলযুক্ত ঝুলন্ত টব। বারান্দায় লতানো গাছের জন্য সেরা।",
    stockQuantity: 22,
    indoorOutdoor: "Both",
    lightRequirement: "N/A",
    waterRequirement: "N/A",
    difficulty: "Easy",
  },
];

async function seed() {
  console.log("Seeding categories into database...");

  const categoryMap = new Map<string, string>();

  for (const catData of categorySeeds) {
    const category = await prisma.category.upsert({
      where: { slug: catData.slug },
      update: {
        name: catData.name,
        bengaliName: catData.bengaliName,
        description: catData.description,
        sortOrder: catData.sortOrder,
        isActive: true,
      },
      create: {
        name: catData.name,
        bengaliName: catData.bengaliName,
        slug: catData.slug,
        description: catData.description,
        sortOrder: catData.sortOrder,
        isActive: true,
      },
    });

    categoryMap.set(catData.slug, category.id);
    console.log(`- Category: ${category.name} (${category.slug}) -> ID: ${category.id}`);
  }

  console.log("\nSeeding sample products into database...");

  for (const prodData of sampleProducts) {
    const categoryId = categoryMap.get(prodData.categorySlug);
    if (!categoryId) {
      console.warn(`Category slug missing: ${prodData.categorySlug}`);
      continue;
    }

    const product = await prisma.product.upsert({
      where: { slug: prodData.slug },
      update: {
        name: prodData.name,
        bengaliName: prodData.bengaliName,
        shortDescription: prodData.shortDescription,
        description: prodData.description,
        price: prodData.price,
        compareAtPrice: prodData.compareAtPrice ?? null,
        status: ProductStatus.ACTIVE,
        stockQuantity: prodData.stockQuantity,
        isFeatured: prodData.isFeatured ?? false,
        indoorOutdoor: prodData.indoorOutdoor,
        lightRequirement: prodData.lightRequirement,
        waterRequirement: prodData.waterRequirement,
        difficulty: prodData.difficulty,
        categoryId,
      },
      create: {
        name: prodData.name,
        bengaliName: prodData.bengaliName,
        slug: prodData.slug,
        sku: prodData.sku,
        shortDescription: prodData.shortDescription,
        description: prodData.description,
        price: prodData.price,
        compareAtPrice: prodData.compareAtPrice ?? null,
        status: ProductStatus.ACTIVE,
        stockQuantity: prodData.stockQuantity,
        isFeatured: prodData.isFeatured ?? false,
        indoorOutdoor: prodData.indoorOutdoor,
        lightRequirement: prodData.lightRequirement,
        waterRequirement: prodData.waterRequirement,
        difficulty: prodData.difficulty,
        categoryId,
      },
    });

    console.log(`- Product: ${product.name} (${product.slug}) under ${prodData.categorySlug}`);
  }

  console.log("\nStorefront Categories and Products seeded successfully!");
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
