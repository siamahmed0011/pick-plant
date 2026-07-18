"use client";
import { useState } from "react";
import type { Session } from "next-auth";
import Link from "next/link";
import { Menu } from "lucide-react";
import { mainNavigation } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
export function MobileMenu({ session }: { session?: Session | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open main menu"
        className="rounded-xl lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu />
      </Button>
      <Drawer open={open} title="Navigation" onClose={() => setOpen(false)}>
        <nav className="grid gap-1.5" aria-label="Mobile navigation">
          <Link
            className="rounded-xl bg-[var(--muted-surface)] px-4 py-3 font-semibold text-[var(--primary)]"
            href="/account"
            onClick={() => setOpen(false)}
          >
            {session?.user?.name ?? "Login / Account"}
          </Link>
          {mainNavigation.map((item) => (
            <Link
              className="rounded-xl px-4 py-3 font-medium hover:bg-[var(--muted-surface)] hover:text-[var(--primary)]"
              href={item.href}
              key={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Drawer>
    </>
  );
}
