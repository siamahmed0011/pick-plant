import { AccountSidebar } from "@/components/account/account-sidebar";
import { AccountHeader } from "@/components/account/account-header";
import { Container } from "@/components/shared/container";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { Footer } from "@/components/layout/footer";
import { requireUser } from "@/lib/auth/guards";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser("/account");
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <SiteHeader session={session} />
      <Container className="grid flex-1 gap-6 py-10 lg:grid-cols-[16rem_1fr]">
        <div>
          <AccountSidebar />
        </div>
        <main className="min-w-0">
          <AccountHeader name={session.user.name} />
          <div className="mt-8">{children}</div>
        </main>
      </Container>
      <Footer />
    </div>
  );
}
