import { Card } from "@/components/ui/card";
export function DashboardStatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </Card>
  );
}
