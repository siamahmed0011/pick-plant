import Link from "next/link";
import type { AdminNavigationItem } from "@/config/admin-navigation";
import { cn } from "@/lib/utils";

export function AdminNavItem({
  item,
  active,
  onNavigate,
}: {
  item: AdminNavigationItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const { href, label, Icon } = item;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      style={active ? { backgroundColor: "#ffffff", color: "#1E5A3A" } : undefined}
      className={cn(
        "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
        active
          ? "bg-white text-[#1E5A3A] shadow-sm"
          : "text-white/85 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon
        size={18}
        aria-hidden="true"
        style={active ? { color: "#1E5A3A" } : undefined}
        className={cn("shrink-0", active ? "text-[#1E5A3A]" : "text-white/75 group-hover:text-white")}
      />
      <span
        style={active ? { color: "#1E5A3A" } : undefined}
        className={cn(active ? "text-[#1E5A3A]" : "text-white/85 group-hover:text-white")}
      >
        {label}
      </span>
    </Link>
  );
}
