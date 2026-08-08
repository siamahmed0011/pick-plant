import { requireAdmin } from "@/lib/auth/guards";
import { getAdminCustomersList } from "@/lib/admin/customers-data";
import { AdminCustomersView } from "@/components/admin/customers/admin-customers-view";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/customers");
  const params = await searchParams;

  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const search = typeof params.search === "string" ? params.search : undefined;
  const role = typeof params.role === "string" ? params.role : undefined;

  const data = await getAdminCustomersList({ page, search, role });

  return <AdminCustomersView data={data} />;
}
