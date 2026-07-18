import Link from "next/link";
import { Leaf } from "lucide-react";
export function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 text-xl font-bold tracking-[-0.02em] text-[var(--primary)]"
      aria-label="Pick Plant home"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-[var(--primary)] text-white shadow-sm">
        <Leaf size={19} strokeWidth={2.25} />
      </span>
      Pick Plant
    </Link>
  );
}
