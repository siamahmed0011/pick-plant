import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { blogPostFormSchema } from "@/lib/blog/blog-validation";
import { createBlogPost } from "@/lib/blog/blog-service";

export async function POST(request: Request) {
  try {
    await requireAdmin("/admin/blogs");
    const body = await request.json();
    const validated = blogPostFormSchema.parse(body);

    const post = await createBlogPost(validated);
    return NextResponse.json({ success: true, post });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 });
  }
}
