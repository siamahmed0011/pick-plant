import { requireAdmin } from "@/lib/auth/guards";
import { ShippingZoneForm } from "@/components/admin/shipping/shipping-zone-form";

export default async function NewShippingZonePage() {
  await requireAdmin();
  return <ShippingZoneForm />;
}
