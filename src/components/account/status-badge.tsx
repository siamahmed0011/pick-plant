import { Badge } from "@/components/ui/badge";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

export function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  switch (status) {
    case OrderStatus.PENDING:
      return <Badge className="bg-amber-50 text-amber-800 border-amber-200/80 font-medium">Pending</Badge>;
    case OrderStatus.CONFIRMED:
      return <Badge className="bg-sky-50 text-sky-800 border-sky-200/80 font-medium">Confirmed</Badge>;
    case OrderStatus.PROCESSING:
      return <Badge className="bg-purple-50 text-purple-800 border-purple-200/80 font-medium">Processing</Badge>;
    case OrderStatus.SHIPPED:
      return <Badge className="bg-indigo-50 text-indigo-800 border-indigo-200/80 font-medium">Shipped</Badge>;
    case OrderStatus.DELIVERED:
      return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200/80 font-medium">Delivered</Badge>;
    case OrderStatus.CANCELLED:
      return <Badge className="bg-stone-100 text-stone-600 border-stone-200 font-medium">Cancelled</Badge>;
    case OrderStatus.RETURNED:
      return <Badge className="bg-stone-100 text-stone-700 border-stone-200 font-medium">Returned</Badge>;
    case OrderStatus.REFUNDED:
      return <Badge className="bg-amber-50 text-amber-900 border-amber-200/80 font-medium">Refunded</Badge>;
    default:
      return <Badge className="bg-stone-100 text-stone-700 font-medium">{String(status)}</Badge>;
  }
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus | string }) {
  switch (status) {
    case PaymentStatus.PAID:
      return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200/80 font-medium">Paid</Badge>;
    case PaymentStatus.PENDING:
    case PaymentStatus.UNPAID:
      return <Badge className="bg-amber-50 text-amber-800 border-amber-200/80 font-medium">Unpaid</Badge>;
    case PaymentStatus.FAILED:
      return <Badge className="bg-red-50 text-red-800 border-red-200/80 font-medium">Failed</Badge>;
    case PaymentStatus.REFUNDED:
      return <Badge className="bg-amber-50 text-amber-900 border-amber-200/80 font-medium">Refunded</Badge>;
    default:
      return <Badge className="bg-stone-100 text-stone-700 font-medium">{String(status)}</Badge>;
  }
}

export function EmailVerificationBadge({ verified }: { verified: boolean | null | undefined }) {
  if (verified === true) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-800">
        <span className="size-1.5 rounded-full bg-emerald-600" />
        Email verified
      </span>
    );
  }

  if (verified === false) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-xs font-semibold text-amber-800">
        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
        Verification pending
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
      <span className="size-1.5 rounded-full bg-stone-400" />
      Email status unavailable
    </span>
  );
}
