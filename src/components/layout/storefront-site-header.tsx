"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { SiteHeader } from "@/components/layout/site-header";

function SessionAwareSiteHeader() {
  const sessionContext = useSession();
  const session = sessionContext?.data;
  return <SiteHeader session={session} />;
}

export function StorefrontSiteHeader() {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <SessionAwareSiteHeader />
    </SessionProvider>
  );
}
