"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Droplets,
  Sun,
  Sprout,
  Wind,
  Sparkles,
  Scissors,
  RefreshCw,
  Bug,
  Calendar,
  AlertTriangle,
  Search,
  BookOpen,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Badge } from "@/components/ui/badge";

type CareGuideItem = {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: typeof Droplets;
  summary: string;
  details: string[];
  tips: string[];
};

const careGuides: CareGuideItem[] = [
  {
    id: "watering",
    category: "Watering",
    title: "Watering Best Practices (পানি দেওয়ার নিয়ম)",
    subtitle: "How to water correctly without risking root rot",
    icon: Droplets,
    summary: "গাছে পানি দেওয়ার ক্ষেত্রে সবচেয়ে গুরুত্বপূর্ণ হলো মাটির শুষ্কতা মেপে পানি দেওয়া। অতিরিক্ত পানি ইনডোর গাছ মারা যাওয়ার প্রধান কারণ।",
    details: [
      "মাটির ওপরের ১-২ ইঞ্চি আঙুল দিয়ে চেপে দেখুন। সম্পূর্ণ শুকনা লাগলেই কেবল পানি দিন।",
      "টবের ড্রেনেজ ট্রাইতে জমে থাকা পানি ১০ মিনিটের বেশি রাখবেন না, তা ফেলে দিন।",
      "শীতকালে গাছের পানির চাহিদা গরমকালের তুলনায় অর্ধেক হয়ে যায়।",
    ],
    tips: ["টবের ড্রেনেজ হোল খোলা রাখা জরুরি", "সকালের দিকে গাছে পানি দেওয়া সবচেয়ে উত্তম"],
  },
  {
    id: "light",
    category: "Light",
    title: "Light & Placement (আলো ও অবস্থান)",
    subtitle: "Understanding direct vs indirect sunlight",
    icon: Sun,
    summary: "ইনডোর গাছকে কখনোই কড়া রোদে রাখা উচিত নয়। জানালার কাছে পরোক্ষ আলো বা ব্রাইট ইনডাইরেক্ট লাইট গাছের জন্য সেরা।",
    details: [
      "উজ্জ্বল পরোক্ষ আলো (Bright Indirect Light): জানালার ১-৩ ফুট দূরে যেখানে ঘরের তীব্র আলো আসে।",
      "কম আলো (Low Light): ঘরের ভেতরের কর্নার যেখানে সাধারণ ঘরের আলো থাকে (স্নেক প্ল্যান্ট ও পিস লিলির জন্য উপযুক্ত)।",
      "সরাসরি রোদ (Direct Sun): সকালের ২-৩ ঘণ্টার কড়া রোদ বারান্দার ফলের গাছের জন্য প্রয়োজন।",
    ],
    tips: ["পাতায় কড়া রোদ লাগলে পাতা পুড়ে বাদামী হয়ে যেতে পারে", "সপ্তাহে একবার টব ঘুরিয়ে দিন যেন সবদিকে আলো পায়"],
  },
  {
    id: "soil",
    category: "Soil & Pots",
    title: "Potting Mix & Containers (মাটি ও টব)",
    subtitle: "Healthy roots require aerated well-draining soil",
    icon: Sprout,
    summary: "শুধু সাধারণ এটেল মাটিতে ইনডোর গাছ ভালো বাড়ে না। পানি নিষ্কাশনক্ষম অর্গানিক পটিং মিক্স ব্যবহার করতে হবে।",
    details: [
      "আদর্শ মিশ্রণ: ৪০% বাগানের মাটি, ৩০% নারকেল কোকো পিট, ২০% ভার্মিকম্পোস্ট এবং ১০% পার্লাইট।",
      "টবের আকার: গাছের গোড়ার আকারের চেয়ে ১-২ ইঞ্চি বড় টব ব্যবহার করুন। অতিরিক্ত বড় টব ক্ষতিকর।",
    ],
    tips: ["টবের নিচে পোড়ামাটির চারা বা নুড়িপাথর দিয়ে ড্রেনেজ নিশ্চিত করুন"],
  },
  {
    id: "humidity",
    category: "Humidity & Temp",
    title: "Humidity & Temperature (আর্দ্রতা ও তাপমাত্রা)",
    subtitle: "Maintaining tropical moisture in Bangladesh homes",
    icon: Wind,
    summary: "বাংলাদেশের গ্রীষ্মকালে আর্দ্রতা ভালো থাকলেও এসি চালানো ঘরে ইনডোর গাছের পাতায় শুষ্কতা দেখা দেয়।",
    details: [
      "এসি ঘরের তাপমাত্রা ২০-২৫ ডিগ্রি সেলসিয়াসের মধ্যে রাখুন। গাছের গায়ে সরাসরি এসির বাতাস লাগাবেন না।",
      "পাতায় স্প্রেয়ার দিয়ে দিনে একবার হালকা পানি স্প্রে (Mist) করে দিন।",
      "কয়েকটি গাছ একসাথে রাখলে প্রাকৃতিকভাবে আর্দ্রতা বৃদ্ধি পায়।",
    ],
    tips: ["শীতকালে ফ্যানের নিচে সোজা গাছ রাখবেন না"],
  },
  {
    id: "fertilizing",
    category: "Fertilizing",
    title: "Plant Nutrition (সার ও পুষ্টি উপাদান)",
    subtitle: "Boosting foliage growth and bloom development",
    icon: Sparkles,
    summary: "গাছের বৃদ্ধির মৌসুমে (বসন্ত ও বর্ষাকাল) মাসে একবার জৈব সার বা হালকা তরল সার দেওয়া প্রয়োজন।",
    details: [
      "ভার্মিকম্পোস্ট বা গোবর সার টবের মাটির সাথে মিশিয়ে দিন।",
      "কলা খোসা ভেজানো পানি বা সর্ষের খৈল ভেজানো পানি পাতলা করে দিলে ফুল ও ফল ভালো হয়।",
      "শীতকালে গাছ সুপ্ত অবস্থায় (Dormancy) থাকে, তখন সার দেওয়া বন্ধ রাখুন।",
    ],
    tips: ["শুকনো মাটিতে সার দেবেন না; আগে মাটি সামান্য ভিজিয়ে নিন"],
  },
  {
    id: "pruning",
    category: "Pruning",
    title: "Pruning & Trimming (ছাঁটাই ও আকৃতি গঠন)",
    subtitle: "Removing yellow leaves and encouraging new branches",
    icon: Scissors,
    summary: "মরা বা হলুদ পাতা নিয়মিত কেটে ফেলা গাছের স্বাস্থ্যের জন্য জরুরি। এতে নতুন পাতার সতেজতা বাড়ে।",
    details: [
      "জীবাণুমুক্ত কাঁচি দিয়ে গাছের শুকনা বা হলুদ অংশ কেটে ফেলুন।",
      "লতানো গাছ (যেমন মানি প্ল্যান্ট) অগ্রভাগ ছেঁটে দিলে গাছ বেশি ঝোপালো (Bushy) হয়।",
    ],
    tips: ["কাঁচি কাটার আগে অ্যালকোহল বা স্যাভলন দিয়ে পরিষ্কার করে নিন"],
  },
  {
    id: "repotting",
    category: "Repotting",
    title: "Repotting Step-by-Step (রিপটিং এর নিয়ম)",
    subtitle: "Knowing when and how to change pots safely",
    icon: RefreshCw,
    summary: "গাছের শিকড় টবের ড্রেনেজ হোল দিয়ে বাইরে বেরিয়ে আসলে বা মাটি শক্ত হয়ে গেলে রিপটিং করতে হবে।",
    details: [
      "সাধারণত প্রতি ১-২ বছরে একবার রিপটিং প্রয়োজন হয়।",
      "পুরোনো টব থেকে গাছ বের করার আগে গাছে পানি দিয়ে মাটি নরম করে নিন।",
      "নতুন টবে নতুন পটিং মিক্স দিয়ে গাছ বসিয়ে ২ দিন ছায়ায় রাখুন।",
    ],
    tips: ["রিপটিং এর সাথে সাথে কড়া রোদে রাখবেন না"],
  },
  {
    id: "pest-prevention",
    category: "Pest Control",
    title: "Pest Control & Protection (পোকা দমন ও সুরক্ষা)",
    subtitle: "Natural organic pest treatments for indoor plants",
    icon: Bug,
    summary: "ইনডোর গাছে মিলিবাগ (Mealybug) বা মাকড়সার আক্রমণ প্রতিরোধে নিম তেল স্প্রে অত্যন্ত কার্যকর।",
    details: [
      "১ লিটার পানিতে ১ চা চামচ নিম তেল এবং ২ ফোঁটা ডিশওয়াশিং লিকুইড মিশিয়ে স্প্রে তৈরি করুন।",
      "পাতার নিচের অংশ ভালো করে পরীক্ষা করুন, সেখানে পোকা বেশি থাকে।",
      "আক্রান্ত গাছকে সাময়িকভাবে অন্য গাছ থেকে আলাদা রাখুন।",
    ],
    tips: ["সপ্তাহে একবার পাতার ধুলাবালি মুছে দিলে পোকার আক্রমণ কমে"],
  },
  {
    id: "seasonal-care",
    category: "Seasonal Care",
    title: "Bangladesh Seasonal Care (ঋতুভিত্তিক যত্ন)",
    subtitle: "Adapting plant maintenance across Summer, Monsoon & Winter",
    icon: Calendar,
    summary: "বাংলাদেশে বর্ষাকালে ফাঙ্গাসের ভয় থাকে এবং শীতকালে পানির চাহিদা কমে যায়।",
    details: [
      "বর্ষাকাল: টবে বৃষ্টির পানি বেশি জমতে দেবেন না। ড্রেনেজ হোল পরিষ্কার রাখুন।",
      "শীতকাল: রোদের উপস্থিতি কমে যায়, তাই গাছ জানালার কাছে আনুন এবং পানি কম দিন।",
      "গ্রীষ্মকাল: সকালে হালকা পানি স্প্রে করে পাতার সতেজতা বজায় রাখুন।",
    ],
    tips: ["বর্ষায় ছাদ বা বারান্দার গাছ অতিরিক্ত বৃষ্টিতে পচে যাচ্ছে কিনা খেয়াল রাখুন"],
  },
  {
    id: "common-mistakes",
    category: "Common Mistakes",
    title: "Common Plant Care Mistakes (সাধারণ ভুলসমূহ)",
    subtitle: "Diagnosing yellow leaves, drooping & brown tips",
    icon: AlertTriangle,
    summary: "গাছের পাতায় বিভিন্ন লক্ষণ দেখে সমস্যা শনাক্ত করা সম্ভব।",
    details: [
      "হলুদ পাতা + নরম ডাল = অতিরিক্ত পানি (Overwatering)।",
      "বাদামী ও শুকনা পাতার ডগা = কম আর্দ্রতা বা কম পানি (Underwatering)।",
      "ফ্যাকাশে বা ঝরে পড়া পাতা = আলোর অভাব (Low Light)।",
      "পাতায় সাদা তুলার মতো দাগ = মিলিবাগ পোকার আক্রমণ (Mealybugs)।",
    ],
    tips: ["সমস্যা দেখা দিলে সাথে সাথে রাসায়নিক সার না দিয়ে কারণ বের করুন"],
  },
];

