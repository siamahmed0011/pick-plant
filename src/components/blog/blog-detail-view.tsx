import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, Tag } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";
import { BlogCard, type BlogCardPost } from "./blog-card";

export type BlogDetailPost = BlogCardPost & {
  content: string;
  tags: string[];
};

export function BlogDetailView({
  post,
  relatedPosts,
}: {
  post: BlogDetailPost;
  relatedPosts: BlogCardPost[];
}) {
  const imageUrl = post.coverImage || "/images/placeholders/blog.svg";

  return (
    <main className="py-8 sm:py-12">
      <Container>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: post.title },
          ]}
        />

        <article className="mt-6 max-w-4xl mx-auto bg-white rounded-[2.5rem] border border-stone-200/90 p-6 sm:p-12 shadow-sm">
          {/* Back Button */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--primary)] transition mb-6"
          >
            <ArrowLeft size={16} /> Back to All Articles
          </Link>

          {/* Article Header */}
          <header>
            <div className="flex items-center gap-3">
              <Badge className="bg-[var(--primary)] text-white text-xs font-semibold">
                {post.category}
              </Badge>
              <span className="text-xs text-[var(--muted)] flex items-center gap-1 font-medium">
                <Clock size={13} /> {post.readingTime}
              </span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold text-stone-900 leading-tight">
              {post.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-stone-100 text-xs font-medium text-[var(--muted)]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-bold text-stone-800">
                  <User size={15} className="text-emerald-700" />
                  {post.authorName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  Published on {formatDate(post.publishedAt)}
                </span>
              </div>
            </div>
          </header>

          {/* Cover Image */}
          <div className="relative mt-8 aspect-[16/9] bg-stone-100 overflow-hidden rounded-3xl shadow-sm">
            <Image src={imageUrl} alt={post.title} fill className="object-cover" priority />
          </div>

          {/* Excerpt */}
          <p className="mt-8 text-lg font-medium text-stone-700 leading-relaxed border-l-4 border-[var(--primary)] pl-4 italic bg-stone-50/50 py-3 rounded-r-2xl">
            {post.excerpt}
          </p>

          {/* Article Body */}
          <div className="mt-8 prose prose-stone max-w-none prose-headings:font-bold prose-headings:text-stone-900 prose-p:leading-relaxed prose-p:text-stone-700 text-base space-y-4">
            {post.content.split("\n\n").map((paragraph, index) => {
              if (paragraph.startsWith("# ")) {
                return (
                  <h1 key={index} className="text-2xl font-bold text-stone-900 mt-8 mb-4">
                    {paragraph.replace("# ", "")}
                  </h1>
                );
              }
              if (paragraph.startsWith("## ")) {
                return (
                  <h2 key={index} className="text-xl font-bold text-stone-900 mt-6 mb-3">
                    {paragraph.replace("## ", "")}
                  </h2>
                );
              }
              if (paragraph.startsWith("- ")) {
                return (
                  <ul key={index} className="list-disc pl-6 space-y-1 text-stone-700 my-4">
                    {paragraph.split("\n").map((line, lIdx) => (
                      <li key={lIdx}>{line.replace("- ", "")}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={index} className="text-stone-700 leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Tags Footer */}
          {post.tags.length > 0 && (
            <footer className="mt-12 pt-6 border-t border-stone-100 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1 mr-2">
                <Tag size={13} /> Tags:
              </span>
              {post.tags.map((tag) => (
                <Badge key={tag} className="bg-stone-100 text-stone-700 hover:bg-stone-200 border-none">
                  #{tag}
                </Badge>
              ))}
            </footer>
          )}
        </article>

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <h3 className="text-2xl font-bold text-stone-900">Related Articles</h3>
            <p className="text-sm text-[var(--muted)] mt-1">
              গাছের যত্নের বিষয়ে আরও দরকারি লেখা পড়ুন।
            </p>
            <div className="mt-6 grid gap-8 md:grid-cols-3">
              {relatedPosts.map((rPost) => (
                <BlogCard key={rPost.id} post={rPost} />
              ))}
            </div>
          </section>
        )}
      </Container>
    </main>
  );
}
