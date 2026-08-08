import { requireAdmin } from "@/lib/auth/guards";
import { getStoreSettings } from "@/lib/admin/settings-service";
import { AdminSettingsView } from "@/components/admin/settings/admin-settings-view";

export default async function AdminSettingsPage() {
  await requireAdmin("/admin/settings");
  const settings = await getStoreSettings();

  return <AdminSettingsView initialSettings={settings} />;
}
