"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Star,
  MessageSquare,
  Clock,
  CheckCircle2,
  Search,
  Check,
  X,
  Trash2,
  Eye,
  BadgeCheck,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatters";
import type { ReviewItem } from "@/lib/admin/reviews-data";

type ReviewsViewProps = {
  data: {
    items: ReviewItem[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    summary: {
      totalReviews: number;
      pendingCount: number;
      publishedCount: number;
      averageRating: number;
    };
  };
};

export function AdminReviewsView({ data }: { data: ReviewsViewProps["data"] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "ALL");
  const [selectedRating, setSelectedRating] = useState(searchParams.get("rating") || "0");
  const [activeReview, setActiveReview] = useState<ReviewItem | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/admin/reviews?${params.toString()}`);
  };

  const handleStatusChange = (st: string) => {
    setSelectedStatus(st);
    const params = new URLSearchParams(searchParams.toString());
    if (st !== "ALL") {
      params.set("status", st);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`/admin/reviews?${params.toString()}`);
  };

  const handleRatingChange = (rt: string) => {
    setSelectedRating(rt);
    const params = new URLSearchParams(searchParams.toString());
    if (rt !== "0") {
      params.set("rating", rt);
    } else {
      params.delete("rating");
    }
    params.set("page", "1");
    router.push(`/admin/reviews?${params.toString()}`);
  };

  const updateReviewStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        if (activeReview?.id === id) {
          setActiveReview((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        router.refresh();
      } else {
        alert("Failed to update review status");
      }
    } catch {
      alert("Error updating review status");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer review?")) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (activeReview?.id === id) {
          setActiveReview(null);
        }
        router.refresh();
      } else {
        alert("Failed to delete review");
      }
    } catch {
      alert("Error deleting review");
    } finally {
      setUpdatingId(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            fill={star <= rating ? "currentColor" : "none"}
            className={star <= rating ? "text-amber-500" : "text-[#DDE7DD]"}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-50 text-amber-800 border-amber-200 font-bold">Pending</Badge>;
      case "PUBLISHED":
        return <Badge className="bg-[#EAF5EE] text-[#1E5A3A] border-[#DDE7DD] font-bold">Published</Badge>;
      case "REJECTED":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-bold">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <AdminPageHeader
        title="Customer Reviews & Ratings"
        description="Moderate customer product reviews, approve verified purchaser feedback, and maintain store rating integrity."
        status={null}
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-[18px] border border-[#DDE7DD] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#66746A]">Total Reviews</p>
            <p className="mt-1 text-2xl font-bold text-[#1E5A3A]">{data.summary.totalReviews}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EAF5EE] text-[#1E5A3A]">
            <MessageSquare size={22} />
          </div>
        </div>

        <div className="rounded-[18px] border border-[#DDE7DD] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#66746A]">Pending Moderation</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{data.summary.pendingCount}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <Clock size={22} />
          </div>
        </div>

        <div className="rounded-[18px] border border-[#DDE7DD] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#66746A]">Published Reviews</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{data.summary.publishedCount}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EAF5EE] text-[#1E5A3A]">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="rounded-[18px] border border-[#DDE7DD] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#66746A]">Average Store Rating</p>
            <p className="mt-1 text-2xl font-bold text-[#1E5A3A]">★ {data.summary.averageRating} / 5</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EAF5EE] text-[#1E5A3A]">
            <Star size={22} className="fill-amber-500 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDE7DD] pb-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66746A]" />
          <input
            type="text"
            placeholder="Search by product name, review comment, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-[#DDE7DD] bg-white pl-10 pr-4 py-2 text-sm font-medium text-[#1F2D22] focus:border-[#1E5A3A] focus:outline-none"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            {["ALL", "PENDING", "PUBLISHED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  selectedStatus === st
                    ? "bg-[#1E5A3A] text-white shadow-xs"
                    : "bg-[#EEF5F0] text-[#1F2D22] hover:bg-[#DDE7DD]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <select
            value={selectedRating}
            onChange={(e) => handleRatingChange(e.target.value)}
            className="rounded-xl border border-[#DDE7DD] bg-white px-3 py-1.5 text-xs font-bold text-[#1F2D22] focus:outline-none"
          >
            <option value="0">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews Table Surface */}
      <div className="overflow-hidden rounded-[18px] border border-[#DDE7DD] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#DDE7DD] bg-[#F7F8F5] text-xs font-bold uppercase text-[#66746A]">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Rating & Review</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE7DD]">
              {data.items.length > 0 ? (
                data.items.map((rev) => (
                  <tr key={rev.id} className="hover:bg-[#F7F8F5]/60 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-[#DDE7DD] bg-[#F7F8F5]">
                          <Image src={rev.product.image} alt={rev.product.name} fill className="object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-[#1F2D22] line-clamp-1">{rev.product.name}</div>
                          <span className="text-[11px] text-[#66746A]">Product Review</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#1F2D22]">{rev.user.name}</div>
                      <div className="text-xs text-[#66746A]">{rev.user.email}</div>
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 mt-0.5">
                          <BadgeCheck size={12} /> Verified Purchase
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      {renderStars(rev.rating)}
                      {rev.title && <div className="font-bold text-[#1F2D22] text-xs mt-1">{rev.title}</div>}
                      <p className="mt-1 text-xs text-[#66746A] line-clamp-2 leading-relaxed">{rev.body}</p>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(rev.status)}</td>
                    <td className="px-6 py-4 text-xs text-[#66746A]">{formatDate(rev.createdAt)}</td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      {rev.status !== "PUBLISHED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updatingId === rev.id}
                          onClick={() => updateReviewStatus(rev.id, "PUBLISHED")}
                          className="h-8 rounded-lg text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        >
                          <Check size={14} className="mr-1" /> Approve
                        </Button>
                      )}

                      {rev.status !== "REJECTED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updatingId === rev.id}
                          onClick={() => updateReviewStatus(rev.id, "REJECTED")}
                          className="h-8 rounded-lg text-xs font-bold text-rose-700 border-rose-200 hover:bg-rose-50"
                        >
                          <X size={14} className="mr-1" /> Reject
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveReview(rev)}
                        className="h-8 rounded-lg text-xs font-bold text-[#1E5A3A]"
                      >
                        <Eye size={14} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={updatingId === rev.id}
                        onClick={() => deleteReview(rev.id)}
                        className="h-8 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#66746A] font-medium">
                    No customer product reviews found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination
        basePath="/admin/reviews"
        params={Object.fromEntries(searchParams.entries())}
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        totalItems={data.totalItems}
        pageSize={10}
      />

      {/* Review Detail Modal */}
      {activeReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[24px] border border-[#DDE7DD] bg-white p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#DDE7DD] pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#1F2D22]">Review Details</h3>
                <p className="text-xs text-[#66746A]">Review ID: {activeReview.id}</p>
              </div>
              <button
                onClick={() => setActiveReview(null)}
                className="rounded-xl p-2 text-[#66746A] hover:bg-[#EEF5F0]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Product & User Details */}
            <div className="flex items-center gap-4 rounded-2xl bg-[#F7F8F5] p-4">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-[#DDE7DD]">
                <Image src={activeReview.product.image} alt={activeReview.product.name} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-[#1F2D22]">{activeReview.product.name}</div>
                <div className="text-xs text-[#66746A] mt-0.5">
                  By {activeReview.user.name} ({activeReview.user.email})
                </div>
              </div>
            </div>

            {/* Rating and Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                {renderStars(activeReview.rating)}
                {getStatusBadge(activeReview.status)}
              </div>
              {activeReview.title && <h4 className="text-lg font-bold text-[#1F2D22]">{activeReview.title}</h4>}
            </div>

            {/* Full Review Comment */}
            <div className="rounded-2xl border border-[#DDE7DD] bg-[#F7F8F5]/50 p-5 text-sm leading-relaxed text-[#1F2D22] whitespace-pre-wrap">
              {activeReview.body}
            </div>

            {/* Verified Purchase Badge & Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#DDE7DD]">
              {activeReview.isVerifiedPurchase ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <BadgeCheck size={16} /> Verified Buyer Purchase
                </span>
              ) : (
                <span className="text-xs text-[#66746A]">Standard Customer Review</span>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateReviewStatus(activeReview.id, "PUBLISHED")}
                  className="rounded-xl text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateReviewStatus(activeReview.id, "REJECTED")}
                  className="rounded-xl text-xs font-bold text-rose-700 border-rose-200 hover:bg-rose-50"
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
