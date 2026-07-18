import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Container } from "@/components/shared/container";
import { blogPosts } from "@/data/blog-posts";
import { formatDate } from "@/lib/formatters";
import { SectionIntro } from "./section-intro";
export function CareGuidesSection() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <SectionIntro
          title="Plant Care Guides"
          description="গাছ সুস্থ ও সুন্দর রাখতে সহজ বাংলা নির্দেশনা পড়ুন।"
          href="/blog"
          label="View All Guides"
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {blogPosts.map((post) => (
            <article className="surface group overflow-hidden" key={post.id}>
              <div className="relative aspect-[16/10] bg-[var(--secondary)]/25">
                <Image
                  src={post.image}
                  alt={`${post.title} guide`}
                  fill
                  className="object-cover transition group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <span className="text-xs font-bold uppercase tracking-wide text-[var(--primary)]">
                  Plant Care
                </span>
                <h3 className="mt-2 line-clamp-2 text-lg font-bold">{post.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs text-[var(--muted)]">
                  <CalendarDays size={14} />
                  {formatDate(post.publishedAt)}
                </div>
                <Link
                  className="mt-4 inline-flex items-center gap-2 font-semibold text-[var(--primary)]"
                  href={`/blog/${post.slug}`}
                >
                  Read Article
                  <ArrowRight size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
