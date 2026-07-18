import Link from "next/link";
import type { BlogPost } from "@/types";
import { Card } from "@/components/ui/card";
export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Card>
      <h2 className="text-xl font-bold">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>
      <p className="mt-2 text-[var(--muted)]">{post.excerpt}</p>
    </Card>
  );
}
