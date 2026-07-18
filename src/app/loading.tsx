import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <Skeleton className="h-48 w-full" />
    </main>
  );
}
