import { requireUser } from "@/lib/auth/guards";
import { getCustomerOrdersList } from "@/lib/orders/order-listing";
import { CustomerOrdersList } from "@/components/account/customer-orders-list";

export const metadata = {
  title: "My Orders | Pick Plant",
};

export default async function AccountOrdersPage() {
  const session = await requireUser("/account/orders");
  const { orders } = await getCustomerOrdersList(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--primary)]">My Orders</h1>
        <p className="text-sm text-[var(--muted)]">Track your plant orders and view purchase history.</p>
      </div>

      <CustomerOrdersList orders={orders} />
    </div>
  );
}
