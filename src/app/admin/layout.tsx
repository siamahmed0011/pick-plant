import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin("/admin");
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <div className="fixed inset-y-0 left-0 hidden w-68 lg:block">
        <AdminSidebar />
      </div>
      <div className="min-w-0 lg:col-start-2">
        <AdminHeader />
        <main className="p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
