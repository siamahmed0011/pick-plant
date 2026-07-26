"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, BookOpen, Calendar, Clock, User, ArrowRight } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Badge } from "@/components/ui/badge";
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
    <main className="py-8 sm:py-12">
      <Container>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />

        {/* Hero Header */}
        <header className="relative mt-6 overflow-hidden rounded-[2.5rem] bg-stone-900 p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300 backdrop-blur-md">
              <BookOpen size={14} /> Gardening & Plant Life Journal
            </div>
            <h1 className="mt-4 text-3xl font-extrabold sm:text-5xl tracking-tight leading-tight">
              Pick Plant Care Blog & Guides
            </h1>
            <p className="mt-4 text-base sm:text-lg text-stone-300 leading-relaxed">
              গাছ পালন, ইনডোর সাজসজ্জা, পানি ও মাটি নির্বাচন এবং শহুরে বাগান গড়ার সেরা গাইডলাইন ও অভিজ্ঞদের টিপস পড়ুন।
            </p>
          </div>
        </header>

        {/* Featured Article Banner (if no active search/filter) */}
        {featuredPost && selectedCategory === "All" && searchQuery === "" && (
          <section className="mt-10 overflow-hidden rounded-[2.5rem] border border-stone-200 bg-white shadow-md transition duration-300 hover:shadow-xl">
            <div className="grid lg:grid-cols-2 items-center">
              <div className="relative aspect-[16/10] bg-stone-100 lg:aspect-auto lg:h-full">
                <Image
                  src={featuredPost.coverImage || "/images/placeholders/blog.svg"}
                  alt={featuredPost.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-[var(--primary)] text-white text-xs font-bold shadow-md">
                    Featured Article
                  </Badge>
                </div>
              </div>

              <div className="p-8 sm:p-12">
                <div className="flex items-center gap-3 text-xs font-medium text-[var(--muted)]">
                  <Badge className="bg-emerald-50 text-emerald-900 border border-emerald-200">
                    {featuredPost.category}
                  </Badge>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {formatDate(featuredPost.publishedAt)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {featuredPost.readingTime}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-stone-900 hover:text-[var(--primary)] transition">
                  <Link href={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                </h2>

                <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
                  {featuredPost.excerpt}
                </p>

                <div className="mt-8 flex items-center justify-between pt-6 border-t border-stone-100">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                    <User size={15} className="text-emerald-700" />
                    {featuredPost.authorName}
                  </span>

                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-[var(--primary)]/90"
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
                className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  selectedCategory === cat
                    ? "bg-[var(--primary)] text-white shadow-md"
                    : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium focus:border-[var(--primary)] focus:outline-none shadow-sm"
            />
          </div>
        </section>

        {/* Articles Grid */}
        <section className="mt-8">
          {gridPosts.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {gridPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-12 text-center">
              <p className="text-base font-semibold text-stone-800">No articles match your criteria.</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Try adjusting your search terms or category selection.</p>
            </div>
          )}
        </section>
      </Container>
    </main>
  );
}
