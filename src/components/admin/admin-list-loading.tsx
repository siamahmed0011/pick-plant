import { Skeleton } from "@/components/ui/skeleton";

export function AdminListLoading({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-label={`Loading ${label}`}>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-3 h-6 w-full max-w-xl" />
      <Skeleton className="mt-8 h-28 w-full" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:hidden">
        {Array.from({ length: 4 }, (_, index) => <Skeleton className="h-72" key={index} />)}
      </div>
      <Skeleton className="mt-6 hidden h-[30rem] w-full xl:block" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
