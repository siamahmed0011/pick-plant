import { requireAdmin } from "@/lib/auth/guards";
import { getAdminCouponsList } from "@/lib/coupons/coupon-listing";
import { AdminCouponsView } from "@/components/admin/coupons/admin-coupons-view";

export default async function AdminCouponsPage() {
  await requireAdmin();
  const { coupons } = await getAdminCouponsList({ pageSize: 50 });

  return <AdminCouponsView coupons={coupons} />;
}
