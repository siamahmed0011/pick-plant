import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";
import "@/styles/animations.css";
import { AppProviders } from "@/providers/app-providers";

const hind = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Pick Plant | আপনার বিশ্বস্ত অনলাইন প্ল্যান্ট শপ",
    template: "%s | Pick Plant",
  },
  description:
    "ঘর, বারান্দা, অফিস ও বাগানের জন্য স্বাস্থ্যবান গাছ, বীজ, টব এবং গার্ডেনিং উপকরণ কিনুন।",
  openGraph: {
    title: "Pick Plant | Premium Plants for Greener Homes",
    description: "Healthy plants, thoughtful care guidance, and safe delivery across Bangladesh.",
    images: [
      {
        url: "/images/brand/hero-nursery.jpg",
        width: 1536,
        height: 1024,
        alt: "Pick Plant premium nursery collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pick Plant | Premium Plants for Greener Homes",
    description: "Healthy plants, thoughtful care guidance, and safe delivery across Bangladesh.",
    images: ["/images/brand/hero-nursery.jpg"],
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn">
      <body className={hind.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
