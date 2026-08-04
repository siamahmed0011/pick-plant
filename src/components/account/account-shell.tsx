"use client";

import { AccountSidebar } from "@/components/account/account-sidebar";
import { AccountMobileMenu } from "@/components/account/account-mobile-menu";
import { Container } from "@/components/shared/container";

export function AccountShell({
  children,
  customerName,
}: {
  children: React.ReactNode;
  customerName?: string | null;
}) {
  return (
    <div className="py-6 sm:py-8 lg:py-10 bg-[#F7F8F5] min-h-[calc(100vh-14rem)]">
      <Container>
        {/* Mobile Navigation Drawer Trigger */}
        <AccountMobileMenu customerName={customerName} />

        {/* Desktop Split Grid */}
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 items-start">
          {/* Sticky Desktop Navigation Sidebar */}
          <div className="hidden lg:block sticky top-24 z-10">
            <AccountSidebar />
          </div>

          {/* Main Account Content Area */}
          <main className="min-w-0 flex-1">
            {children}
          </main>
        </div>
      </Container>
    </div>
  );
}
