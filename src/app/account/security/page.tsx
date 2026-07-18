import { MonitorSmartphone, ShieldCheck } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { SecuritySettingsForm } from "@/components/account/security-settings-form";
import { StatusNotice } from "@/components/auth/status-notice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";

export default async function SecurityPage() {
  const session = await requireUser("/account/security");
  return (
    <div className="grid gap-6">
      <Card className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--muted-surface)] text-[var(--primary)]">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-2xl font-bold">Current session</h2>
            <p className="mt-1 text-[var(--muted)]">
              {session.user.email ?? session.user.name ?? "Authenticated customer"}
            </p>
            <p className="mt-2 text-sm">
              <span className="text-[var(--muted)]">Role:</span>{" "}
              <strong>{session.user.role}</strong>
            </p>
          </div>
        </div>
        <form action={signOutAction} className="mt-6 border-t pt-6">
          <Button type="submit" variant="outline">
            Sign out of this session
          </Button>
        </form>
      </Card>
      <SecuritySettingsForm />
      <Card className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <MonitorSmartphone
            className="mt-1 shrink-0 text-[var(--primary)]"
            size={22}
            aria-hidden="true"
          />
          <div>
            <h2 className="text-xl font-bold">Devices and login history</h2>
            <p className="mt-2 leading-7 text-[var(--muted)]">
              Active-session management, trusted devices, and login history require database-backed
              security records. No device, location, IP address, or activity data is invented here.
            </p>
          </div>
        </div>
        <div className="mt-5">
          <StatusNotice>
            Session-management controls will appear here after secure backend integration.
          </StatusNotice>
        </div>
      </Card>
    </div>
  );
}
