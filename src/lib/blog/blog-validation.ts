import { z } from "zod";

export const blogPostFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(180, "Title is too long"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(120, "Slug is too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters").max(500, "Excerpt is too long"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  coverImage: z.string().url("Must be a valid image URL").or(z.string().startsWith("/")).optional().or(z.literal("")),
  category: z.string().min(2, "Category is required"),
  tags: z.array(z.string()).default([]),
  authorName: z.string().min(2, "Author name is required").default("Pick Plant Team"),
  readingTime: z.string().default("4 min read"),
  isPublished: z.boolean().default(true),
});

export type BlogPostFormInput = z.infer<typeof blogPostFormSchema>;
