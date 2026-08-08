"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, RotateCcw, Check, Sparkles, ArrowRight, Lightbulb, Compass } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import type { Product } from "@/types";

type PreferenceState = {
  indoorOutdoor: string;
  lightRequirement: string;
  difficulty: string;
  plantSize: string;
  searchQuery: string;
};

const defaultPreferences: PreferenceState = {
  indoorOutdoor: "ALL",
  lightRequirement: "ALL",
  difficulty: "ALL",
  plantSize: "ALL",
  searchQuery: "",
};

export function PlantFinderView({ products }: { products: Product[] }) {
  const [preferences, setPreferences] = useState<PreferenceState>(defaultPreferences);

  const matchedProducts = useMemo(() => {
    return products
      .map((product) => {
        let score = 0;
        const matchReasons: string[] = [];

        // Indoor/Outdoor match
        if (preferences.indoorOutdoor !== "ALL") {
          const pref = preferences.indoorOutdoor.toLowerCase();
          const prod = (product.indoorOutdoor || "Indoor").toLowerCase();
          if (prod === pref || prod === "both" || pref === "both") {
            score += 30;
            matchReasons.push(`Suitable for ${product.indoorOutdoor ?? "Indoor"} space`);
          }
        } else {
          score += 20;
        }

        // Light requirement match
        if (preferences.lightRequirement !== "ALL") {
          const pref = preferences.lightRequirement.toLowerCase();
          const prod = (product.lightRequirement || "").toLowerCase();
          if (prod.includes(pref) || pref.includes(prod)) {
            score += 30;
            matchReasons.push(`Matches ${product.lightRequirement} preference`);
          }
        } else {
          score += 20;
        }

        // Difficulty match
        if (preferences.difficulty !== "ALL") {
          if (product.difficulty === preferences.difficulty) {
            score += 25;
            matchReasons.push(`${product.difficulty} maintenance level`);
          }
        } else {
          score += 15;
        }

        // Plant Size match
        if (preferences.plantSize !== "ALL") {
          if (product.plantSize === preferences.plantSize) {
            score += 15;
            matchReasons.push(`${product.plantSize} size plant`);
          }
        } else {
          score += 10;
        }

        // Search query filter
        if (preferences.searchQuery.trim()) {
          const query = preferences.searchQuery.toLowerCase();
          const matchesText =
            product.name.toLowerCase().includes(query) ||
            product.bengaliName.toLowerCase().includes(query) ||
            product.shortDescription.toLowerCase().includes(query);
          if (!matchesText) score = 0;
        }

        return { product, score, matchReasons };
      })
      .filter((item) => {
        if (preferences.searchQuery.trim() && item.score === 0) return false;
        const hasSpecificFilter =
          preferences.indoorOutdoor !== "ALL" ||
          preferences.lightRequirement !== "ALL" ||
          preferences.difficulty !== "ALL" ||
          preferences.plantSize !== "ALL";
        return !hasSpecificFilter || item.matchReasons.length > 0;
      })
      .sort((a, b) => b.score - a.score);
  }, [products, preferences]);

  const resetFilters = () => setPreferences(defaultPreferences);

  return (
    <main className="py-6 sm:py-8 lg:py-10 bg-[#F7F8F5] min-h-[calc(100vh-14rem)]">
      <Container>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Plant Finder" }]} />

        {/* Hero Header */}
        <header
          className="relative mt-6 overflow-hidden rounded-[24px] p-8 sm:p-12 text-white shadow-[0_12px_40px_rgba(15,77,52,0.12)]"
          style={{ background: "linear-gradient(110deg, #1E5A3A 0%, #176044 48%, #0A4A36 100%)" }}
        >
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 border border-white/18 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#B8F0D2] backdrop-blur-md">
              <Sparkles size={14} className="text-[#B8F0D2]" /> Interactive Plant Matcher
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl tracking-tight text-white">
              Find Your Perfect Plant Match
            </h1>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-[#DDEBE2]">
              আপনার ঘরের পরিবেশ, আলো, পানি দেওয়ার অভ্যাস ও অভিজ্ঞতা অনুযায়ী সবচেয়ে উপযুক্ত গাছটি খুঁজে নিন।
            </p>
          </div>
        </header>

        {/* Preferences Control Panel */}
        <section className="mt-8 rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-6 sm:p-8 shadow-[0_4px_16px_rgba(31,45,34,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE7DD] pb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2D22] flex items-center gap-2">
                <Compass className="text-[#1E5A3A]" size={22} /> Select Your Environment & Preferences
              </h2>
              <p className="text-xs sm:text-sm text-[#66746A] mt-1">
                Customize your options below to filter matching plants.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 self-start sm:self-auto rounded-[14px] border-[#DDE7DD] bg-[#FFFFFF] text-[#1F2D22] hover:bg-[#EEF5F0] transition font-semibold text-xs sm:text-sm h-10"
            >
              <RotateCcw size={15} className="text-[#66746A]" /> Reset Preferences
            </Button>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Placement */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#66746A] mb-2">
                Growing Environment
              </label>
              <select
                value={preferences.indoorOutdoor}
                onChange={(e) => setPreferences({ ...preferences, indoorOutdoor: e.target.value })}
                className="w-full rounded-[14px] border border-[#DDE7DD] bg-[#FFFFFF] p-3 text-sm font-medium text-[#1F2D22] focus:border-[#1E5A3A] focus:ring-2 focus:ring-[#1E5A3A]/15 focus:outline-none transition"
              >
                <option value="ALL">Any Environment</option>
                <option value="Indoor">Indoor Only</option>
                <option value="Outdoor">Outdoor Only</option>
                <option value="Both">Indoor & Outdoor</option>
              </select>
            </div>

            {/* Light */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#66746A] mb-2 flex items-center gap-1">
                <Lightbulb size={13} className="text-[#1E5A3A]" /> Light Condition
              </label>
              <select
                value={preferences.lightRequirement}
                onChange={(e) => setPreferences({ ...preferences, lightRequirement: e.target.value })}
                className="w-full rounded-[14px] border border-[#DDE7DD] bg-[#FFFFFF] p-3 text-sm font-medium text-[#1F2D22] focus:border-[#1E5A3A] focus:ring-2 focus:ring-[#1E5A3A]/15 focus:outline-none transition"
              >
                <option value="ALL">Any Light Level</option>
                <option value="Low light">Low Light (shade)</option>
                <option value="Indirect light">Bright Indirect Light</option>
                <option value="Full to partial sun">Direct Sun / Partial Sun</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#66746A] mb-2">
                Experience / Care Level
              </label>
              <select
                value={preferences.difficulty}
                onChange={(e) => setPreferences({ ...preferences, difficulty: e.target.value })}
                className="w-full rounded-[14px] border border-[#DDE7DD] bg-[#FFFFFF] p-3 text-sm font-medium text-[#1F2D22] focus:border-[#1E5A3A] focus:ring-2 focus:ring-[#1E5A3A]/15 focus:outline-none transition"
              >
                <option value="ALL">Any Care Level</option>
                <option value="Easy">Beginner Friendly (Easy)</option>
                <option value="Medium">Moderate (Medium)</option>
                <option value="Hard">Advanced Expert (Hard)</option>
              </select>
            </div>

            {/* Size */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#66746A] mb-2">
                Plant Size
              </label>
              <select
                value={preferences.plantSize}
                onChange={(e) => setPreferences({ ...preferences, plantSize: e.target.value })}
                className="w-full rounded-[14px] border border-[#DDE7DD] bg-[#FFFFFF] p-3 text-sm font-medium text-[#1F2D22] focus:border-[#1E5A3A] focus:ring-2 focus:ring-[#1E5A3A]/15 focus:outline-none transition"
              >
                <option value="ALL">Any Size</option>
                <option value="Small">Small (Tabletop)</option>
                <option value="Medium">Medium (Floor/Stand)</option>
                <option value="Large">Large (Feature Tree)</option>
              </select>
            </div>
          </div>

          {/* Keyword Search */}
          <div className="mt-6 pt-4 border-t border-[#DDE7DD] flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A877F]" size={17} />
              <input
                type="text"
                placeholder="Search plant names or features..."
                value={preferences.searchQuery}
                onChange={(e) => setPreferences({ ...preferences, searchQuery: e.target.value })}
                className="w-full rounded-[14px] border border-[#DDE7DD] bg-[#FFFFFF] py-2.5 pl-10 pr-4 text-sm font-medium text-[#1F2D22] placeholder:text-[#7A877F] focus:border-[#1E5A3A] focus:ring-2 focus:ring-[#1E5A3A]/15 focus:outline-none transition"
              />
            </div>
          </div>
        </section>

        {/* Results Header */}
        <div className="mt-10 flex items-center justify-between">
          <h3 className="text-xl sm:text-2xl font-bold text-[#1F2D22]">
            Recommended Plants ({matchedProducts.length})
          </h3>
          {matchedProducts.length > 0 && (
            <span className="text-xs sm:text-sm font-medium text-[#66746A]">
              Showing top matches based on your criteria
            </span>
          )}
        </div>

        {/* Results Grid */}
        {matchedProducts.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matchedProducts.map(({ product, matchReasons }) => (
              <div
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] transition-all duration-300 hover:-translate-y-1 shadow-[0_4px_16px_rgba(31,45,34,0.04)]"
              >
                <div className="relative aspect-[4/3] bg-[#EEF5F0] overflow-hidden border-b border-[#DDE7DD]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF5EE] px-2.5 py-1 text-[11px] font-bold text-[#1E5A3A] border border-[#DDE7DD] shadow-xs">
                      ✓ Match Found
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-lg font-bold text-[#1F2D22] group-hover:text-[#1E5A3A] transition">
                        {product.name}
                      </h4>
                      <p className="text-xs font-semibold text-[#1E5A3A] mt-0.5">
                        {product.bengaliName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-bold text-[#1F2D22]">
                        {formatCurrency(product.salePrice ?? product.regularPrice)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs sm:text-sm text-[#66746A] line-clamp-2 leading-relaxed">
                    {product.shortDescription}
                  </p>

                  {/* Match Reasons */}
                  <div className="mt-4 pt-3 border-t border-[#DDE7DD] space-y-1.5">
                    {matchReasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs font-medium text-emerald-900">
                        <Check size={14} className="shrink-0 text-[#1E5A3A]" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#DDE7DD] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#7A877F]">
                      {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                    </span>
                    <Link
                      href={`/plants/${product.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#1E5A3A] hover:underline"
                    >
                      View Details <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[18px] border border-dashed border-[#DDE7DD] bg-[#FFFFFF] p-8 sm:p-12 text-center shadow-[0_4px_16px_rgba(31,45,34,0.04)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF5F0] text-[#1E5A3A] border border-[#DDE7DD]">
              <Search size={26} />
            </div>
            <h4 className="mt-4 text-lg font-bold text-[#1F2D22]">No Direct Match Found</h4>
            <p className="mt-2 text-xs sm:text-sm text-[#66746A] max-w-md mx-auto leading-relaxed">
              আপনার নির্বাচিত ফিল্টারের সাথে মিলিয়ে কোনো গাছ পাওয়া যায়নি। অনুগ্রহ করে ফিল্টার শিথিল করুন বা সম্পূর্ণ প্রোডাক্ট ক্যাটালগ দেখুন।
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={resetFilters} className="h-10 rounded-[14px] bg-[#1E5A3A] text-white font-semibold text-xs sm:text-sm hover:bg-[#17482F]">
                Reset Preferences
              </Button>
              <Link href="/plants">
                <Button variant="outline" className="h-10 rounded-[14px] border-[#DDE7DD] bg-[#FFFFFF] text-[#1F2D22] font-semibold text-xs sm:text-sm hover:bg-[#EEF5F0]">
                  Browse All Plants
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
