import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPostBySlug, getRelatedBlogPosts } from "@/lib/blog/blog-service";
import { BlogDetailView } from "@/components/blog/blog-detail-view";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Article Not Found | Pick Plant",
    };
  }

  return {
    title: `${post.title} | Pick Plant Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  const related = await getRelatedBlogPosts(post.id, post.category);

  return <BlogDetailView post={post} relatedPosts={related} />;
}
