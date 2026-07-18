import { Badge } from "@/components/ui/badge";
import { DEVELOPMENT_BADGE } from "@/lib/constants";
export function PageHeader({
  title,
  description,
  badge = DEVELOPMENT_BADGE,
}: {
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <header className="surface fade-in overflow-hidden p-6 sm:p-10">
      <Badge>{badge}</Badge>
      <h1 className="mt-4 text-3xl font-bold sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-[var(--muted)]">{description}</p>
    </header>
  );
}
