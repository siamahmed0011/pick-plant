import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";

export function EmptyState({
  title = "Nothing here yet",
  description = "এই অংশের তথ্য পরবর্তী ধাপে যোগ করা হবে।",
  actionHref,
  actionLabel,
}: {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
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
        <h2 className="mt-5 text-2xl font-bold text-[var(--text)]">{title}</h2>
        <p className="mx-auto mt-2 max-w-md leading-7 text-[var(--muted)]">{description}</p>
        {actionHref && actionLabel && (
          <div className="mt-6">
            <Link
              href={actionHref}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-6 font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)]"
            >
              {actionLabel}
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}

