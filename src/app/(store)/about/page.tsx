import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Pick Plant's mission, values, and our journey to bring healthy plants, expert care guidance, and safe delivery to homes across Bangladesh.",
  alternates: {
    canonical: "/about",
  },
};

export default function Page() {
  return (
    <PlaceholderPage
      title="About Us"
      description="Pick Plant-এর লক্ষ্য, মূল্যবোধ এবং সবুজ যাত্রার গল্প জানুন।"
    />
  );
}
