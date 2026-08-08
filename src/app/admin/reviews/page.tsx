import { requireAdmin } from "@/lib/auth/guards";
import { getAdminReviewsList } from "@/lib/admin/reviews-data";
import { AdminReviewsView } from "@/components/admin/reviews/admin-reviews-view";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/reviews");
  const params = await searchParams;

  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const search = typeof params.search === "string" ? params.search : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const rating = typeof params.rating === "string" ? parseInt(params.rating, 10) : undefined;

  const data = await getAdminReviewsList({ page, search, status, rating });

  return <AdminReviewsView data={data} />;
}
