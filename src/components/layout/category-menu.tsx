import Link from "next/link";
import { categoryNavigation } from "@/config/navigation";
export function CategoryMenu() {
  return (
    <div className="grid gap-1">
      {categoryNavigation.map((item) => (
        <Link
          className="rounded-lg p-2 hover:bg-[var(--background)]"
          href={item.href}
          key={item.href}
        >
          <span className="block font-semibold">{item.label}</span>
          <span className="text-xs text-[var(--muted)]">{item.description}</span>
        </Link>
      ))}
    </div>
  );
}
