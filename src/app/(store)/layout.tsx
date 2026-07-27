import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { StorefrontSiteHeader } from "@/components/layout/storefront-site-header";
import { Footer } from "@/components/layout/footer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <StorefrontSiteHeader />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
