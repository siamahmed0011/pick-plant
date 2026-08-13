import Link from "next/link";
import { categoryNavigation } from "@/config/navigation";

type CategoryMenuProps = {
  onNavigate?: () => void;
};

export function CategoryMenu({ onNavigate }: CategoryMenuProps = {}) {
  return (
    <div className="grid gap-1">
      {categoryNavigation.map((item) => (
        <Link
          className="rounded-lg p-2 hover:bg-[var(--background)]"
          href={item.href}
          key={item.href}
          onClick={onNavigate}
        >
          <span className="block font-semibold">{item.label}</span>
          <span className="text-xs text-[var(--muted)]">{item.description}</span>
        </Link>
      ))}
    </div>
  );
}

