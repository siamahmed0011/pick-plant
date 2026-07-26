import { prisma } from "@/lib/prisma";
import type { BlogPostFormInput } from "./blog-validation";

export async function seedInitialBlogPostsIfEmpty() {
  try {
    const count = await prisma.blogPost.count();
    if (count > 0) return;

    const initialPosts = [
      {
        title: "Indoor Plant Care Basics: Light, Water, & Soil for Beginners",
        slug: "indoor-plant-care-basics",
        excerpt: "নতুনদের জন্য ইনডোর গাছের নিয়মিত যত্ন, পানি দেওয়ার নিয়ম ও আলো নিয়ন্ত্রণের সহজ গাইড।",
        content: `
# Indoor Plant Care Basics

ইনডোর গাছ ঘরের বাতাস সতেজ রাখে এবং ঘরের সৌন্দর্য বহুগুণ বাড়িয়ে দেয়। কিন্তু সঠিক পরিচর্যার অভাবে অনেক সময় পাতা হলুদ হয়ে যায় বা গাছ শুকিয়ে যায়। এই গাইডে আমরা ইনডোর গাছের জন্য প্রয়োজনীয় আলো, পানি এবং মাটির সঠিক নিয়ম আলোচনা করব।

## ১. আলোর প্রয়োজনীয়তা (Light Requirements)
সব ইনডোর গাছের আলোর চাহিদা এক নয়। 
- **পরোক্ষ আলো (Indirect Light):** স্নেক প্ল্যান্ট, মানি প্ল্যান্ট ও পিস লিলি পরোক্ষ আলোতে সবচেয়ে ভালো বাড়ে।
- **উজ্জ্বল আলো (Bright Light):** ক্যাকটাস ও সাকুলেন্ট ঘরের জানালার পাশে যেখানে পর্যাপ্ত আলো আসে সেখানে রাখা উচিত।

## ২. সঠিক নিয়মে পানি দেওয়া (Watering Schedule)
গাছ মারা যাওয়ার প্রধান কারণ হলো অতিরিক্ত পানি দেওয়া (Overwatering)।
- পানি দেওয়ার আগে আঙুল দিয়ে মাটির ওপরের ১-২ ইঞ্চি শুকিয়েছে কি না পরীক্ষা করে নিন।
- টবের নিচে যেন পর্যাপ্ত ড্রেনেজ হোল (Drainage Hole) থাকে।

## ৩. সঠিক টব ও মাটি (Soil & Pots)
অরগানিক কম্পোস্ট, নারকেল কোকো পিট এবং পার্লাইট সমৃদ্ধ হালকা মাটি ইনডোর গাছের জন্য আদর্শ।

## শেষ কথা
প্রতি সপ্তাহে অন্তত একদিন গাছের পাতায় জমে থাকা ধূলোবালি ভেজা কাপড় দিয়ে মুছে দিন। এতে গাছ সহজে ছালকসংশ্লেষণ করতে পারে।
        `,
        coverImage: "/images/placeholders/blog.svg",
        category: "Plant Care",
        tags: ["Indoor Plants", "Beginner", "Care Guide"],
        authorName: "Pick Plant Team",
        readingTime: "4 min read",
        isPublished: true,
      },
      {
        title: "Top 7 Air-Purifying Plants for Bangladeshi Homes",
        slug: "air-purifying-plants-bangladesh",
        excerpt: "ঢাকার ইনডোর পরিবেশ সুস্থ রাখতে বাতাস বিশুদ্ধকারী সেরা ৭টি গাছের তালিকা ও সুবিধা।",
        content: `
# Top 7 Air-Purifying Plants for Bangladeshi Homes

শহরাঞ্চলের ইনডোর বাতাসে বিভিন্ন ক্ষতিকর উপাদান ও ধূলোবালি থাকে। আমেরিকান মহাকাশ গবেষণা সংস্থা (NASA)-এর স্টাডি অনুযায়ী কিছু গাছ প্রাকৃতিক এয়ার পিউরিফায়ার হিসেবে চমৎকার কাজ করে।

## ১. Snake Plant (স্নেক প্ল্যান্ট)
নাইট-টাইম অক্সিজেন রিলিজ করে এবং বেনজিন ও ফরমালডিহাইড শোষণ করে।

## ২. Areca Palm (এরিকা পাম)
ঘরের আর্দ্রতা বাড়াতে সাহায্য করে এবং ঘরের বিষাক্ত বাষ্প দূর করে।

## ৩. Money Plant (মানি প্ল্যান্ট)
সহজ পরিচর্যা এবং অল্প আলোতেই বেঁচে থাকে।

## ৪. Peace Lily (পিস লিলি)
বাতাস থেকে ক্ষতিকর ছত্রাক ও কেমিক্যাল দূর করতে কার্যকর।

## ৫. Spider Plant (স্পাইডার প্ল্যান্ট)
শিশু ও পোষা প্রাণীর জন্য নিরাপদ বাতাস বিশুদ্ধকারী গাছ।

## ৬. Boston Fern (বোস্টন ফার্ন)
উচ্চ আর্দ্রতা বজায় রাখে।

## ৭. Rubber Plant (রাবার প্ল্যান্ট)
বড় ও চকচকে পাতা যা ঘরের ধূলোবালি শোষণ করে।
        `,
        coverImage: "/images/placeholders/blog.svg",
        category: "Air Purifying",
        tags: ["Air Purifying", "Healthy Home", "Top Plants"],
        authorName: "Pick Plant Team",
        readingTime: "5 min read",
        isPublished: true,
      },
      {
        title: "How to Avoid Overwatering Your Houseplants",
        slug: "avoid-overwatering-houseplants",
        excerpt: "টবে অতিরিক্ত পানি দেওয়ার লক্ষণ ও গাছের শিকড় পচা বন্ধ করার কার্যকারী উপায়।",
        content: `
# How to Avoid Overwatering Your Houseplants

অনেকে গাছে অতিরিক্ত ভালোবাসা দেখাতে গিয়ে বেশি পানি দিয়ে ফেলেন। এর ফলে টবের মাটিতে অক্সিজেন কমে যায় এবং শিকড় পচে (Root Rot) গাছ মারা যায়।

## অতিরিক্ত পানি দেওয়ার প্রধান লক্ষণসমূহ:
১. পাতা হলুদ হয়ে ঝরে পড়া।  
২. পাতা নরম ও ভেজা অনুভব হওয়া।  
৩. টবের মাটি থেকে দুর্গন্ধ ছড়ানো।  
৪. পাতায় কালো বা বাদামী দাগ দেখা দেওয়া।  

## প্রতিকার ও সমাধানের উপায়:
- টবের মাটি সম্পূর্ণ না শুকানো পর্যন্ত আর পানি দেবেন না।  
- টবের নিচে ড্রেনেজ হোল নিশ্চিত করুন।  
- ড্রেনেজ ট্রেতে জমে থাকা পানি প্রতিবার ঢেলে ফেলে দিন।  
        `,
        coverImage: "/images/placeholders/blog.svg",
        category: "Troubleshooting",
        tags: ["Watering", "Root Rot", "Plant Health"],
        authorName: "Pick Plant Team",
        readingTime: "3 min read",
        isPublished: true,
      },
      {
        title: "Balcony Gardening Guide for Apartment Owners",
        slug: "balcony-gardening-guide",
        excerpt: "ছোট বারান্দায় ফলনশীল ও সুন্দর বাগান গড়ে তোলার সহজ পরামর্শ ও নকশা।",
        content: `
# Balcony Gardening Guide for Apartment Owners

অ্যাপার্টমেন্টের ছোট বারান্দাকেও গড়ে তোলা যায় সবুজে ঘেরা একটি সুন্দর বাগানে। 

## ১. বারান্দার আলো মেপে নিন
- পূর্বমুখী বারান্দায় সকালের মিষ্টি রোদ আসে—এখানে ফলের গাছ ও গোলাপ ভালো হয়।
- উত্তর বা পশ্চিমমুখী বারান্দায় ইনডোর ও শেড-লাভিং গাছ ভালো থাকে।

## ২. গ্রিল ও দেয়াল ব্যবহার করুন
ভার্টিক্যাল গার্ডেনিং এবং ঝুলন্ত টব ব্যবহার করলে জায়গার সঠিক ব্যবহার হয়।

## ৩. সঠিক টব নির্বাচন
ওজন কমাতে লাইটওয়েট প্লাস্টিক বা ফাইবার টব ব্যবহার করা ভালো।
        `,
        coverImage: "/images/placeholders/blog.svg",
        category: "Balcony Garden",
        tags: ["Balcony", "Urban Gardening", "Design"],
        authorName: "Pick Plant Team",
        readingTime: "6 min read",
        isPublished: true,
      },
    ];

    for (const post of initialPosts) {
      await prisma.blogPost.create({ data: post });
    }
  } catch (error) {
    console.error("Error seeding initial blog posts:", error);
  }
}

