import { auth } from "@/auth";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { StorefrontSiteHeader } from "@/components/layout/storefront-site-header";
import { Footer } from "@/components/layout/footer";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <AnnouncementBar />
      <StorefrontSiteHeader initialSession={session} />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
