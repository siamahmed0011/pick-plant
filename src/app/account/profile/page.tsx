import { AccountPageHeader } from "@/components/account/account-header";
import { ProfileSettingsForm } from "@/components/account/profile-settings-form";
import { requireUser } from "@/lib/auth/guards";

export default async function ProfilePage() {
  const session = await requireUser("/account/profile");

  return (
    <div className="space-y-6">
      <AccountPageHeader
        title="Personal information"
        subtitle="Keep your contact details up to date for smooth ordering and delivery notifications."
      />
      <ProfileSettingsForm name={session.user.name} email={session.user.email} />
    </div>
  );
}
