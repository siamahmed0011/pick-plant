import { ProfileSettingsForm } from "@/components/account/profile-settings-form";
import { requireUser } from "@/lib/auth/guards";

export default async function ProfilePage() {
  const session = await requireUser("/account/profile");
  return <ProfileSettingsForm name={session.user.name} email={session.user.email} />;
}
