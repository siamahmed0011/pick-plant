import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { getAdminOrderDetails } from "@/lib/orders/order-listing";
import { AdminOrderDetailView } from "@/components/admin/orders/admin-order-detail-view";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Order Details | Admin Pick Plant",
};

export default async function AdminOrderDetailPage({ params }: Props) {
  await requireAdmin("/admin/orders");
  const { id } = await params;

  const order = await getAdminOrderDetails(id);

  if (!order) {
    notFound();
  }

  return <AdminOrderDetailView order={order} />;
}
