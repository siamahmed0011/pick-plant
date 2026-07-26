import { BlogCard, type BlogCardPost } from "./blog-card";

export function BlogGrid({ items }: { items: BlogCardPost[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {items.map((item) => (
        <BlogCard post={item} key={item.id} />
      ))}
    </div>
  );
}
