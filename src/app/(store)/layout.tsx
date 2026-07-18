import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { Footer } from "@/components/layout/footer";
import { getOptionalSession } from "@/lib/auth/session";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const session = await getOptionalSession();
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <SiteHeader session={session} />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
