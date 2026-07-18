import Link from "next/link";
import { ChevronRight, MapPin, Package, ShieldCheck, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { Card } from "@/components/ui/card";

const accountLinks = [
  {
    label: "Profile settings",
    description: "Review your customer details",
    href: "/account/profile",
    Icon: UserRound,
  },
  {
    label: "Security",
    description: "Password and session controls",
    href: "/account/security",
    Icon: ShieldCheck,
  },
  {
    label: "Orders",
    description: "Order history structure",
    href: "/account/orders",
    Icon: Package,
  },
  {
    label: "Addresses",
    description: "Delivery address structure",
    href: "/account/addresses",
    Icon: MapPin,
  },
];

export default async function AccountPage() {
  const session = await requireUser("/account");
  return (
    <div className="grid gap-6">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
              Signed-in account
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {session.user.name ?? "Pick Plant customer"}
            </h2>
            <p className="mt-1 text-[var(--muted)]">
              {session.user.email ?? "No email available in this session"}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--muted-surface)] px-4 py-3 text-sm">
            <span className="block text-[var(--muted)]">Role</span>
            <strong className="text-[var(--primary)]">{session.user.role}</strong>
          </div>
        </div>
        <div className="mt-6 grid gap-3 border-t pt-6 sm:grid-cols-2">
          <p className="text-sm">
            <span className="text-[var(--muted)]">Session status:</span> <strong>Active</strong>
          </p>
          <p className="text-sm">
            <span className="text-[var(--muted)]">Email verification:</span>{" "}
            <strong>Not available in session data</strong>
          </p>
        </div>
      </Card>
      <section aria-labelledby="account-shortcuts-title">
        <h2 id="account-shortcuts-title" className="text-2xl font-bold">
          Account shortcuts
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {accountLinks.map(({ label, description, href, Icon }) => (
            <Link
              className="surface group flex items-center gap-4 p-5 hover:-translate-y-0.5"
              href={href}
              key={href}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--muted-surface)] text-[var(--primary)]">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block">{label}</strong>
                <span className="text-sm text-[var(--muted)]">{description}</span>
              </span>
              <ChevronRight
                className="text-[var(--muted)] group-hover:text-[var(--primary)]"
                size={18}
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>
      <Card>
        <h2 className="text-xl font-bold">Recent activity</h2>
        <p className="mt-2 text-[var(--muted)]">
          No database-backed account activity is available yet. Orders and security history will
          appear here after integration.
        </p>
      </Card>
    </div>
  );
}
