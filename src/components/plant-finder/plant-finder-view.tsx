"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, RotateCcw, Check, Sparkles, ArrowRight, Lightbulb, Compass } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Badge } from "@/components/ui/badge";
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
        // Require non-zero match score if specific filters selected
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
    <main className="py-8 sm:py-12">
      <Container>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Plant Finder" }]} />

        {/* Hero Header */}
        <header className="relative mt-6 overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[var(--primary)] via-[var(--primary)]/95 to-emerald-900 p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-200 backdrop-blur-md">
              <Sparkles size={14} /> Interactive Plant Matcher
            </div>
            <h1 className="mt-4 text-3xl font-extrabold sm:text-5xl tracking-tight">
              Find Your Perfect Plant Match
            </h1>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-emerald-100/90">
              আপনার ঘরের পরিবেশ, আলো, পানি দেওয়ার অভ্যাস ও অভিজ্ঞতা অনুযায়ী সবচেয়ে উপযুক্ত গাছটি খুঁজে নিন।
            </p>
          </div>
        </header>

        {/* Preferences Control Panel */}
        <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
            <div>
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <Compass className="text-[var(--primary)]" size={22} /> Select Your Environment & Preferences
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                Customize your options below to filter matching plants.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border-stone-200 text-stone-700 hover:bg-stone-50"
            >
              <RotateCcw size={16} /> Reset Preferences
            </Button>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Placement */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                Growing Environment
              </label>
              <select
                value={preferences.indoorOutdoor}
                onChange={(e) => setPreferences({ ...preferences, indoorOutdoor: e.target.value })}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-sm font-medium text-stone-800 focus:border-[var(--primary)] focus:bg-white focus:outline-none"
              >
                <option value="ALL">Any Environment</option>
                <option value="Indoor">Indoor Only</option>
                <option value="Outdoor">Outdoor Only</option>
                <option value="Both">Indoor & Outdoor</option>
              </select>
            </div>

            {/* Light */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2 flex items-center gap-1">
                <Lightbulb size={13} /> Light Condition
              </label>
              <select
                value={preferences.lightRequirement}
                onChange={(e) => setPreferences({ ...preferences, lightRequirement: e.target.value })}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-sm font-medium text-stone-800 focus:border-[var(--primary)] focus:bg-white focus:outline-none"
              >
                <option value="ALL">Any Light Level</option>
                <option value="Low light">Low Light (shade)</option>
                <option value="Indirect light">Bright Indirect Light</option>
                <option value="Full to partial sun">Direct Sun / Partial Sun</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                Experience / Care Level
              </label>
              <select
                value={preferences.difficulty}
                onChange={(e) => setPreferences({ ...preferences, difficulty: e.target.value })}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-sm font-medium text-stone-800 focus:border-[var(--primary)] focus:bg-white focus:outline-none"
              >
                <option value="ALL">Any Care Level</option>
                <option value="Easy">Beginner Friendly (Easy)</option>
                <option value="Medium">Moderate (Medium)</option>
                <option value="Hard">Advanced Expert (Hard)</option>
              </select>
            </div>

            {/* Size */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                Plant Size
              </label>
              <select
                value={preferences.plantSize}
                onChange={(e) => setPreferences({ ...preferences, plantSize: e.target.value })}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-sm font-medium text-stone-800 focus:border-[var(--primary)] focus:bg-white focus:outline-none"
              >
                <option value="ALL">Any Size</option>
                <option value="Small">Small (Tabletop)</option>
                <option value="Medium">Medium (Floor/Stand)</option>
                <option value="Large">Large (Feature Tree)</option>
              </select>
            </div>
          </div>

          {/* Keyword Search */}
          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
              <input
                type="text"
                placeholder="Search plant names or features..."
                value={preferences.searchQuery}
                onChange={(e) => setPreferences({ ...preferences, searchQuery: e.target.value })}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pl-10 pr-4 text-sm focus:border-[var(--primary)] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Results Header */}
        <div className="mt-10 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-stone-900">
            Recommended Plants ({matchedProducts.length})
          </h3>
          {matchedProducts.length > 0 && (
            <span className="text-sm font-medium text-[var(--muted)]">
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
                className="group surface flex flex-col overflow-hidden rounded-3xl border border-stone-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-emerald-600 text-white font-semibold text-xs shadow-md">
                      ✓ Match Found
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xl font-bold text-stone-900 group-hover:text-[var(--primary)] transition">
                        {product.name}
                      </h4>
                      <p className="text-sm text-[var(--primary)] font-medium mt-0.5">
                        {product.bengaliName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-stone-900">
                        {formatCurrency(product.salePrice ?? product.regularPrice)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-[var(--muted)] line-clamp-2 leading-relaxed">
                    {product.shortDescription}
                  </p>

                  {/* Match Reasons */}
                  <div className="mt-4 pt-3 border-t border-stone-100 space-y-1.5">
                    {matchReasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                        <Check size={14} className="shrink-0 text-emerald-600" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-500">
                      {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                    </span>
                    <Link
                      href={`/plants/${product.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--primary)] hover:underline"
                    >
                      View Details <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-200/70 text-stone-600">
              <Search size={28} />
            </div>
            <h4 className="mt-4 text-xl font-bold text-stone-900">No Direct Match Found</h4>
            <p className="mt-2 text-sm text-[var(--muted)] max-w-md mx-auto">
              আপনার নির্বাচিত ফিল্টারের সাথে মিলিয়ে কোনো গাছ পাওয়া যায়নি। অনুগ্রহ করে ফিল্টার শিথিল করুন বা সম্পূর্ণ প্রোডাক্ট ক্যাটালগ দেখুন।
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Button onClick={resetFilters} className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90">
                Reset Preferences
              </Button>
              <Link href="/plants">
                <Button variant="outline">Browse All Plants</Button>
              </Link>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
