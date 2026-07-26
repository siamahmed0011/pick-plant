import { requireAdmin } from "@/lib/auth/guards";
import { BlogForm } from "@/components/admin/blogs/blog-form";

export default async function NewBlogPage() {
  await requireAdmin("/admin/blogs/new");
  return <BlogForm />;
}
