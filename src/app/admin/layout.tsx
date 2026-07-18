import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard | Pick Plant",
    template: "%s | Pick Plant Admin",
  },
  description: "Manage the Pick Plant store.",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin("/admin");

  return (
    <div className="min-h-screen bg-[var(--background)] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-[17rem] lg:block">
        <AdminSidebar />
      </div>
      <div className="min-w-0 lg:col-start-2">
        <AdminHeader admin={{ name: session.user.name, email: session.user.email }} />
        <main className="mx-auto w-full max-w-[96rem] p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
