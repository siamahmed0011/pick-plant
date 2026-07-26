"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BlogPostFormInput } from "@/lib/blog/blog-validation";

export function BlogForm({
  initialData,
  postId,
}: {
  initialData?: Partial<BlogPostFormInput>;
  postId?: string;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState<BlogPostFormInput>({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    coverImage: initialData?.coverImage || "/images/placeholders/blog.svg",
    category: initialData?.category || "Plant Care",
    tags: initialData?.tags || ["Plant Care"],
    authorName: initialData?.authorName || "Pick Plant Team",
    readingTime: initialData?.readingTime || "4 min read",
    isPublished: initialData?.isPublished ?? true,
  });

  const [tagsInput, setTagsInput] = useState((formData.tags || []).join(", "));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: postId ? prev.slug : generateSlug(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const parsedTags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = { ...formData, tags: parsedTags };

      const url = postId ? `/api/admin/blogs/${postId}` : "/api/admin/blogs";
      const method = postId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/admin/blogs");
        router.refresh();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to save blog post");
      }
    } catch {
      setErrorMsg("An unexpected error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/blogs" className="p-2 rounded-xl hover:bg-stone-100 text-stone-600">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold text-stone-900">
            {postId ? "Edit Blog Article" : "Create New Article"}
          </h1>
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[var(--primary)] text-white font-bold rounded-xl inline-flex items-center gap-2"
        >
          <Save size={16} /> {isSubmitting ? "Saving..." : "Save Post"}
        </Button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-900">
          {errorMsg}
        </div>
      )}

      <div className="grid gap-6 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase text-stone-700 mb-2">Title *</label>
            <Input
              type="text"
              required
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="e.g. Indoor Plant Care Basics"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-bold uppercase text-stone-700 mb-2">URL Slug *</label>
            <Input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g. indoor-plant-care-basics"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase text-stone-700 mb-2">Category *</label>
            <Input
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. Plant Care"
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-xs font-bold uppercase text-stone-700 mb-2">Author Name</label>
            <Input
              type="text"
              value={formData.authorName}
              onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
              placeholder="Pick Plant Team"
            />
          </div>

          {/* Reading Time */}
          <div>
            <label className="block text-xs font-bold uppercase text-stone-700 mb-2">Reading Time</label>
            <Input
              type="text"
              value={formData.readingTime}
              onChange={(e) => setFormData({ ...formData, readingTime: e.target.value })}
              placeholder="4 min read"
            />
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-bold uppercase text-stone-700 mb-2">Short Excerpt *</label>
          <Textarea
            rows={2}
            required
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="A brief summary for article card previews..."
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-bold uppercase text-stone-700 mb-2">Full Content (Markdown/Text) *</label>
          <Textarea
            rows={12}
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Write full article body text..."
          />
        </div>

        {/* Cover Image URL */}
        <div>
          <label className="block text-xs font-bold uppercase text-stone-700 mb-2">Cover Image URL</label>
          <Input
            type="text"
            value={formData.coverImage}
            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
            placeholder="/images/placeholders/blog.svg"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-bold uppercase text-stone-700 mb-2">Tags (Comma Separated)</label>
          <Input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Indoor Plants, Care Guide, Beginner"
          />
        </div>

        {/* Publish Checkbox */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="h-4 w-4 rounded border-stone-300 text-[var(--primary)]"
            />
            <span className="text-sm font-bold text-stone-800">Publish Immediately</span>
          </label>
        </div>
      </div>
    </form>
  );
}
