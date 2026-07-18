import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/types";

export function CategoryCard({ category, count }: { category: Category; count?: number }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group surface block h-full overflow-hidden transition duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--muted-surface)]">
        <Image
          src={category.image}
          alt={`${category.bengaliName} category`}
          fill
          className="object-cover transition duration-200 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[color:var(--primary)]/15 to-transparent" />
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">{category.name}</h3>
            {count !== undefined && (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                {count} products
              </p>
            )}
          </div>
          <ArrowUpRight
            className="shrink-0 text-[var(--muted)] transition group-hover:text-[var(--primary)]"
            size={19}
          />
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{category.description}</p>
      </div>
    </Link>
  );
}
