import { Badge } from "@/components/ui/badge";
export function AdminPageHeader({
  title,
  description,
  status = "Coming soon",
}: {
  title: string;
  description: string;
  status?: string | null;
}) {
  return (
    <header className="max-w-3xl">
      {status && <Badge>{status}</Badge>}
      <h1 className={status ? "mt-3 text-3xl font-bold sm:text-4xl" : "text-3xl font-bold sm:text-4xl"}>
        {title}
      </h1>
      <p className="mt-2 leading-7 text-[var(--muted)]">{description}</p>
    </header>
  );
}
