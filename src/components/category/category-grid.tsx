import type { CategoryWithCount } from "./category-card";
import { CategoryCard } from "./category-card";

export function CategoryGrid({ items }: { items: CategoryWithCount[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <CategoryCard category={item} key={item.id} />
      ))}
    </div>
  );
}
