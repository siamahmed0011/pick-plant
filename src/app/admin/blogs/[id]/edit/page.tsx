import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { getAdminBlogPostById } from "@/lib/blog/blog-service";
import { BlogForm } from "@/components/admin/blogs/blog-form";

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("/admin/blogs");
  const { id } = await params;
  const post = await getAdminBlogPostById(id);

  if (!post) notFound();

  return (
    <BlogForm
      postId={post.id}
      initialData={{
        ...post,
        coverImage: post.coverImage ?? undefined,
      }}
    />
  );
}

