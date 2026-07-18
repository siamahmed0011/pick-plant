import Link from "next/link";
import { ArrowRight } from "lucide-react";
export function SectionIntro({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:mb-10 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        <p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-[var(--primary)]">
          Pick Plant
        </p>
        <h2 className="text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl">{title}</h2>
        <p className="mt-3 max-w-xl leading-7 text-[var(--muted)]">{description}</p>
      </div>
      {href && label && (
        <Link
          className="inline-flex shrink-0 items-center gap-2 rounded-lg px-1 py-2 font-semibold text-[var(--primary)] hover:gap-3"
          href={href}
        >
          {label}
          <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}
