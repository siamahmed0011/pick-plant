"use client";
import { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function NewsletterSection() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <section className="store-section">
      <Container>
        <div className="overflow-hidden rounded-[var(--radius)] border bg-[var(--muted-surface)] p-7 shadow-[var(--shadow)] sm:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--primary)] text-white">
              <Mail />
            </span>
            <h2 className="mt-5 text-3xl font-bold sm:text-4xl">Stay Connected With Nature</h2>
            <p className="mt-3 leading-7 text-[var(--muted)]">
              {"নতুন গাছ, বিশেষ অফার এবং যত্নের পরামর্শ পেতে ইমেইল দিয়ে যুক্ত থাকুন।"}
            </p>
            <form
              className="mx-auto mt-7 flex max-w-lg flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>
              <Input
                id="newsletter-email"
                type="email"
                required
                placeholder="Email address"
                className="bg-white"
              />
              <Button type="submit" className="shrink-0">
                Subscribe
              </Button>
            </form>
            {submitted && (
              <p
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]"
                role="status"
              >
                <CheckCircle2 size={17} />
                {"ধন্যবাদ! আপনি আমাদের সাথে যুক্ত হয়েছেন।"}
              </p>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
