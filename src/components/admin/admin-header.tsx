import { AdminMobileMenu } from "./admin-mobile-menu";
export function AdminHeader() {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-6">
      <AdminMobileMenu />
      <div>
        <strong>Admin Dashboard</strong>
        <span className="ml-2 text-sm text-[var(--muted)]">Interface Preview</span>
      </div>
    </header>
  );
}
