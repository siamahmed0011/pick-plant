import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getCustomerOrderDetails } from "@/lib/orders/order-listing";
import { CustomerOrderDetailsView } from "@/components/account/customer-order-details";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Order Details | Pick Plant",
};

export default async function CustomerOrderDetailsPage({ params }: Props) {
  const { id } = await params;
  const session = await requireUser(`/account/orders/${id}`);

  const order = await getCustomerOrderDetails(session.user.id, id);

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <CustomerOrderDetailsView order={order} />
    </div>
  );
}
