import type { Metadata } from "next";
import { getPublishedBlogPosts } from "@/lib/blog/blog-service";
import { BlogListView } from "@/components/blog/blog-list-view";

export const metadata: Metadata = {
  title: "Plant Care Blog & Guides | Pick Plant",
  description: "Read expert plant care articles, indoor styling tips, air-purifying plant benefits, and urban balcony gardening advice.",
};

export default async function BlogListingPage() {
  const posts = await getPublishedBlogPosts();
  return <BlogListView posts={posts} />;
}
