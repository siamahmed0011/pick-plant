import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DashboardStatCard } from "@/components/admin/dashboard-stat-card";
export default function Page() {
  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Store performance-এর placeholder overview এখানে দেখানো হবে।"
      />
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard label="Plants" value="8" />
        <DashboardStatCard label="Categories" value="10" />
        <DashboardStatCard label="Orders" value="—" />
        <DashboardStatCard label="Customers" value="—" />
      </section>
    </>
  );
}
