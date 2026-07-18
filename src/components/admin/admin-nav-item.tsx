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
      className={cn(
        "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white",
        active && "bg-white text-[var(--primary)] shadow-sm hover:bg-white hover:text-[var(--primary)]",
      )}
    >
      <Icon
        size={18}
        aria-hidden="true"
        className={cn("shrink-0", active ? "text-[var(--primary)]" : "text-white/65")}
      />
      <span>{label}</span>
    </Link>
  );
}
