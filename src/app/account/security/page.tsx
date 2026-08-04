import { Lock, LogOut, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { AccountPageHeader } from "@/components/account/account-header";
import { SecuritySettingsForm } from "@/components/account/security-settings-form";
import { EmailVerificationBadge } from "@/components/account/status-badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { getAccountUserContext } from "@/lib/auth/user-context";

export default async function SecurityPage() {
  const session = await requireUser("/account/security");
  const userContext = await getAccountUserContext(session);

  const email = userContext?.email ?? session.user.email ?? "";
  const role = userContext?.role ?? session.user.role;
  const isVerified = userContext?.emailVerified ?? null;

  return (
    <div className="space-y-6">
      <AccountPageHeader
        title="Password & security"
        subtitle="Manage your password, active session, and review account security settings."
      />

      {/* Main Security Card Containing Session & Change Password Sections */}
      <div className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-5 sm:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-8">
        
        {/* Section 1: Current Session */}
        <section aria-labelledby="current-session-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-[#DDE7DD] pb-6">
            <div className="flex items-start gap-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EEF5F0] text-[#1E5A3A] border border-[#DDE7DD]">
                <MonitorSmartphone size={20} />
              </span>
              <div>
                <h2 id="current-session-title" className="text-base font-bold text-[#1F2D22] flex items-center gap-2">
                  Current session
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-600" /> Active now
                  </span>
                </h2>
                <p className="text-xs text-[#66746A] mt-0.5">
                  Signed in as <strong className="text-[#1F2D22]">{email}</strong> ({role})
                </p>
              </div>
            </div>

            <form action={signOutAction} className="shrink-0">
              <Button
                type="submit"
                variant="outline"
                className="h-9 px-4 text-xs font-semibold rounded-[14px] border-[#DDE7DD] bg-[#FFFFFF] text-[#1F2D22] hover:bg-stone-100 hover:text-stone-900 transition"
              >
                <LogOut size={14} /> Sign out of this session
              </Button>
            </form>
          </div>
        </section>

        {/* Section 2: Change Password Form */}
        <section aria-labelledby="change-password-title">
          <SecuritySettingsForm />
        </section>
      </div>

      {/* Section 3: Account Protection Overview */}
      <div className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-5 sm:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 border-b border-[#DDE7DD] pb-4 mb-4">
          <span className="grid size-9 place-items-center rounded-xl bg-[#EEF5F0] text-[#1E5A3A] border border-[#DDE7DD]">
            <ShieldCheck size={18} />
          </span>
          <div>
            <h2 className="text-base font-bold text-[#1F2D22]">Account protection</h2>
            <p className="text-xs text-[#66746A]">Security verification and feature status.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[14px] border border-[#DDE7DD] bg-[#EEF5F0]/40 p-4 space-y-1">
            <p className="text-xs font-semibold text-[#66746A]">Email Verification</p>
            <div className="pt-1">
              <EmailVerificationBadge verified={isVerified} />
            </div>
            <p className="text-[11px] text-[#66746A] pt-1">
              {isVerified
                ? "Your email is verified. Order notifications and recovery links will be sent here."
                : "Verify your email to secure recovery access."}
            </p>
          </div>

          <div className="rounded-[14px] border border-[#DDE7DD] bg-[#EEF5F0]/40 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#66746A]">Two-Factor Authentication (2FA)</p>
              <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                Not available yet
              </span>
            </div>
            <p className="text-xs font-bold text-[#1F2D22] pt-1 flex items-center gap-1">
              <Lock size={14} className="text-stone-400" /> Standard Password Authentication
            </p>
            <p className="text-[11px] text-[#66746A]">
              Two-factor authentication will be offered in a future security update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
