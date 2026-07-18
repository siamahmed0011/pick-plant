import Link from "next/link";
export function Pagination({ current = 1, total = 1 }: { current?: number; total?: number }) {
  return (
    <nav aria-label="Pagination" className="flex items-center gap-2">
      <Link
        className="rounded-lg border bg-white px-3 py-2"
        href={`?page=${Math.max(1, current - 1)}`}
      >
        Previous
      </Link>
      <span aria-current="page">
        {current} / {total}
      </span>
      <Link
        className="rounded-lg border bg-white px-3 py-2"
        href={`?page=${Math.min(total, current + 1)}`}
      >
        Next
      </Link>
    </nav>
  );
}
