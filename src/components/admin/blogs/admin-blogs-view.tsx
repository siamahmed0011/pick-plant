"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Eye, EyeOff, Edit, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";

type BlogPostListItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  authorName: string;
  readingTime: string;
  isPublished: boolean;
  publishedAt: Date | string;
};

export function AdminBlogsView({ posts: initialPosts }: { posts: BlogPostListItem[] }) {
  const [posts, setPosts] = useState(initialPosts);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      const res = await fetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((current) => current.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete post");
      }
    } catch {
      alert("Error deleting post");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <AdminPageHeader
          title="Blog Posts"
          description="Create, edit, and publish blog articles, care guides, and plant advice stories."
          status={null}
        />
        <Link
          href="/admin/blogs/new"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 font-semibold text-white shadow-sm transition hover:bg-[var(--primary)]/90"
        >
          <Plus size={18} aria-hidden="true" /> Create Article
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Title & Slug</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Published Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-stone-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-stone-900">{post.title}</div>
                      <div className="text-xs text-[var(--muted)] font-mono">/blog/{post.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="bg-stone-100 text-stone-800">{post.category}</Badge>
                    </td>
                    <td className="px-6 py-4 text-stone-700 font-medium">{post.authorName}</td>
                    <td className="px-6 py-4">
                      {post.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <Eye size={13} /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                          <EyeOff size={13} /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--muted)] font-medium">
                      {formatDate(post.publishedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/blogs/${post.id}/edit`}
                          className="p-2 text-stone-600 hover:text-[var(--primary)] rounded-lg hover:bg-stone-100 transition"
                          title="Edit Post"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50 transition"
                          title="Delete Post"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-500 font-medium">
                    No blog posts found. Click &quot;Create Article&quot; to write your first post.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
