import "server-only";

import { prisma } from "@/lib/prisma";

export const REVIEWS_PAGE_SIZE = 10;

export type ReviewFilterParams = {
  search?: string;
  status?: string;
  rating?: number;
  page?: number;
};

export type ReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  status: "PENDING" | "PUBLISHED" | "REJECTED" | string;
  isVerifiedPurchase: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
  };
};

export async function getAdminReviewsList(params: ReviewFilterParams) {
  const page = Math.max(1, params.page ?? 1);
  const search = params.search?.trim();
  const statusFilter = params.status?.trim();
  const ratingFilter = params.rating;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { body: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { product: { name: { contains: search, mode: "insensitive" } } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (statusFilter && statusFilter !== "ALL") {
    where.status = statusFilter;
  }

  if (ratingFilter && ratingFilter > 0) {
    where.rating = ratingFilter;
  }

  const [totalItems, reviews, totalCount, pendingCount, publishedCount, ratingAggregate] =
    await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * REVIEWS_PAGE_SIZE,
        take: REVIEWS_PAGE_SIZE,
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          status: true,
          isVerifiedPurchase: true,
          publishedAt: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                take: 1,
                select: { secureUrl: true, url: true },
              },
            },
          },
        },
      }),
      prisma.review.count(),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.review.count({ where: { status: "PUBLISHED" } }),
      prisma.review.aggregate({
        _avg: { rating: true },
      }),
    ]);

  const items: ReviewItem[] = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body ?? "",
    status: r.status,
    isVerifiedPurchase: r.isVerifiedPurchase,
    publishedAt: r.publishedAt,
    createdAt: r.createdAt,
    user: {
      id: r.user?.id ?? "",
      name: r.user?.name ?? "Anonymous Customer",
      email: r.user?.email ?? "No Email",
    },
    product: {
      id: r.product.id,
      name: r.product.name,
      slug: r.product.slug,
      image: r.product.images[0]?.secureUrl ?? r.product.images[0]?.url ?? "/images/placeholders/plant.svg",
    },
  }));

  const totalPages = Math.ceil(totalItems / REVIEWS_PAGE_SIZE) || 1;

  return {
    items,
    totalItems,
    totalPages,
    currentPage: page,
    summary: {
      totalReviews: totalCount,
      pendingCount,
      publishedCount,
      averageRating: Math.round((ratingAggregate._avg.rating ?? 5) * 10) / 10,
    },
  };
}
