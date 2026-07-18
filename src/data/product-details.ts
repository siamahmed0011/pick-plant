export type ProductTab = "Description" | "Plant Care" | "Delivery" | "Reviews" | "FAQ";
export const detailContent = {
  description:
    "এই গাছটি ঘর ও বারান্দায় সতেজ সবুজের আবহ তৈরি করে। সঠিক আলো, পরিমিত পানি এবং ঝরঝরে মাটিতে এটি সহজেই সুস্থ থাকে। নতুন গাছপ্রেমীদের জন্যও এটি একটি নির্ভরযোগ্য পছন্দ।",
  soil: "ঝরঝরে, পানি নিষ্কাশনযোগ্য পটিং মাটি ব্যবহার করুন।",
  fertilizer: "বৃদ্ধির সময়ে মাসে একবার হালকা তরল সার দিতে পারেন।",
  repotting: "শিকড় টব ভরে গেলে এক সাইজ বড় টবে বদলান।",
  issues: "পাতা হলুদ হলে অতিরিক্ত পানি এবং পাতা ঝুলে গেলে মাটির আর্দ্রতা পরীক্ষা করুন।",
} as const;
export const faqs = [
  {
    question: "How often should I water this plant?",
    answer: "মাটির উপরিভাগ শুকিয়ে গেলে অল্প পানি দিন।",
  },
  {
    question: "Can it live in low light?",
    answer: "উজ্জ্বল পরোক্ষ আলো সবচেয়ে ভালো; কিছু জাত কম আলোও সহ্য করে।",
  },
  {
    question: "Is a pot included?",
    answer: "ডিফল্টভাবে nursery pot থাকে; pot option থেকে আলাদা পছন্দ করা যাবে।",
  },
  {
    question: "How is the plant packed?",
    answer: "গাছের মাটি ও ডাল নিরাপদভাবে সুরক্ষিত করে প্যাক করা হয়।",
  },
];
export const reviews = [
  {
    name: "সাদিয়া রহমান",
    location: "ঢাকা",
    rating: 5,
    text: "গাছটি সতেজ অবস্থায় পেয়েছি এবং পরিচর্যার নির্দেশনাও সহজ ছিল।",
  },
  {
    name: "আরিফ হাসান",
    location: "চট্টগ্রাম",
    rating: 5,
    text: "প্যাকেজিং সুন্দর, গাছটি আমার বারান্দায় ভালো মানিয়ে গেছে।",
  },
  {
    name: "মেহজাবিন ইসলাম",
    location: "সিলেট",
    rating: 4,
    text: "সহজে যত্ন নেওয়া যায় এমন সুন্দর একটি গাছ।",
  },
];
