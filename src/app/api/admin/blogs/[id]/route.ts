import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { blogPostFormSchema } from "@/lib/blog/blog-validation";
import { updateBlogPost, deleteBlogPost } from "@/lib/blog/blog-service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("/admin/blogs");
    const { id } = await params;
    const body = await request.json();
    const validated = blogPostFormSchema.parse(body);

    const post = await updateBlogPost(id, validated);
    return NextResponse.json({ success: true, post });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("/admin/blogs");
    const { id } = await params;
    await deleteBlogPost(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete blog post" }, { status: 500 });
  }
}
