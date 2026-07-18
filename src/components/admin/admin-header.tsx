import Link from "next/link";
import { ExternalLink, LogOut, ShieldCheck } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { AdminMobileMenu } from "./admin-mobile-menu";
import { AdminPageContext } from "./admin-page-context";

export function AdminHeader({
  admin,
}: {
  admin: { name?: string | null; email?: string | null };
}) {
  const identity = admin.name ?? admin.email ?? "Pick Plant admin";

  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-h-16 items-center gap-3 lg:min-h-18">
        <AdminMobileMenu />
        <AdminPageContext />
        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="hidden min-w-0 items-center gap-3 border-r pr-4 md:flex">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--muted-surface)] text-[var(--primary)]">
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <strong className="block max-w-40 truncate text-sm">{identity}</strong>
              <span className="block text-xs text-[var(--muted)]">Administrator</span>
            </span>
          </div>
          <Link
            href="/"
            className="hidden min-h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--muted-surface)] sm:inline-flex"
          >
            Storefront
            <ExternalLink size={15} aria-hidden="true" />
          </Link>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label="Sign out of the admin dashboard"
              title="Sign out"
            >
              <LogOut size={18} aria-hidden="true" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