export async function getPublishedBlogPosts(search?: string, category?: string) {
  await seedInitialBlogPostsIfEmpty();

  const where: Record<string, unknown> = { isPublished: true };

  if (category && category !== "All") {
    where.category = category;
  }

  if (search && search.trim()) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { excerpt: { contains: search.trim(), mode: "insensitive" } },
      { tags: { has: search.trim() } },
    ];
  }

  return prisma.blogPost.findMany({
    where,
    orderBy: { publishedAt: "desc" },
  });
}

export async function getBlogPostBySlug(slug: string) {
  await seedInitialBlogPostsIfEmpty();

  return prisma.blogPost.findFirst({
    where: {
      slug,
      isPublished: true,
    },
  });
}

export async function getRelatedBlogPosts(currentId: string, category: string) {
  return prisma.blogPost.findMany({
    where: {
      isPublished: true,
      id: { not: currentId },
      category,
    },
    take: 3,
    orderBy: { publishedAt: "desc" },
  });
}

export async function getAdminBlogPosts() {
  return prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminBlogPostById(id: string) {
  return prisma.blogPost.findUnique({
    where: { id },
  });
}

export async function createBlogPost(data: BlogPostFormInput) {
  return prisma.blogPost.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      coverImage: data.coverImage || "/images/placeholders/blog.svg",
      category: data.category,
      tags: data.tags,
      authorName: data.authorName,
      readingTime: data.readingTime,
      isPublished: data.isPublished,
    },
  });
}

export async function updateBlogPost(id: string, data: BlogPostFormInput) {
  return prisma.blogPost.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      coverImage: data.coverImage || "/images/placeholders/blog.svg",
      category: data.category,
      tags: data.tags,
      authorName: data.authorName,
      readingTime: data.readingTime,
      isPublished: data.isPublished,
    },
  });
}

export async function deleteBlogPost(id: string) {
  return prisma.blogPost.delete({
    where: { id },
  });
}
