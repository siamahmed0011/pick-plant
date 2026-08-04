"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cancelCustomerOrderAction } from "@/app/account/orders/actions";
import { isCancellableByCustomer } from "@/lib/orders/order-transitions";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/account/status-badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { ArrowLeft, Clock, CreditCard, Loader2, ShoppingBag, Truck, XCircle } from "lucide-react";
import { PaymentRetryButton } from "@/components/payments/payment-retry-button";
import type { OnlinePaymentProvider } from "@/lib/orders/payment-initiation-eligibility";

type OrderItem = {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productImageUrl: string | null;
};

type StatusHistoryItem = {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus | null;
  note: string | null;
  createdAt: Date | string;
};

type CustomerOrderDetails = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddressLine1: string | null;
  shippingAddressLine2: string | null;
  shippingCity: string | null;
  shippingDistrict: string | null;
  shippingArea: string | null;
  shippingPostalCode: string | null;
  customerNote: string | null;
  subtotal: number;
  shippingTotal: number;
  couponCode?: string | null;
  couponDiscountTotal?: number;
  shippingZoneName?: string | null;
  shippingMethodName?: string | null;
  estimatedDeliveryText?: string | null;
  grandTotal: number;
  createdAt: Date | string;
  items: OrderItem[];
  statusHistory: StatusHistoryItem[];
};

type PaymentRetry = {
  provider: OnlinePaymentProvider;
  expiresAt: string;
};

