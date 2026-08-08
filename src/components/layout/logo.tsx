import Link from "next/link";
import { Leaf } from "lucide-react";

export function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex shrink-0 flex-nowrap items-center gap-2 xl:gap-2.5 text-lg xl:text-xl font-bold tracking-[-0.02em] text-[var(--primary)] whitespace-nowrap"
      aria-label="Pick Plant home"
    >
      <span className="grid size-8 xl:size-9 shrink-0 place-items-center rounded-xl bg-[var(--primary)] text-white shadow-sm">
        <Leaf size={18} className="shrink-0 xl:hidden" strokeWidth={2.25} />
        <Leaf size={19} className="hidden shrink-0 xl:block" strokeWidth={2.25} />
      </span>
      <span className="shrink-0 whitespace-nowrap">Pick Plant</span>
    </Link>
  );
}
