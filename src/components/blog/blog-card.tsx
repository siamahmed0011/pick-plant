import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";

export type BlogCardPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  category: string;
  authorName: string;
  readingTime: string;
  publishedAt: Date | string;
};

export function BlogCard({ post }: { post: BlogCardPost }) {
  const imageUrl = post.coverImage || "/images/placeholders/blog.svg";

  return (
    <article className="group surface flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/90 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-300">
      <div>
        <div className="relative aspect-[16/9] bg-stone-100 overflow-hidden">
          <Image
            src={imageUrl}
            alt={post.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-[var(--primary)] text-white text-xs font-semibold shadow-md">
              {post.category}
            </Badge>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 text-xs font-medium text-[var(--muted)] mb-3">
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              {formatDate(post.publishedAt)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {post.readingTime}
            </span>
          </div>

          <h3 className="text-xl font-bold text-stone-900 group-hover:text-[var(--primary)] transition leading-snug">
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h3>

          <p className="mt-3 text-sm text-[var(--muted)] line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
        </div>
      </div>

      <div className="p-6 pt-0 border-t border-stone-100/60 mt-auto flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
          <User size={14} className="text-emerald-700" />
          {post.authorName}
        </span>

        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--primary)] hover:underline"
        >
          Read Article <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
