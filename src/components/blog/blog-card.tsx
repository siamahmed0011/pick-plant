import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";
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
    <article className="group flex flex-col justify-between overflow-hidden rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] shadow-[0_4px_16px_rgba(31,45,34,0.04)] transition duration-300 hover:-translate-y-1 hover:border-[#1E5A3A]/40">
      <div>
        <div className="relative aspect-[16/9] bg-[#EEF5F0] overflow-hidden border-b border-[#DDE7DD]">
          <Image
            src={imageUrl}
            alt={post.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <span className="inline-block rounded-md bg-[#EAF5EE] px-2.5 py-1 text-[11px] font-bold text-[#1E5A3A] border border-[#DDE7DD] shadow-xs">
              {post.category}
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-3 text-xs font-medium text-[#7A877F] mb-3">
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

          <h3 className="text-lg sm:text-xl font-bold text-[#1F2D22] group-hover:text-[#1E5A3A] transition leading-snug">
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h3>

          <p className="mt-2.5 text-xs sm:text-sm text-[#66746A] line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6 pt-0 border-t border-[#DDE7DD] mt-auto flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1F2D22]">
          <User size={14} className="text-[#1E5A3A]" />
          {post.authorName}
        </span>

        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#1E5A3A] hover:underline"
        >
          Read Article <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
