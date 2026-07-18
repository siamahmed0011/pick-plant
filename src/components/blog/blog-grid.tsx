import type { BlogPost } from "@/types";
import { BlogCard } from "./blog-card";
export function BlogGrid({ items }: { items: BlogPost[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {items.map((item) => (
        <BlogCard post={item} key={item.id} />
      ))}
    </div>
  );
}
