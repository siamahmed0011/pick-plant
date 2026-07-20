"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cancelCustomerOrderAction } from "@/app/account/orders/actions";
import { isCancellableByCustomer } from "@/lib/orders/order-transitions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { ArrowLeft, ShoppingBag, Truck, CreditCard, Clock, XCircle, Loader2 } from "lucide-react";

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
  grandTotal: number;
  createdAt: Date | string;
  items: OrderItem[];
  statusHistory: StatusHistoryItem[];
};

export function CustomerOrderDetailsView({ order }: { order: CustomerOrderDetails }) {
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
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--primary)] transition"
      >
        <ArrowLeft size={16} /> Back to My Orders
      </Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="font-mono text-2xl font-bold text-[var(--primary)]">
              {order.orderNumber}
            </h1>
            <p className="text-xs text-[var(--muted)]">Placed on {formatDate(order.createdAt)}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge className="text-sm px-3 py-1 bg-emerald-100 text-emerald-800">
              {order.status}
            </Badge>
            <Badge className="text-sm px-3 py-1 bg-blue-100 text-blue-800">
              {order.paymentStatus}
            </Badge>

            {canCancel && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="gap-1 text-xs"
              >
                <XCircle size={15} /> Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* Shipping & Payment Grid */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="font-bold text-sm text-[var(--primary)] flex items-center gap-2 mb-2">
              <Truck size={16} /> Shipping Details
            </h2>
            <p className="font-bold text-sm">{order.customerName}</p>
            <p className="text-xs text-[var(--muted)]">{order.customerPhone}</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              {order.shippingAddressLine1}
              {order.shippingAddressLine2 ? `, ${order.shippingAddressLine2}` : ""}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {order.shippingCity}, {order.shippingDistrict} {order.shippingPostalCode || ""}
            </p>
          </div>

          <div>
            <h2 className="font-bold text-sm text-[var(--primary)] flex items-center gap-2 mb-2">
              <CreditCard size={16} /> Payment Info
            </h2>
            <p className="text-sm">
              <span className="font-semibold">Method:</span>{" "}
              {order.paymentMethod || "Cash on Delivery"}
            </p>
            <p className="text-sm mt-1">
              <span className="font-semibold">Status:</span> {order.paymentStatus}
            </p>
            {order.customerNote && (
              <p className="text-xs text-[var(--muted)] mt-2 italic">
                &quot;{order.customerNote}&quot;
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Ordered Items */}
      <Card className="p-6">
        <h2 className="font-bold text-lg text-[var(--primary)] flex items-center gap-2 border-b pb-3">
          <ShoppingBag size={18} /> Order Items
        </h2>

        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="py-4 flex items-center gap-4">
              <img
                src={item.productImageUrl || "/images/placeholders/plant.svg"}
                alt={item.productName}
                className="size-16 rounded-xl object-cover bg-[var(--muted-surface)]"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{item.productName}</p>
                <p className="text-xs text-[var(--muted)]">SKU: {item.sku}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <div className="font-bold text-sm text-[var(--primary)]">
                {formatCurrency(item.lineTotal)}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 space-y-2 text-sm max-w-xs ml-auto">
          <div className="flex justify-between text-[var(--muted)]">
            <span>Subtotal</span>
            <span className="font-semibold text-black">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-[var(--muted)]">
            <span>Shipping</span>
            <span className="font-semibold text-black">{formatCurrency(order.shippingTotal)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t pt-2 text-[var(--primary)]">
            <span>Total</span>
            <span>{formatCurrency(order.grandTotal)}</span>
          </div>
        </div>
      </Card>

      {/* Status History Timeline */}
      <Card className="p-6">
        <h2 className="font-bold text-lg text-[var(--primary)] flex items-center gap-2 border-b pb-3 mb-4">
          <Clock size={18} /> Status History
        </h2>

        <div className="relative border-l-2 border-[var(--muted-surface)] ml-3 space-y-6">
          {order.statusHistory.map((history) => (
            <div key={history.id} className="relative pl-6">
              <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-[var(--primary)] border-2 border-white" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm text-[var(--primary)]">{history.status}</span>
                {history.paymentStatus && (
                  <span className="text-xs text-[var(--muted)]">
                    (Payment: {history.paymentStatus})
                  </span>
                )}
                <span className="text-xs text-[var(--muted)] ml-auto">
                  {formatDate(history.createdAt)}
                </span>
              </div>
              {history.note && <p className="text-xs text-[var(--muted)] mt-1">{history.note}</p>}
            </div>
          ))}
        </div>
      </Card>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <Modal
          open={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancel Order"
        >
          <form onSubmit={handleCancelSubmit} className="space-y-4 pt-2">
            <p className="text-sm text-[var(--muted)]">
              Are you sure you want to cancel order <strong className="font-mono">{order.orderNumber}</strong>? Inventory items will be restored automatically.
            </p>

            {errorMessage && (
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                {errorMessage}
              </p>
            )}

            <div>
              <label htmlFor="cancelReason" className="block text-xs font-semibold mb-1">
                Reason for cancellation (Optional)
              </label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed my mind"
                className="w-full rounded-xl border p-3 text-sm outline-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCancelModal(false)}
                disabled={isSubmitting}
              >
                Keep Order
              </Button>
              <Button type="submit" variant="danger" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Cancelling...
                  </>
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
