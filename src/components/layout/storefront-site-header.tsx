"use client";

import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { SiteHeader } from "@/components/layout/site-header";

export function StorefrontSiteHeader({ initialSession }: { initialSession?: Session | null }) {
  const sessionContext = useSession();
  const session = sessionContext?.data ?? initialSession;

  return <SiteHeader session={session} />;
}
