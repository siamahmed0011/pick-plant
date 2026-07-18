import { Clock3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "./admin-page-header";

export function AdminPlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <AdminPageHeader title={title} description={description} />
      <Card className="mt-8 flex min-h-48 items-center p-6 sm:p-8">
        <div className="flex max-w-2xl items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--muted-surface)] text-[var(--primary)]">
            <Clock3 size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold">Management features will be added later</h2>
            <p className="mt-1 leading-7 text-[var(--muted)]">
              This protected route is ready for a future management workflow. No placeholder records
              or fake actions are shown.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
