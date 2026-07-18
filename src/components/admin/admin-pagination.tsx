import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/formatters";

function pageHref(basePath: string, params: Record<string, string>, page: number) {
  const search = new URLSearchParams(params);
  if (page > 1) search.set("page", String(page));
  else search.delete("page");
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function AdminPagination({
  basePath,
  params,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
}: {
  basePath: string;
  params: Record<string, string>;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}) {
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="mt-6 flex flex-col justify-between gap-4 border-t pt-5 sm:flex-row sm:items-center">
      <p className="text-sm text-[var(--muted)]">
        Showing {formatNumber(firstItem)}–{formatNumber(lastItem)} of {formatNumber(totalItems)}
      </p>
      <nav aria-label="Product pagination" className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            href={pageHref(basePath, params, currentPage - 1)}
            className="inline-flex min-h-10 items-center gap-1 rounded-xl border bg-white px-3 text-sm font-semibold hover:bg-[var(--muted-surface)]"
          >
            <ChevronLeft size={16} aria-hidden="true" /> Previous
          </Link>
        ) : (
          <span className="inline-flex min-h-10 cursor-not-allowed items-center gap-1 rounded-xl border bg-white px-3 text-sm font-semibold opacity-45" aria-disabled="true">
            <ChevronLeft size={16} aria-hidden="true" /> Previous
          </span>
        )}
        <span className="min-w-20 text-center text-sm font-semibold" aria-live="polite">
          {formatNumber(currentPage)} / {formatNumber(totalPages)}
        </span>
        {currentPage < totalPages ? (
          <Link
            href={pageHref(basePath, params, currentPage + 1)}
            className="inline-flex min-h-10 items-center gap-1 rounded-xl border bg-white px-3 text-sm font-semibold hover:bg-[var(--muted-surface)]"
          >
            Next <ChevronRight size={16} aria-hidden="true" />
          </Link>
        ) : (
          <span className="inline-flex min-h-10 cursor-not-allowed items-center gap-1 rounded-xl border bg-white px-3 text-sm font-semibold opacity-45" aria-disabled="true">
            Next <ChevronRight size={16} aria-hidden="true" />
          </span>
        )}
      </nav>
    </div>
  );
}
