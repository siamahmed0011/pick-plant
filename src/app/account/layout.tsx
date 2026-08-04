import { AccountShell } from "@/components/account/account-shell";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { StorefrontSiteHeader } from "@/components/layout/storefront-site-header";
import { Footer } from "@/components/layout/footer";
import { requireUser } from "@/lib/auth/guards";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser("/account");

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <AnnouncementBar />
      <StorefrontSiteHeader initialSession={session} />
      <AccountShell customerName={session.user.name}>
        {children}
      </AccountShell>
      <Footer />
    </div>
  );
}
