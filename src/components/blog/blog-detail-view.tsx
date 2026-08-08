import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, Tag } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
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
    <main className="py-6 sm:py-8 lg:py-10 bg-[#F7F8F5] min-h-[calc(100vh-14rem)]">
      <Container>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: post.title },
          ]}
        />

        <article className="mt-6 max-w-4xl mx-auto bg-[#FFFFFF] rounded-[18px] border border-[#DDE7DD] p-6 sm:p-10 shadow-[0_4px_16px_rgba(31,45,34,0.04)]">
          {/* Back Button */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#66746A] hover:text-[#1E5A3A] transition mb-6"
          >
            <ArrowLeft size={16} /> Back to All Articles
          </Link>

          {/* Article Header */}
          <header>
            <div className="flex items-center gap-3">
              <span className="inline-block rounded-md bg-[#EAF5EE] px-2.5 py-1 text-[11px] font-bold text-[#1E5A3A] border border-[#DDE7DD]">
                {post.category}
              </span>
              <span className="text-xs text-[#7A877F] flex items-center gap-1 font-medium">
                <Clock size={13} /> {post.readingTime}
              </span>
            </div>

            <h1 className="mt-4 text-2xl sm:text-4xl font-bold text-[#1F2D22] leading-tight">
              {post.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-[#DDE7DD] text-xs font-medium text-[#7A877F]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-bold text-[#1F2D22]">
                  <User size={15} className="text-[#1E5A3A]" />
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
          <div className="relative mt-6 aspect-[16/9] bg-[#EEF5F0] overflow-hidden rounded-[14px] border border-[#DDE7DD]">
            <Image src={imageUrl} alt={post.title} fill className="object-cover" priority />
          </div>

          {/* Excerpt */}
          <p className="mt-6 text-sm sm:text-base font-medium text-[#1F2D22] leading-relaxed border-l-4 border-[#1E5A3A] pl-4 italic bg-[#EEF5F0]/50 py-3 rounded-r-[14px]">
            {post.excerpt}
          </p>

          {/* Article Body */}
          <div className="mt-8 prose prose-stone max-w-none prose-headings:font-bold prose-headings:text-[#1F2D22] prose-p:leading-relaxed prose-p:text-[#1F2D22] text-sm sm:text-base space-y-4">
            {post.content.split("\n\n").map((paragraph, index) => {
              if (paragraph.startsWith("# ")) {
                return (
                  <h1 key={index} className="text-xl sm:text-2xl font-bold text-[#1F2D22] mt-8 mb-4">
                    {paragraph.replace("# ", "")}
                  </h1>
                );
              }
              if (paragraph.startsWith("## ")) {
                return (
                  <h2 key={index} className="text-lg sm:text-xl font-bold text-[#1F2D22] mt-6 mb-3">
                    {paragraph.replace("## ", "")}
                  </h2>
                );
              }
              if (paragraph.startsWith("- ")) {
                return (
                  <ul key={index} className="list-disc pl-6 space-y-1 text-[#1F2D22] my-4">
                    {paragraph.split("\n").map((line, lIdx) => (
                      <li key={lIdx}>{line.replace("- ", "")}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={index} className="text-[#1F2D22] leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Tags Footer */}
          {post.tags.length > 0 && (
            <footer className="mt-10 pt-5 border-t border-[#DDE7DD] flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#66746A] uppercase tracking-wider flex items-center gap-1 mr-2">
                <Tag size={13} /> Tags:
              </span>
              {post.tags.map((tag) => (
                <span key={tag} className="inline-block rounded-md bg-[#EEF5F0] px-2.5 py-1 text-xs font-semibold text-[#1E5A3A] border border-[#DDE7DD]">
                  #{tag}
                </span>
              ))}
            </footer>
          )}
        </article>

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <section className="mt-12">
            <h3 className="text-xl sm:text-2xl font-bold text-[#1F2D22]">Related Articles</h3>
            <p className="text-xs sm:text-sm text-[#66746A] mt-1">
              গাছের যত্নের বিষয়ে আরও দরকারি লেখা পড়ুন।
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
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
