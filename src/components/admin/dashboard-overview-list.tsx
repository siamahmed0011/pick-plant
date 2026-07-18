import type { ReactNode } from "react";

export function DashboardOverviewList<T>({
  title,
  description,
  items,
  getKey,
  renderItem,
  emptyMessage,
  className,
}: {
  title: string;
  description: string;
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  emptyMessage: string;
  className?: string;
}) {
  return (
    <section className={`surface overflow-hidden ${className ?? ""}`} aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-title`}>
      <header className="border-b p-5 sm:p-6">
        <h2 id={`${title.toLowerCase().replaceAll(" ", "-")}-title`} className="text-xl font-bold">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
      </header>
      {items.length ? (
        <ul className="divide-y">
          {items.map((item) => (
            <li className="p-4 sm:px-6" key={getKey(item)}>
              {renderItem(item)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-6 text-sm text-[var(--muted)]">{emptyMessage}</p>
      )}
    </section>
  );
}
