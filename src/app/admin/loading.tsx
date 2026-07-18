import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading admin dashboard">
      <Skeleton className="h-10 w-52" />
      <Skeleton className="mt-3 h-6 w-full max-w-md" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-40" key={index} />
        ))}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-80 xl:col-span-2" />
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <span className="sr-only">Loading dashboard data…</span>
    </div>
  );
}
