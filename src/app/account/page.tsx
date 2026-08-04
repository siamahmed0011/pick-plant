import Link from "next/link";
import { ChevronRight, Edit3, MapPin, Package, ShieldCheck, UserRound } from "lucide-react";
import { AccountPageHeader } from "@/components/account/account-header";
import { EmailVerificationBadge, OrderStatusBadge, PaymentStatusBadge } from "@/components/account/status-badge";
import { requireUser } from "@/lib/auth/guards";
import { getAccountUserContext } from "@/lib/auth/user-context";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/formatters";

const shortcuts = [
  {
    title: "View your orders",
    description: "Track current shipments and view purchase history.",
    href: "/account/orders",
    Icon: Package,
  },
  {
    title: "Edit personal profile",
    description: "Update your full name, phone number, and contact details.",
    href: "/account/profile",
    Icon: UserRound,
  },
  {
    title: "Manage delivery addresses",
    description: "Add or edit saved shipping locations for faster checkout.",
    href: "/account/addresses",
    Icon: MapPin,
  },
  {
    title: "Password & security",
    description: "Update password, review active sessions, and account safety.",
    href: "/account/security",
    Icon: ShieldCheck,
  },
];

export default async function AccountOverviewPage() {
  const session = await requireUser("/account");
  const userContext = await getAccountUserContext(session);

  let ordersCount = 0;
  let addressCount = 0;
  let latestOrder = null;

  if (userContext) {
    try {
      const [countOrders, countAddresses, recentOrder] = await Promise.all([
        prisma.order.count({ where: { userId: userContext.id } }),
        prisma.address.count({ where: { userId: userContext.id } }),
        prisma.order.findFirst({
          where: { userId: userContext.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            grandTotal: true,
            createdAt: true,
          },
        }),
      ]);

      ordersCount = countOrders;
      addressCount = countAddresses;
      latestOrder = recentOrder;
    } catch (error) {
      console.error("[AccountOverview] Database query error:", error);
    }
  }

  const customerName = userContext?.name ?? session.user.name ?? "Pick Plant Customer";
  const firstName = customerName.split(" ")[0];
  const userInitials = customerName.charAt(0).toUpperCase();
  const email = userContext?.email ?? session.user.email ?? "No email linked";
  const role = userContext?.role ?? session.user.role;
  const isVerified = userContext?.emailVerified ?? null;

  return (
    <div className="space-y-6">
      {/* Contextual Account Page Header */}
      <AccountPageHeader
        eyebrow="MY ACCOUNT"
        title={`Welcome back, ${firstName}`}
        bengaliSubtitle="আপনার অর্ডার, প্রোফাইল ও অ্যাকাউন্ট নিরাপত্তা এখান থেকে পরিচালনা করুন।"
      />

      {/* Top Welcome Customer Card */}
      <div className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-4 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#EAF5EE] text-[#1E5A3A] font-bold text-lg border border-[#DDE7DD]/60">
              {userInitials}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#1F2D22] truncate">
                  {customerName}
                </h2>
                <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-[#66746A] border border-[#DDE7DD]">
                  {role}
                </span>
              </div>
              <p className="text-xs text-[#66746A] truncate mt-0.5">
                {email}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <EmailVerificationBadge verified={isVerified} />
              </div>
            </div>
          </div>

          <Link
            href="/account/profile"
            className="inline-flex h-9 items-center gap-1.5 rounded-[14px] border border-[#DDE7DD] bg-[#FFFFFF] px-3.5 text-xs font-semibold text-[#1F2D22] hover:bg-[#EEF5F0] hover:text-[#1E5A3A] transition shrink-0 self-start sm:self-center"
          >
            <Edit3 size={14} /> Edit profile
          </Link>
        </div>
      </div>

      {/* Account Summary Metrics Row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold text-[#66746A]">Orders</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-[#1E5A3A]">{ordersCount}</p>
          <p className="mt-0.5 text-[11px] text-[#7A877F]">Total placed</p>
        </div>

        <div className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold text-[#66746A]">Saved items</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-[#1E5A3A]">Wishlist</p>
          <p className="mt-0.5 text-[11px] text-[#7A877F]">Saved plants</p>
        </div>

        <div className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold text-[#66746A]">Addresses</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-[#1E5A3A]">{addressCount}</p>
          <p className="mt-0.5 text-[11px] text-[#7A877F]">Saved locations</p>
        </div>
      </div>

      {/* Account Shortcuts */}
      <section aria-labelledby="shortcuts-title">
        <h2 id="shortcuts-title" className="text-base sm:text-lg font-bold text-[#1F2D22] mb-3">
          Account shortcuts
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {shortcuts.map(({ title, description, href, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center justify-between rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-3.5 sm:p-4 text-left shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:border-[#1E5A3A]/40 hover:-translate-y-0.5 transition-all duration-150"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#EEF5F0] text-[#1E5A3A] border border-[#DDE7DD]/60 group-hover:bg-[#1E5A3A] group-hover:text-white transition">
                  <Icon size={17} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#1F2D22] group-hover:text-[#1E5A3A] transition">
                    {title}
                  </h3>
                  <p className="text-xs text-[#66746A] truncate mt-0.5">
                    {description}
                  </p>
                </div>
              </div>
              <ChevronRight size={17} className="text-[#7A877F] group-hover:text-[#1E5A3A] group-hover:translate-x-0.5 transition shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Order / Recent Activity */}
      <section aria-labelledby="recent-activity-title">
        <h2 id="recent-activity-title" className="text-base sm:text-lg font-bold text-[#1F2D22] mb-3">
          Recent activity
        </h2>

        {latestOrder ? (
          <div className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-4 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDE7DD] pb-3">
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#7A877F]">LATEST ORDER</span>
                <p className="text-base font-mono font-bold text-[#1E5A3A]">
                  {latestOrder.orderNumber}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <OrderStatusBadge status={latestOrder.status} />
                <PaymentStatusBadge status={latestOrder.paymentStatus} />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-[#66746A]">
              <span>Placed on {formatDate(latestOrder.createdAt)}</span>
              <span className="font-bold text-sm text-[#1F2D22]">
                {formatCurrency(Number(latestOrder.grandTotal))}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-[#DDE7DD] text-right">
              <Link
                href={`/account/orders/${latestOrder.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#1E5A3A] hover:underline"
              >
                View order details <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-6 text-center shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <Package size={22} className="mx-auto text-[#7A877F] mb-2" />
            <p className="text-sm font-bold text-[#1F2D22]">No recent order activity</p>
            <p className="text-xs text-[#66746A] mt-1">Your plant orders will appear here after checkout.</p>
            <Link
              href="/plants"
              className="mt-4 inline-flex h-9 items-center justify-center rounded-[14px] bg-[#1E5A3A] px-4 text-xs font-semibold text-white hover:bg-[#17482F] transition"
            >
              Explore Plants
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
