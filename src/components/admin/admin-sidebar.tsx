import Link from "next/link";
import { LayoutDashboard, Leaf } from "lucide-react";
import { adminNavigation } from "@/config/admin-navigation";
export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="h-full bg-[var(--primary)] p-4 text-white">
      <Link href="/admin" className="mb-8 flex items-center gap-2 text-xl font-bold">
        <Leaf />
        Pick Plant Admin
      </Link>
      <nav aria-label="Admin navigation" className="grid gap-1">
        <Link
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/10"
          href="/admin"
          onClick={onNavigate}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>
        {adminNavigation.map((item) => (
          <Link
            className="rounded-lg px-3 py-2 hover:bg-white/10"
            href={item.href}
            key={item.href}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
