import { prisma } from "@/lib/prisma";
import type { BlogPostFormInput } from "./blog-validation";

export async function getPublishedBlogPosts(search?: string, category?: string) {
  const where: Record<string, unknown> = { isPublished: true };

  if (category && category !== "All") {
    where.category = category;
  }

  if (search && search.trim()) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { excerpt: { contains: search.trim(), mode: "insensitive" } },
      { tags: { has: search.trim() } },
    ];
  }

  return prisma.blogPost.findMany({
    where,
    orderBy: { publishedAt: "desc" },
  });
}

export async function getBlogPostBySlug(slug: string) {
  return prisma.blogPost.findFirst({
    where: {
      slug,
      isPublished: true,
    },
  });
}

export async function getRelatedBlogPosts(currentId: string, category: string) {
  return prisma.blogPost.findMany({
    where: {
      isPublished: true,
      id: { not: currentId },
      category,
    },
    take: 3,
    orderBy: { publishedAt: "desc" },
  });
}

export async function getAdminBlogPosts() {
  return prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminBlogPostById(id: string) {
  return prisma.blogPost.findUnique({
    where: { id },
  });
}

export async function createBlogPost(data: BlogPostFormInput) {
  return prisma.blogPost.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      coverImage: data.coverImage || "/images/placeholders/blog.svg",
      category: data.category,
      tags: data.tags,
      authorName: data.authorName,
      readingTime: data.readingTime,
      isPublished: data.isPublished,
    },
  });
}

export async function updateBlogPost(id: string, data: BlogPostFormInput) {
  return prisma.blogPost.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      coverImage: data.coverImage || "/images/placeholders/blog.svg",
      category: data.category,
      tags: data.tags,
      authorName: data.authorName,
      readingTime: data.readingTime,
      isPublished: data.isPublished,
    },
  });
}

export async function deleteBlogPost(id: string) {
  return prisma.blogPost.delete({
    where: { id },
  });
}
