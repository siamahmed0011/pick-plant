import { Container } from "@/components/shared/container";
import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main className="py-10">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-5">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-14 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </Container>
    </main>
  );
}
