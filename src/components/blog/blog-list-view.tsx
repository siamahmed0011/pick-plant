"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, BookOpen, Calendar, Clock, User, ArrowRight } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { formatDate } from "@/lib/formatters";
import { BlogCard, type BlogCardPost } from "./blog-card";

export function BlogListView({ posts }: { posts: BlogCardPost[] }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useMemo(() => {
    const set = new Set(posts.map((p) => p.category));
    return ["All", ...Array.from(set)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const featuredPost = posts[0];
  const gridPosts = filteredPosts;

  return (
    <main className="py-6 sm:py-8 lg:py-10 bg-[#F7F8F5] min-h-[calc(100vh-14rem)]">
      <Container>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />

        {/* Hero Header */}
        <header
          className="relative mt-6 overflow-hidden rounded-[24px] p-8 sm:p-12 text-white shadow-[0_12px_40px_rgba(15,77,52,0.12)]"
          style={{ background: "linear-gradient(110deg, #1E5A3A 0%, #165B40 55%, #0A4733 100%)" }}
        >
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 border border-white/18 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#A7E3C7] backdrop-blur-md">
              <BookOpen size={14} className="text-[#A7E3C7]" /> Gardening & Plant Life Journal
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl tracking-tight leading-tight text-white">
              Pick Plant Care Blog & Guides
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#DDEBE2] leading-relaxed">
              গাছ পালন, ইনডোর সাজসজ্জা, পানি ও মাটি নির্বাচন এবং শহুরে বাগান গড়ার সেরা গাইডলাইন ও অভিজ্ঞদের টিপস পড়ুন।
            </p>
          </div>
        </header>

        {/* Featured Article Banner (if no active search/filter) */}
        {featuredPost && selectedCategory === "All" && searchQuery === "" && (
          <section className="mt-10 overflow-hidden rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] shadow-[0_4px_16px_rgba(31,45,34,0.04)] transition duration-300 hover:border-[#1E5A3A]/40">
            <div className="grid lg:grid-cols-2 items-center">
              <div className="relative aspect-[16/10] bg-[#EEF5F0] lg:aspect-auto lg:h-full border-b lg:border-b-0 lg:border-r border-[#DDE7DD]">
                <Image
                  src={featuredPost.coverImage || "/images/placeholders/blog.svg"}
                  alt={featuredPost.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center rounded-full bg-[#1E5A3A] px-3 py-1 text-xs font-bold text-white shadow-xs">
                    Featured Article
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-10">
                <div className="flex items-center gap-3 text-xs font-medium text-[#7A877F]">
                  <span className="inline-block rounded-md bg-[#EAF5EE] px-2.5 py-1 text-[11px] font-bold text-[#1E5A3A] border border-[#DDE7DD]">
                    {featuredPost.category}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {formatDate(featuredPost.publishedAt)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {featuredPost.readingTime}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-[#1F2D22] hover:text-[#1E5A3A] transition">
                  <Link href={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                </h2>

                <p className="mt-3 text-sm sm:text-base text-[#66746A] leading-relaxed">
                  {featuredPost.excerpt}
                </p>

                <div className="mt-8 flex items-center justify-between pt-5 border-t border-[#DDE7DD]">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1F2D22]">
                    <User size={15} className="text-[#1E5A3A]" />
                    {featuredPost.authorName}
                  </span>

                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="inline-flex h-10 items-center gap-2 rounded-[14px] bg-[#1E5A3A] px-5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#17482F] shadow-xs"
                  >
                    Read Story <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filter Controls */}
        <section className="mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-[14px] px-4 py-2.5 text-xs font-bold transition border ${
                  selectedCategory === cat
                    ? "bg-[#1E5A3A] text-white border-[#1E5A3A] shadow-xs"
                    : "bg-[#FFFFFF] text-[#1F2D22] border-[#DDE7DD] hover:bg-[#F5FAF6] hover:border-[#C9DCCC]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A877F]" size={17} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[14px] border border-[#DDE7DD] bg-[#FFFFFF] py-2.5 pl-10 pr-4 text-xs font-medium text-[#1F2D22] placeholder:text-[#7A877F] focus:border-[#1E5A3A] focus:ring-2 focus:ring-[#1E5A3A]/15 focus:outline-none shadow-[0_4px_16px_rgba(31,45,34,0.04)] transition"
            />
          </div>
        </section>

        {/* Articles Grid */}
        <section className="mt-8">
          {gridPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {gridPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-8 sm:p-12 text-center shadow-[0_4px_16px_rgba(31,45,34,0.04)]">
              <p className="text-base font-bold text-[#1F2D22]">No articles match your criteria.</p>
              <p className="mt-1 text-xs text-[#66746A]">Try adjusting your search terms or category selection.</p>
            </div>
          )}
        </section>
      </Container>
    </main>
  );
}
