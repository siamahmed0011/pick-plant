import type { Category } from "@/types";
import { CategoryCard } from "./category-card";
export function CategoryGrid({ items }: { items: Category[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item, index) => (
        <CategoryCard category={item} count={8 + index * 3} key={item.id} />
      ))}
    </div>
  );
}