const categoriesList = [
  "All",
  "Watering",
  "Light",
  "Soil & Pots",
  "Humidity & Temp",
  "Fertilizing",
  "Pruning",
  "Repotting",
  "Pest Control",
  "Seasonal Care",
  "Common Mistakes",
];

export function PlantCareView() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openGuideId, setOpenGuideId] = useState<string | null>("watering");

  const filteredGuides = careGuides.filter((guide) => {
    const matchesCategory = selectedCategory === "All" || guide.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.details.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleGuide = (id: string) => {
    setOpenGuideId(openGuideId === id ? null : id);
  };

  return (
    <main className="py-8 sm:py-12">
      <Container>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Plant Care" }]} />

        {/* Hero Banner */}
        <header className="relative mt-6 overflow-hidden rounded-[2.5rem] bg-stone-900 p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300 backdrop-blur-md">
              <BookOpen size={14} /> Comprehensive Knowledge Base
            </div>
            <h1 className="mt-4 text-3xl font-extrabold sm:text-5xl tracking-tight leading-tight">
              Plant Care Guide & Advice
            </h1>
            <p className="mt-4 text-base sm:text-lg text-stone-300 leading-relaxed">
              গাছের সঠিক বেড়ে ওঠার জন্য পানি, আলো, মাটি, সার এবং পোকা দমনের বিস্তারিত ও কার্যকর পরামর্শ পড়ুন।
            </p>
          </div>
        </header>

        {/* Controls: Search & Category Navigation */}
        <section className="mt-8 space-y-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={19} />
            <input
              type="text"
              placeholder="Search care guides, topics, or symptoms (e.g. watering, yellow leaves)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium shadow-sm transition focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  selectedCategory === cat
                    ? "bg-[var(--primary)] text-white shadow-md"
                    : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Care Guides Listing */}
        <section className="mt-8 space-y-4">
          {filteredGuides.length > 0 ? (
            filteredGuides.map((guide) => {
              const IconComp = guide.icon;
              const isOpen = openGuideId === guide.id;

              return (
                <article
                  key={guide.id}
                  className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm transition duration-200 hover:border-stone-300"
                >
                  <button
                    onClick={() => toggleGuide(guide.id)}
                    className="flex w-full items-center justify-between p-6 text-left focus:outline-none"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[var(--primary)]">
                        <IconComp size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-stone-100 text-stone-700 font-semibold text-[10px]">
                            {guide.category}
                          </Badge>
                        </div>
                        <h3 className="mt-1.5 text-xl font-bold text-stone-900">{guide.title}</h3>
                        <p className="text-xs font-medium text-[var(--muted)]">{guide.subtitle}</p>
                      </div>
                    </div>
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 transition-transform duration-200 ${
                        isOpen ? "rotate-180 bg-emerald-100 text-emerald-900" : ""
                      }`}
                    >
                      <ChevronDown size={18} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-stone-100 bg-stone-50/50 p-6 sm:p-8 space-y-6 animate-fadeIn">
                      <p className="text-base text-stone-800 leading-relaxed font-medium">
                        {guide.summary}
                      </p>

                      <div className="space-y-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                          Key Principles & Instructions:
                        </h4>
                        <ul className="space-y-2">
                          {guide.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm text-stone-700 leading-relaxed">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {guide.tips.length > 0 && (
                        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 text-emerald-900">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                            <Sparkles size={14} /> Pro Care Tip
                          </h4>
                          <ul className="mt-2 space-y-1">
                            {guide.tips.map((tip, idx) => (
                              <li key={idx} className="text-xs font-medium leading-relaxed">
                                • {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-12 text-center">
              <p className="text-base font-semibold text-stone-700">No matching care guides found.</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Try adjusting your search or selecting &quot;All&quot; categories.</p>
            </div>
          )}
        </section>

        {/* Need Expert Assistance CTA */}
        <section className="mt-12 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-emerald-950">Have a Specific Plant Emergency?</h3>
            <p className="mt-2 text-sm text-emerald-900/80 max-w-xl">
              গাছের সমস্যা বুঝতে পারছেন না? আমাদের অভিজ্ঞ প্ল্যান্ট বিশেষজ্ঞদের সাথে সরাসরি কথা বলুন বা মেসেজ পাঠান।
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 font-bold text-white shadow-md transition hover:bg-[var(--primary)]/90"
          >
            Contact Plant Experts <ArrowRight size={17} />
          </Link>
        </section>
      </Container>
    </main>
  );
}
