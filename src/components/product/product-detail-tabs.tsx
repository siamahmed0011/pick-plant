"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { detailContent, faqs, reviews, type ProductTab } from "@/data/product-details";
const tabs: ProductTab[] = ["Description", "Plant Care", "Delivery", "Reviews", "FAQ"];
export function ProductDetailTabs() {
  const [active, setActive] = useState<ProductTab>("Description");
  return (
    <section className="mt-14 border-t pt-10">
      <div
        role="tablist"
        aria-label="Product details"
        className="flex gap-2 overflow-x-auto border-b"
      >
        {tabs.map((tab) => (
          <button
            type="button"
            role="tab"
            aria-selected={active === tab}
            onClick={() => setActive(tab)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${active === tab ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--muted)]"}`}
            key={tab}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="py-7">
        {active === "Description" && (
          <div className="max-w-3xl leading-8 text-[var(--muted)]">
            <p>{detailContent.description}</p>
          </div>
        )}
        {active === "Plant Care" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <p>
              <strong>Soil</strong>
              <br />
              {detailContent.soil}
            </p>
            <p>
              <strong>Fertilizer</strong>
              <br />
              {detailContent.fertilizer}
            </p>
            <p>
              <strong>Repotting</strong>
              <br />
              {detailContent.repotting}
            </p>
            <p>
              <strong>Common issues</strong>
              <br />
              {detailContent.issues}
            </p>
          </div>
        )}
        {active === "Delivery" && (
          <div className="max-w-3xl space-y-3 leading-7 text-[var(--muted)]">
            <p>
              গাছটি নিরাপদ প্যাকেজিংয়ে পাঠানো হয় এবং ঢাকা ও সারাদেশে delivery করা হয়। সাধারণত ২–৫
              কর্মদিবস সময় লাগে। দূরত্ব ও আবহাওয়ার কারণে গাছের চেহারায় সামান্য পরিবর্তন স্বাভাবিক।
            </p>
          </div>
        )}
        {active === "Reviews" && (
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.map((review) => (
              <article className="surface p-5" key={review.name}>
                <div className="flex text-amber-500">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star size={15} fill="currentColor" key={i} />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{review.text}</p>
                <p className="mt-4 text-sm font-semibold">
                  {review.name} · {review.location}
                </p>
              </article>
            ))}
          </div>
        )}
        {active === "FAQ" && (
          <div className="grid gap-3">
            {faqs.map((faq) => (
              <details className="rounded-xl border bg-white p-4" key={faq.question}>
                <summary className="cursor-pointer font-semibold">{faq.question}</summary>
                <p className="mt-3 leading-7 text-[var(--muted)]">{faq.answer}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
