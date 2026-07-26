import Link from "next/link";
import {
  Stethoscope,
  Layout,
  Sun,
  RefreshCw,
  CalendarCheck,
  Building2,
  Gift,
  Check,
  Tag,
  ArrowRight,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Badge } from "@/components/ui/badge";

type ServiceItem = {
  id: string;
  title: string;
  bengaliTitle: string;
  icon: typeof Stethoscope;
  description: string;
  includes: string[];
  startingPrice: string;
  duration: string;
  inquirySubject: string;
};

const servicesList: ServiceItem[] = [
  {
    id: "consultation",
    title: "Plant Consultation & Health Check",
    bengaliTitle: "প্ল্যান্ট কনসালটেশন ও স্বাস্থ্য পরীক্ষা",
    icon: Stethoscope,
    description: "আপনার ঘরের বা বাগানের অসুস্থ গাছের রুট পচাগোড়া বা রোগবালাই শনাক্ত করে সঠিক প্রতিকার ও পরিচর্যার পরিকল্পনা প্রদান।",
    includes: [
      "সরাসরি অন-সাইট বা ভিডিও কলে গাছ পরিদর্শন",
      "মাটির পিএইচ (pH) ও আর্দ্রতা পরীক্ষা",
      "রোগবালাই ও পোকা শনাক্তকরণ",
      "ব্যক্তিগতকৃত পরিচর্যার গাইডলাইন ও অর্গানিক স্প্রে প্রেসক্রিপশন",
    ],
    startingPrice: "BDT 500",
    duration: "45–60 mins",
    inquirySubject: "Plant Consultation Inquiry",
  },
  {
    id: "indoor-setup",
    title: "Indoor Plant Setup & Styling",
    bengaliTitle: "ইনডোর গাছ সাজানো ও স্টাইলিং",
    icon: Layout,
    description: "আপনার বসার ঘর, শোবার ঘর বা স্টাডি রুমের আলো ও বায়ুপ্রবাহ অনুযায়ী নান্দনিক গাছের ইনডোর ডেকোরেশন।",
    includes: [
      "রুমের আলো ও তাপমাত্রা মেপে গাছ নির্বাচন",
      "ম্যাচিং টব ও স্ট্যান্ড সংস্থান",
      "গাছের পজিশনিং ও ডেকোরেশন",
      "প্রাথমিক সার ও কেয়ার কিট প্রদান",
    ],
    startingPrice: "BDT 1,500",
    duration: "Half Day",
    inquirySubject: "Indoor Plant Setup Inquiry",
  },
  {
    id: "balcony-garden",
    title: "Balcony Garden Design & Setup",
    bengaliTitle: "বারান্দা বাগান ডিজাইন ও তৈরি",
    icon: Sun,
    description: "অ্যাপার্টমেন্টের ছোট বা বড় বারান্দায় পর্যাপ্ত আলো ও বাতাস কাজে লাগিয়ে ফল, ফুল ও ইনডোর গাছের বাগান তৈরি।",
    includes: [
      "বারান্দার স্পেস ও ওজনের উপযোগী ডিজাইন প্ল্যান",
      "ভার্টিক্যাল গার্ডেনিং ও গ্রিল হ্যাঙ্গার সেটআপ",
      "হালকা ও টেকসই টব ও অর্গানিক পটিং মিক্স সরবরাহ",
      "গাছের পরিচর্যা ডেমোস্ট্রেসণ",
    ],
    startingPrice: "BDT 3,000",
    duration: "1–2 Days",
    inquirySubject: "Balcony Garden Setup Inquiry",
  },
  {
    id: "repotting",
    title: "Plant Repotting & Soil Refresh",
    bengaliTitle: "গাছ রিপটিং ও মাটি পরিবর্তন",
    icon: RefreshCw,
    description: "বেড়ে ওঠা বড় গাছের জন্য নতুন টব পরিবর্তন, শিকড় ছাঁটাই এবং পুষ্টিকর নতুন অর্গানিক মাটি সরবরাহ।",
    includes: [
      "পুরাতন শক্ত মাটি থেকে নিরাপদে গাছ তোলা",
      "প্যাকেজড নিউট্রিয়েন্ট-রিচ পটিং মিক্স ব্যবহার",
      "পয়জন ও ফাঙ্গাস প্রতিরোধক পাউডার প্রয়োগ",
      "টবের নতুন ড্রেনেজ হোল তৈরি ও ক্লিনিং",
    ],
    startingPrice: "BDT 300 / plant",
    duration: "1–3 hours",
    inquirySubject: "Plant Repotting Inquiry",
  },
  {
    id: "monthly-maintenance",
    title: "Monthly Plant Maintenance & Care",
    bengaliTitle: "মাসিক গাছ পরিচর্যা সেবা",
    icon: CalendarCheck,
    description: "বাসাবাড়ির বাগানের দীর্ঘমেয়াদী যত্ন। অভিজ্ঞ মালী দ্বারা প্রতি মাসে নিয়মিত পরিচর্যা ও পুষ্টি প্রদান।",
    includes: [
      "মাসে ২-৪ দিন অভিজ্ঞ মালী পরিদর্শন",
      "মাটি কোপানো, পাতা ছাঁটাই ও পরিষ্কার করা",
      "নিয়মিত জৈব সার ও নিম তেল প্রয়োগ",
      "গাছের স্থায়িত্ব নিশ্চিত করা",
    ],
    startingPrice: "BDT 2,500 / month",
    duration: "Ongoing",
    inquirySubject: "Monthly Plant Maintenance Inquiry",
  },
  {
    id: "corporate-care",
    title: "Corporate & Office Plant Care",
    bengaliTitle: "কর্পোরেট ও অফিস গ্রীন সার্ভিস",
    icon: Building2,
    description: "অফিস, রেস্তোরাঁ ও বাণিজ্যিক স্থানের জন্য সতেজ বাতাস বিশুদ্ধকারী ইনডোর প্ল্যান্টেশন ও প্রফেশনাল মেইনটেন্যান্স।",
    includes: [
      "অফিসের ইন্টেরিয়র অনুযায়ী লার্জ এয়ার-পিউরিফায়ার প্ল্যান্টস",
      "লবি, কনফারেন্স রুম ও ডেস্কে নান্দনিক গাছ স্থাপন",
      "সাপ্তাহিক প্রফেশনাল কেয়ার সার্ভিস",
      "সহজ ইনভয়েসিং ও প্রাতিষ্ঠানিক সাপোর্ট",
    ],
    startingPrice: "Contact for Quote",
    duration: "Custom Contract",
    inquirySubject: "Corporate Plant Service Inquiry",
  },
  {
    id: "gift-arrangements",
    title: "Gift Plant Arrangements & Bulk Orders",
    bengaliTitle: "উপহারের গাছ ও বাল্ক অর্ডার",
    icon: Gift,
    description: "জন্মদিন, বিবাহ বা কর্পোরেট ইভেন্টে দেওয়ার জন্য সুন্দর কাস্টম টব ও গ্রিটিং কার্ডসহ পরিবেশবান্ধব উপহার গাছ।",
    includes: [
      "কাস্টমাইজড ব্র্যান্ডিং বা পার্সোনালাইজড মেসেজ ট্যাগ",
      "সুন্দর ইকো-ফ্রেন্ডলি প্যাকেজিং",
      "স্থানভেদে ডোরস্টেপ স্পেশাল ডেলিভারি",
      "বাল্ক অর্ডারে বিশেষ ছাড়",
    ],
    startingPrice: "BDT 800",
    duration: "Per Order",
    inquirySubject: "Gift Plant Arrangement Inquiry",
  },
];

