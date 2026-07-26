import { requireAdmin } from "@/lib/auth/guards";
import { getAdminBlogPosts } from "@/lib/blog/blog-service";
import { AdminBlogsView } from "@/components/admin/blogs/admin-blogs-view";

export default async function AdminBlogsPage() {
  await requireAdmin("/admin/blogs");
  const posts = await getAdminBlogPosts();
  return <AdminBlogsView posts={posts} />;
}