export function CustomerOrderDetailsView({
  order,
  paymentRetry,
}: {
  order: CustomerOrderDetails;
  paymentRetry: PaymentRetry | null;
}) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canCancel = isCancellableByCustomer(order.status);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await cancelCustomerOrderAction(order.id, cancelReason);
    setIsSubmitting(false);

    if (res.success) {
      setShowCancelModal(false);
    } else {
      setErrorMessage(res.error || "Failed to cancel order.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#66746A] hover:text-[#1E5A3A] transition"
      >
        <ArrowLeft size={15} /> Back to orders
      </Link>

      {/* Main Order Header Card */}
      <div className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-5 sm:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE7DD] pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#7A877F]">Order Details</p>
            <h1 className="font-mono text-2xl font-bold text-[#1E5A3A] mt-0.5">
              {order.orderNumber}
            </h1>
            <p className="text-xs text-[#66746A] mt-1">Placed on {formatDate(order.createdAt)}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />

            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="gap-1 text-xs font-semibold border-red-200 text-red-600 hover:bg-red-50 rounded-[14px]"
              >
                <XCircle size={14} /> Cancel order
              </Button>
            )}
          </div>
        </div>

        {/* Shipping & Payment Grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-[14px] border border-[#DDE7DD] bg-[#EEF5F0]/40 p-4 space-y-1">
            <h2 className="font-bold text-xs uppercase tracking-wider text-[#1E5A3A] flex items-center gap-1.5 mb-2">
              <Truck size={15} /> Shipping details
            </h2>
            <p className="font-bold text-sm text-[#1F2D22]">{order.customerName}</p>
            <p className="text-xs text-[#66746A]">{order.customerPhone}</p>
            <p className="text-xs text-[#66746A] pt-1 leading-relaxed">
              {order.shippingAddressLine1}
              {order.shippingAddressLine2 ? `, ${order.shippingAddressLine2}` : ""}
              {order.shippingArea ? `, ${order.shippingArea}` : ""}, {order.shippingCity}, {order.shippingDistrict}
            </p>
          </div>

          <div className="rounded-[14px] border border-[#DDE7DD] bg-[#EEF5F0]/40 p-4 space-y-1">
            <h2 className="font-bold text-xs uppercase tracking-wider text-[#1E5A3A] flex items-center gap-1.5 mb-2">
              <CreditCard size={15} /> Payment info
            </h2>
            <p className="text-xs text-[#1F2D22]">
              <span className="font-semibold">Payment method:</span>{" "}
              {order.paymentMethod || "Cash on Delivery"}
            </p>
            <p className="text-xs text-[#1F2D22]">
              <span className="font-semibold">Payment status:</span> {order.paymentStatus}
            </p>
            {paymentRetry && (
              <div className="pt-2">
                <PaymentRetryButton
                  orderId={order.id}
                  provider={paymentRetry.provider}
                  expiresAt={paymentRetry.expiresAt}
                />
              </div>
            )}
            {order.customerNote && (
              <p className="text-xs text-[#66746A] pt-2 italic">
                &quot;{order.customerNote}&quot;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Ordered Items Breakdown */}
      <div className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-5 sm:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        <h2 className="font-bold text-base text-[#1F2D22] flex items-center gap-2 border-b border-[#DDE7DD] pb-3 mb-4">
          <ShoppingBag size={18} className="text-[#1E5A3A]" /> Ordered items ({order.items.length})
        </h2>

        <div className="divide-y divide-[#DDE7DD]">
          {order.items.map((item) => (
            <div key={item.id} className="py-3.5 flex items-center gap-4">
              <div className="relative size-14 shrink-0 rounded-xl overflow-hidden bg-[#EEF5F0] border border-[#DDE7DD]">
                <Image
                  src={item.productImageUrl || "/images/placeholders/plant.svg"}
                  alt={item.productName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#1F2D22]">{item.productName}</p>
                <p className="text-xs text-[#66746A]">SKU: {item.sku}</p>
                <p className="text-xs text-[#66746A] mt-0.5">
                  Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <div className="font-bold text-sm text-[#1F2D22]">
                {formatCurrency(item.lineTotal)}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Summary */}
        <div className="border-t border-[#DDE7DD] pt-4 mt-2 space-y-2 text-xs max-w-xs ml-auto">
          <div className="flex justify-between text-[#66746A]">
            <span>Subtotal</span>
            <span className="font-semibold text-[#1F2D22]">{formatCurrency(order.subtotal)}</span>
          </div>

          {order.couponCode && (order.couponDiscountTotal || 0) > 0 && (
            <div className="flex justify-between text-emerald-800 font-medium">
              <span>Coupon ({order.couponCode})</span>
              <span>-{formatCurrency(order.couponDiscountTotal || 0)}</span>
            </div>
          )}

          <div className="flex justify-between text-[#66746A]">
            <div>
              <span>Shipping</span>
              {order.shippingZoneName && (
                <span className="block text-[10px] text-stone-400">
                  {order.shippingZoneName} {order.estimatedDeliveryText ? `(${order.estimatedDeliveryText})` : ""}
                </span>
              )}
            </div>
            <span className="font-semibold text-[#1F2D22]">{formatCurrency(order.shippingTotal)}</span>
          </div>

          <div className="flex justify-between text-sm font-bold border-t border-[#DDE7DD] pt-2 text-[#1E5A3A]">
            <span>Total</span>
            <span>{formatCurrency(order.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Order Status History Timeline */}
      <div className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-5 sm:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        <h2 className="font-bold text-base text-[#1F2D22] flex items-center gap-2 border-b border-[#DDE7DD] pb-3 mb-4">
          <Clock size={18} className="text-[#1E5A3A]" /> Order history timeline
        </h2>

        <div className="relative border-l-2 border-[#DDE7DD] ml-3 space-y-5">
          {order.statusHistory.map((history) => (
            <div key={history.id} className="relative pl-6">
              <div className="absolute -left-[9px] top-1 size-4 rounded-full bg-[#1E5A3A] border-2 border-white" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-xs text-[#1F2D22]">{history.status}</span>
                {history.paymentStatus && (
                  <span className="text-[11px] text-[#66746A]">
                    (Payment: {history.paymentStatus})
                  </span>
                )}
                <span className="text-xs text-[#66746A] ml-auto">
                  {formatDate(history.createdAt)}
                </span>
              </div>
              {history.note && <p className="text-xs text-[#66746A] mt-1">{history.note}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <Modal
          open={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancel Order"
        >
          <form onSubmit={handleCancelSubmit} className="space-y-4 pt-2">
            <p className="text-xs text-[#66746A] leading-relaxed">
              Are you sure you want to cancel order <strong className="font-mono text-[#1F2D22]">{order.orderNumber}</strong>? Inventory items will be restored automatically.
            </p>

            {errorMessage && (
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-[14px] border border-red-200">
                {errorMessage}
              </p>
            )}

            <div>
              <label htmlFor="cancelReason" className="block text-xs font-semibold text-[#1F2D22] mb-1">
                Reason for cancellation <span className="font-normal text-[#66746A]">(optional)</span>
              </label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed my mind"
                className="w-full rounded-[14px] border border-[#DDE7DD] p-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#1E5A3A]"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCancelModal(false)}
                disabled={isSubmitting}
                className="h-10 text-xs font-semibold rounded-[14px]"
              >
                Keep Order
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-[14px]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" /> Cancelling...
                  </span>
                ) : (
                  "Confirm Cancellation"
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
