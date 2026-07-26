import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { getAdminContactMessageById } from "@/lib/contact/contact-service";
import { AdminMessageDetailView } from "@/components/admin/contact-messages/admin-message-detail-view";

export default async function AdminContactMessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("/admin/contact-messages");
  const { id } = await params;
  const message = await getAdminContactMessageById(id);

  if (!message) notFound();

  return <AdminMessageDetailView message={message} />;
}