export function ServicesView() {
  return (
    <main className="py-8 sm:py-12">
      <Container>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Services" }]} />

        {/* Hero Header */}
        <header className="relative mt-6 overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[var(--primary)] to-emerald-950 p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-200 backdrop-blur-md">
              Professional Plant Services
            </div>
            <h1 className="mt-4 text-3xl font-extrabold sm:text-5xl tracking-tight">
              Expert Gardening & Care Services
            </h1>
            <p className="mt-4 text-base sm:text-lg text-emerald-100/90 leading-relaxed">
              আপনার বাসা, বারান্দা বা অফিসে গাছের স্বাস্থ্য রক্ষা, নতুন বাগান তৈরি এবং প্রফেশনাল পরিচর্যার জন্য আমাদের সেবা নিন।
            </p>
          </div>
        </header>

        {/* Services Grid */}
        <section className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {servicesList.map((service) => {
            const IconComp = service.icon;

            return (
              <div
                key={service.id}
                className="group surface flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-300"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition duration-300">
                      <IconComp size={28} />
                    </div>
                    <Badge className="bg-stone-100 text-stone-700 font-semibold text-xs border border-stone-200">
                      {service.duration}
                    </Badge>
                  </div>

                  <h3 className="mt-6 text-2xl font-bold text-stone-900 leading-snug">
                    {service.title}
                  </h3>
                  <p className="text-sm font-semibold text-[var(--primary)] mt-1">
                    {service.bengaliTitle}
                  </p>
                  <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                    {service.description}
                  </p>

                  <div className="mt-6 pt-5 border-t border-stone-100 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                      What&apos;s Included:
                    </h4>
                    {service.includes.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-medium text-stone-700">
                        <Check size={15} className="shrink-0 text-emerald-600 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-medium">
                      <Tag size={14} className="text-emerald-700" />
                      <span>Pricing</span>
                    </div>
                    <span className="text-lg font-bold text-stone-900">
                      {service.startingPrice}
                    </span>
                  </div>

                  <Link
                    href={`/contact?inquiryType=Service+Inquiry&subject=${encodeURIComponent(
                      service.inquirySubject
                    )}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[var(--primary)] shadow-sm"
                  >
                    Inquire For Service <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </section>

        {/* Custom Project CTA */}
        <section className="mt-14 rounded-3xl border border-stone-200 bg-white p-8 sm:p-12 shadow-sm text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-bold text-stone-900">
              Need a Custom Landscaping or Office Solution?
            </h3>
            <p className="mt-3 text-sm sm:text-base text-[var(--muted)] leading-relaxed">
              বিশেষ কোনো প্রকল্প বা বড় পরিসরে বাগান তৈরির পরিকল্পনা থাকলে সরাসরি আমাদের কাস্টম সাপোর্ট টিমের সাথে কথা বলুন।
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                href="/contact?inquiryType=Custom+Project"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[var(--primary)]/90"
              >
                Request Custom Quote <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
