"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, HeartPulse, Leaf, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/shared/logo";

const trustHighlights = [
  { title: "Healthy Plants Guaranteed", desc: "Hand-picked and nursery-fresh delivery.", Icon: HeartPulse },
  { title: "Safe & Fast Delivery", desc: "Carefully packed eco-friendly boxes across Bangladesh.", Icon: PackageCheck },
  { title: "Plant Care Guidance", desc: "Expert tips for watering, sunlight, and soil.", Icon: ShieldCheck },
];

export function AuthShell({
  children,
  badgeText = "Join Pick Plant Nursery",
  title = "Greener Spaces Start Here",
  subtitle = "Discover healthy indoor and outdoor plants, custom pots, and expert plant care guidance.",
}: {
  children: React.ReactNode;
  badgeText?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col justify-center">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl lg:grid lg:grid-cols-12 min-h-[640px]">
          
          {/* Branded Visual Panel (Desktop Left Column) */}
          <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1e5a3a] via-[#17472d] to-[#0f341f] p-10 text-white lg:col-span-5 lg:flex xl:p-12">
            
            {/* Background SVG Leaf Patterns */}
            <div className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-white/5 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 size-96 rounded-full bg-[var(--accent)]/10 blur-3xl" />
            
            <svg
              className="pointer-events-none absolute right-4 top-1/4 h-64 w-64 text-white/5"
              fill="currentColor"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <path d="M50 0 C70 30 90 40 100 50 C90 60 70 70 50 100 C30 70 10 60 0 50 C10 40 30 30 50 0 Z" />
            </svg>

            {/* Header / Brand Logo */}
            <div className="relative z-10 flex items-center justify-between">
              <Link href="/" className="inline-flex items-center gap-2 text-white hover:opacity-90 transition">
                <span className="grid size-10 place-items-center rounded-xl bg-white/10 border border-white/20 shadow-inner">
                  <Leaf className="size-5 text-[var(--accent)]" />
                </span>
                <span className="text-xl font-bold tracking-tight text-white">Pick Plant</span>
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/20 transition"
              >
                <ArrowLeft size={14} /> Store
              </Link>
            </div>

            {/* Hero Brand Copy & Trust Points */}
            <div className="relative z-10 my-auto py-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/90">
                <Sparkles size={14} className="text-[var(--accent)]" /> {badgeText}
              </span>
              
              <h2 className="mt-5 text-3xl font-bold leading-tight text-white xl:text-4xl">
                {title}
              </h2>
              
              <p className="mt-3 text-sm leading-relaxed text-white/80 xl:text-base">
                {subtitle}
              </p>

              <div className="mt-8 grid gap-4 border-t border-white/15 pt-6">
                {trustHighlights.map(({ title: itemTitle, desc, Icon }) => (
                  <div key={itemTitle} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-white/10 text-[var(--accent)]">
                      <Icon size={16} />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                        {itemTitle}
                      </h3>
                      <p className="text-xs text-white/70">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Footer Badge */}
            <div className="relative z-10 flex items-center gap-2 text-xs text-white/75 border-t border-white/10 pt-4">
              <CheckCircle2 size={16} className="text-[var(--accent)] shrink-0" />
              <span>Trusted by 10,000+ plant lovers across Bangladesh</span>
            </div>
          </div>

          {/* Form Content Panel (Right Column desktop / Full mobile) */}
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-7 lg:p-12">
            
            {/* Mobile Header Logo & Link */}
            <div className="flex items-center justify-between pb-4 lg:hidden">
              <Logo />
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                <ArrowLeft size={14} /> Back to Store
              </Link>
            </div>

            {/* Main Page Child Content */}
            <div className="my-auto w-full max-w-md mx-auto py-2">
              {children}
            </div>

            {/* Form Footer Note */}
            <div className="mt-8 text-center text-xs text-[var(--muted)] border-t border-[var(--border)]/60 pt-4">
              <p>© {new Date().getFullYear()} Pick Plant. Safe & encrypted authentication.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
