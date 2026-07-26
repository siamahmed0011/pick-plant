import { requireAdmin } from "@/lib/auth/guards";
import { getAdminShippingZonesList } from "@/lib/shipping/shipping-listing";
import { AdminShippingView } from "@/components/admin/shipping/admin-shipping-view";

export default async function AdminShippingPage() {
  await requireAdmin();
  const zones = await getAdminShippingZonesList();

  return <AdminShippingView zones={zones} />;
}
