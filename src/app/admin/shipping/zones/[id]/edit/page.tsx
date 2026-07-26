import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { getShippingZoneDetails } from "@/lib/shipping/shipping-listing";
import { ShippingZoneForm } from "@/components/admin/shipping/shipping-zone-form";

export default async function EditShippingZonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const zone = await getShippingZoneDetails(id);
  if (!zone) notFound();

  return <ShippingZoneForm initialData={zone} />;
}
