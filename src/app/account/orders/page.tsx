import { AccountPageHeader } from "@/components/account/account-header";
import { CustomerOrdersList } from "@/components/account/customer-orders-list";
import { requireUser } from "@/lib/auth/guards";
import { getAccountUserContext } from "@/lib/auth/user-context";
import { getCustomerOrdersList } from "@/lib/orders/order-listing";

export const metadata = {
  title: "Your Orders | Pick Plant",
};

export default async function AccountOrdersPage() {
  const session = await requireUser("/account/orders");
  const userContext = await getAccountUserContext(session);

  let orders: Awaited<ReturnType<typeof getCustomerOrdersList>>["orders"] = [];

  if (userContext) {
    try {
      const result = await getCustomerOrdersList(userContext.id);
      orders = result.orders;
    } catch (error) {
      console.error("[AccountOrdersPage] Failed to fetch customer orders:", error);
    }
  }

  return (
    <div className="space-y-6">
      <AccountPageHeader
        title="Your orders"
        subtitle="Track your plant shipments, view invoices, and review previous order history."
      />
      <CustomerOrdersList orders={orders} />
    </div>
  );
}
