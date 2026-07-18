import { Badge } from "@/components/ui/badge";
export function AdminPageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header>
      <Badge>Under Development</Badge>
      <h1 className="mt-3 text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-[var(--muted)]">{description}</p>
    </header>
  );
}
