import { Card } from "@/components/ui/card";
import Image from "next/image";
export function EmptyState({
  title = "Nothing here yet",
  description = "এই অংশের তথ্য পরবর্তী ধাপে যোগ করা হবে।",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="mx-auto grid min-h-64 max-w-2xl place-items-center px-6 py-12 text-center sm:px-10">
      <div>
        <Image
          src="/images/brand/empty-plant.svg"
          alt=""
          width={160}
          height={110}
          className="mx-auto"
        />
        <h2 className="mt-5 text-2xl font-bold">{title}</h2>
        <p className="mx-auto mt-2 max-w-md leading-7 text-[var(--muted)]">{description}</p>
      </div>
    </Card>
  );
}
