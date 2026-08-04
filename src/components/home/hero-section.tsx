"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, HeartPulse, Leaf, PackageCheck, ShieldCheck, UserCheck, UserPlus } from "lucide-react";
import { useSession } from "next-auth/react";
import { Container } from "@/components/shared/container";

const trustItems = [
  { label: "Healthy Plants", Icon: HeartPulse },
  { label: "Safe Delivery", Icon: PackageCheck },
  { label: "Care Support", Icon: ShieldCheck },
];

export function HeroSection() {
  const sessionContext = useSession();
  const session = sessionContext?.data;
  const user = session?.user;

  return (
    <section className="overflow-hidden py-8 sm:py-12 lg:py-16">
      <Container>
        <div className="relative grid overflow-hidden rounded-[var(--radius)] bg-[var(--primary)] shadow-[0_24px_70px_rgb(30_90_58_/_0.18)] lg:grid-cols-[1.08fr_.92fr]">
          <div className="relative z-10 px-6 py-12 text-white sm:px-10 lg:px-14 lg:py-20">
            
            {/* Top Badge with Tasteful Guest vs Authenticated Context */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium">
                <Leaf size={16} /> Thoughtfully grown in Bangladesh
              </span>

              {!user && (
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/20 px-3 py-1 text-xs font-semibold text-white hover:bg-[var(--accent)]/30 transition"
                >
                  <UserPlus size={13} /> Member Perks & Wishlist
                </Link>
              )}
            </div>

            <h1 className="mt-6 max-w-xl text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
              Bring Nature Closer
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-white/80 sm:text-lg">
              {
                "আপনার ঘর, বারান্দা, অফিস কিংবা বাগানের জন্য খুঁজে নিন স্বাস্থ্যবান গাছ, সুন্দর টব এবং প্রয়োজনীয় গার্ডেনিং উপকরণ।"
              }
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-[var(--primary)] transition hover:-translate-y-0.5 shadow-md"
                href="/plants"
              >
                Shop Plants <ArrowRight size={18} />
              </Link>

              <Link
                className="inline-flex h-12 items-center rounded-xl border border-white/35 px-6 font-semibold transition hover:bg-white/10"
                href="/plant-finder"
              >
                Find My Plant
              </Link>

              {/* Guest Account CTA in Hero Section */}
              {!user ? (
                <Link
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 font-semibold text-white transition hover:bg-[#c47c3a] shadow-sm"
                  href="/login"
                >
                  <UserPlus size={18} /> Sign in
                </Link>
              ) : (
                <Link
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 font-semibold text-white transition hover:bg-white/20"
                  href="/account"
                >
                  <UserCheck size={18} /> Account Dashboard
                </Link>
              )}
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3 border-t border-white/15 pt-6">
              {trustItems.map(({ label, Icon }) => (
                <div
                  className="flex flex-col gap-2 text-xs text-white/80 sm:flex-row sm:items-center sm:text-sm"
                  key={label}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-80 bg-[var(--secondary)] lg:min-h-full">
            <div className="absolute -right-16 -top-16 size-72 rounded-full border-[40px] border-white/15" />
            <div className="absolute inset-8 rounded-full bg-white/20" />
            <Image
              src="/images/brand/hero-nursery.jpg"
              alt="Pick Plant healthy indoor plant collection"
              fill
              sizes="(min-width: 1280px) 560px, (min-width: 1024px) 44vw, (min-width: 640px) calc(100vw - 3rem), calc(100vw - 2rem)"
              priority
              className="object-cover"
            />
            <HeartPulse className="absolute right-6 top-6 text-[var(--primary)]" />
          </div>
        </div>
      </Container>
    </section>
  );
}
