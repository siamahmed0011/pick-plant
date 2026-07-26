import { requireAdmin } from "@/lib/auth/guards";
import { getAdminContactMessages } from "@/lib/contact/contact-service";
import { AdminMessagesView } from "@/components/admin/contact-messages/admin-messages-view";

export default async function AdminContactMessagesPage() {
  await requireAdmin("/admin/contact-messages");
  const messages = await getAdminContactMessages();
  return <AdminMessagesView messages={messages} />;
}
