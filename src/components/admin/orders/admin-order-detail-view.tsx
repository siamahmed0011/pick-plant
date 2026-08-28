"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  updateOrderStatusAction,
  updatePaymentStatusAction,
  cancelAdminOrderAction,
  updateAdminNotesAction,
} from "@/app/admin/orders/actions";
import {
  isValidOrderStatusTransition,
  isValidPaymentStatusTransition,
  isCancellableByAdmin,
} from "@/lib/orders/order-transitions";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import {
  ArrowLeft,
  Truck,
  CreditCard,
  Clock,
  XCircle,
  Loader2,
  Save,
  User,
  ShoppingBag,
  FileText,
  Lock,
  CheckCircle2,
  Circle,
  ChevronRight,
  Zap,
  AlertTriangle,
  RefreshCw,
  Package,
} from "lucide-react";

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
  performedByName: string | null;
  performedByRole: string | null;
  createdAt: Date | string;
};

type PaymentTransactionItem = {
  id: string;
  provider: string;
  method: string | null;
  status: string;
  amount: number;
  currency: string;
  transactionId: string | null;
  providerReference: string | null;
  failureReason: string | null;
  createdAt: Date | string;
};

type AdminOrderDetails = {
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
  adminNotes: string | null;
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  couponCode?: string | null;
  couponDiscountTotal?: number;
  shippingZoneName?: string | null;
  shippingMethodName?: string | null;
  estimatedDeliveryText?: string | null;
  grandTotal: number;
  createdAt: Date | string;
  items: OrderItem[];
  statusHistory: StatusHistoryItem[];
  paymentTransactions?: PaymentTransactionItem[];
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Maps order status to a color scheme for badges */
function getOrderStatusStyle(status: OrderStatus) {
  switch (status) {
    case OrderStatus.PENDING:
      return "bg-amber-50 text-amber-800 border border-amber-200";
    case OrderStatus.CONFIRMED:
      return "bg-blue-50 text-blue-800 border border-blue-200";
    case OrderStatus.PROCESSING:
      return "bg-indigo-50 text-indigo-800 border border-indigo-200";
    case OrderStatus.SHIPPED:
      return "bg-purple-50 text-purple-800 border border-purple-200";
    case OrderStatus.DELIVERED:
      return "bg-emerald-50 text-emerald-800 border border-emerald-200";
    case OrderStatus.CANCELLED:
      return "bg-red-50 text-red-800 border border-red-200";
    case OrderStatus.RETURNED:
      return "bg-orange-50 text-orange-800 border border-orange-200";
    case OrderStatus.REFUNDED:
      return "bg-slate-50 text-slate-700 border border-slate-200";
    default:
      return "bg-stone-100 text-stone-700 border border-stone-200";
  }
}

function getPaymentStatusStyle(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.PAID:
      return "bg-emerald-50 text-emerald-800 border border-emerald-200";
    case PaymentStatus.PENDING:
      return "bg-amber-50 text-amber-800 border border-amber-200";
    case PaymentStatus.UNPAID:
      return "bg-red-50 text-red-700 border border-red-200";
    case PaymentStatus.FAILED:
      return "bg-red-50 text-red-800 border border-red-200";
    case PaymentStatus.REFUNDED:
      return "bg-slate-50 text-slate-700 border border-slate-200";
    case PaymentStatus.AUTHORIZED:
      return "bg-blue-50 text-blue-800 border border-blue-200";
    default:
      return "bg-stone-100 text-stone-700 border border-stone-200";
  }
}

/** Returns a human-readable label for the next primary action given the current status */
function getPrimaryAction(
  current: OrderStatus
): { label: string; next: OrderStatus; icon: React.ReactNode } | null {
  switch (current) {
    case OrderStatus.PENDING:
      return { label: "Confirm Order", next: OrderStatus.CONFIRMED, icon: <CheckCircle2 size={16} /> };
    case OrderStatus.CONFIRMED:
      return { label: "Start Processing", next: OrderStatus.PROCESSING, icon: <Package size={16} /> };
    case OrderStatus.PROCESSING:
      return { label: "Mark as Shipped", next: OrderStatus.SHIPPED, icon: <Truck size={16} /> };
    case OrderStatus.SHIPPED:
      return { label: "Mark as Delivered", next: OrderStatus.DELIVERED, icon: <CheckCircle2 size={16} /> };
    default:
      return null;
  }
}

/** The ordered fulfillment lifecycle steps */
const FULFILLMENT_STEPS: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

const TERMINAL_STATUSES = new Set<OrderStatus>([
  OrderStatus.CANCELLED,
  OrderStatus.RETURNED,
  OrderStatus.REFUNDED,
]);

const STEP_LABELS: Record<string, string> = {
  [OrderStatus.PENDING]: "Pending",
  [OrderStatus.CONFIRMED]: "Confirmed",
  [OrderStatus.PROCESSING]: "Processing",
  [OrderStatus.SHIPPED]: "Shipped",
  [OrderStatus.DELIVERED]: "Delivered",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminOrderDetailView({ order }: { order: AdminOrderDetails }) {
  // Status transition state
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<OrderStatus>(order.status);
  const [orderStatusNote, setOrderStatusNote] = useState("");
  const [isUpdatingOrderStatus, setIsUpdatingOrderStatus] = useState(false);

  // Payment status state
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus>(
    order.paymentStatus
  );
  const [paymentStatusNote, setPaymentStatusNote] = useState("");
  const [isUpdatingPaymentStatus, setIsUpdatingPaymentStatus] = useState(false);

  // Admin note state
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || "");
  const [isSavingAdminNotes, setIsSavingAdminNotes] = useState(false);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canCancel = isCancellableByAdmin(order.status);
  const primaryAction = getPrimaryAction(order.status);
  const isTerminal = TERMINAL_STATUSES.has(order.status);

  // Fulfillment pipeline state
  const currentStepIndex = FULFILLMENT_STEPS.indexOf(order.status);

  // ─── Handlers (unchanged from original) ───────────────────────────────────

  const handleUpdateOrderStatus = async (statusOverride?: OrderStatus) => {
    const targetStatus = statusOverride ?? selectedOrderStatus;
    if (targetStatus === order.status) return;
    setIsUpdatingOrderStatus(true);
    setMessage(null);

    const res = await updateOrderStatusAction({
      orderId: order.id,
      status: targetStatus,
      note: statusOverride ? undefined : (orderStatusNote || undefined),
    });

    setIsUpdatingOrderStatus(false);

    if (res.success) {
      setMessage({ type: "success", text: "Order status updated successfully." });
      setOrderStatusNote("");
    } else {
      setMessage({ type: "error", text: res.error || "Failed to update order status." });
    }
  };

  const handleUpdatePaymentStatus = async () => {
    if (selectedPaymentStatus === order.paymentStatus) return;
    setIsUpdatingPaymentStatus(true);
    setMessage(null);

    const res = await updatePaymentStatusAction({
      orderId: order.id,
      paymentStatus: selectedPaymentStatus,
      note: paymentStatusNote || undefined,
    });

    setIsUpdatingPaymentStatus(false);

    if (res.success) {
      setMessage({ type: "success", text: "Payment status updated successfully." });
      setPaymentStatusNote("");
    } else {
      setMessage({ type: "error", text: res.error || "Failed to update payment status." });
    }
  };

  const handleSaveAdminNotes = async () => {
    setIsSavingAdminNotes(true);
    setMessage(null);

    const res = await updateAdminNotesAction(order.id, adminNotes);
    setIsSavingAdminNotes(false);

    if (res.success) {
      setMessage({ type: "success", text: "Admin notes saved." });
    } else {
      setMessage({ type: "error", text: res.error || "Failed to save admin notes." });
    }
  };

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCancelling(true);
    setMessage(null);

    const res = await cancelAdminOrderAction(order.id, cancelReason);
    setIsCancelling(false);

    if (res.success) {
      setShowCancelModal(false);
      setMessage({ type: "success", text: "Order cancelled and inventory restored successfully." });
    } else {
      setMessage({ type: "error", text: res.error || "Failed to cancel order." });
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--primary)] transition"
      >
        <ArrowLeft size={16} />
        Back to Orders List
      </Link>

      {/* Global feedback message */}
      {message && (
        <div
          role="alert"
          aria-live="polite"
          className={`rounded-xl p-4 text-sm font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ── ORDER HEADER CARD ─────────────────────────────────────────────── */}
      <Card className="p-6">
        {/* Top row: order number + status badges */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              Order Details
            </p>
            <h1 className="font-mono text-3xl font-extrabold tracking-tight text-[var(--primary)] mt-1">
              {order.orderNumber}
            </h1>
            <p className="text-xs text-[var(--muted)] mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Fulfillment status */}
            <span
              aria-label={`Order status: ${order.status}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${getOrderStatusStyle(order.status)}`}
            >
              {isTerminal ? (
                order.status === OrderStatus.CANCELLED ? (
                  <XCircle size={14} aria-hidden="true" />
                ) : (
                  <RefreshCw size={14} aria-hidden="true" />
                )
              ) : (
                <Zap size={14} aria-hidden="true" />
              )}
              {order.status}
            </span>

            {/* Payment status */}
            <span
              aria-label={`Payment status: ${order.paymentStatus}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${getPaymentStatusStyle(order.paymentStatus)}`}
            >
              <CreditCard size={14} aria-hidden="true" />
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Info grid: Customer / Shipping / Payment Summary */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Customer */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              <User size={13} aria-hidden="true" />
              Customer
            </h2>
            <p className="font-bold text-sm">{order.customerName || "Guest Customer"}</p>
            {order.customerEmail && (
              <p className="text-xs text-[var(--muted)] mt-0.5">{order.customerEmail}</p>
            )}
            {order.customerPhone && (
              <p className="text-xs text-[var(--muted)] mt-0.5">{order.customerPhone}</p>
            )}
            {order.user && (
              <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Registered Account
              </span>
            )}
          </div>

          {/* Shipping */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              <Truck size={13} aria-hidden="true" />
              Delivery
            </h2>
            <address className="not-italic">
              <p className="text-sm font-semibold">
                {[order.shippingAddressLine1, order.shippingAddressLine2]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {[order.shippingCity, order.shippingDistrict, order.shippingPostalCode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </address>
            {order.shippingMethodName && (
              <p className="mt-1 text-xs text-[var(--muted)]">
                Method: <span className="font-semibold text-[var(--text)]">{order.shippingMethodName}</span>
              </p>
            )}
            {order.estimatedDeliveryText && (
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                ETA: <span className="font-semibold text-[var(--text)]">{order.estimatedDeliveryText}</span>
              </p>
            )}
            {order.customerNote && (
              <p className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs italic text-amber-900">
                &ldquo;{order.customerNote}&rdquo;
              </p>
            )}
          </div>

          {/* Payment Summary */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              <CreditCard size={13} aria-hidden="true" />
              Payment
            </h2>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted)]">Method</dt>
                <dd className="font-semibold">{order.paymentMethod || "COD"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted)]">Status</dt>
                <dd>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${getPaymentStatusStyle(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t pt-1 mt-1">
                <dt className="font-bold">Grand Total</dt>
                <dd className="font-extrabold text-[var(--primary)]">
                  {formatCurrency(order.grandTotal)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Destructive action — visually de-emphasized at bottom */}
        {canCancel && (
          <div className="mt-5 flex justify-end border-t pt-4">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              className="gap-1.5 text-xs opacity-80 hover:opacity-100"
              aria-label="Cancel this order and restore inventory"
            >
              <XCircle size={15} aria-hidden="true" />
              Cancel Order
            </Button>
          </div>
        )}
      </Card>

      {/* ── FULFILLMENT PIPELINE ──────────────────────────────────────────── */}
      <Card className="p-6">
        <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-[var(--primary)]">
          <Truck size={18} aria-hidden="true" />
          Fulfillment Progress
        </h2>

        {isTerminal ? (
          /* Terminal status display */
          <div
            className={`flex items-center gap-3 rounded-xl p-4 ${
              order.status === OrderStatus.CANCELLED
                ? "bg-red-50 border border-red-200"
                : order.status === OrderStatus.REFUNDED
                ? "bg-slate-50 border border-slate-200"
                : "bg-orange-50 border border-orange-200"
            }`}
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                order.status === OrderStatus.CANCELLED
                  ? "bg-red-100 text-red-700"
                  : order.status === OrderStatus.REFUNDED
                  ? "bg-slate-200 text-slate-700"
                  : "bg-orange-100 text-orange-700"
              }`}
              aria-hidden="true"
            >
              {order.status === OrderStatus.CANCELLED ? (
                <XCircle size={20} />
              ) : (
                <RefreshCw size={20} />
              )}
            </span>
            <div>
              <p className="font-bold text-sm">
                Order {order.status === OrderStatus.CANCELLED
                  ? "Cancelled"
                  : order.status === OrderStatus.RETURNED
                  ? "Returned"
                  : "Refunded"}
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                This order has reached a terminal state and cannot be advanced.
              </p>
            </div>
          </div>
        ) : (
          /* Active pipeline steps */
          <div className="relative">
            {/* Connector line */}
            <div
              className="absolute top-5 left-5 right-5 h-0.5 bg-[var(--border)]"
              aria-hidden="true"
            />
            <ol className="relative grid grid-cols-5 gap-1" aria-label="Order fulfillment steps">
              {FULFILLMENT_STEPS.map((step, index) => {
                const isDone = currentStepIndex > index;
                const isCurrent = currentStepIndex === index;
                return (
                  <li
                    key={step}
                    className="flex flex-col items-center gap-2 text-center"
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    <span
                      className={`relative z-10 flex size-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all ${
                        isDone
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                          : isCurrent
                          ? "border-[var(--primary)] bg-white text-[var(--primary)] shadow-md ring-4 ring-[var(--primary)]/10"
                          : "border-[var(--border)] bg-white text-[var(--muted)]"
                      }`}
                      aria-hidden="true"
                    >
                      {isDone ? (
                        <CheckCircle2 size={18} />
                      ) : isCurrent ? (
                        <Zap size={16} />
                      ) : (
                        <Circle size={16} />
                      )}
                    </span>
                    <span
                      className={`text-[11px] font-semibold leading-tight ${
                        isDone || isCurrent
                          ? "text-[var(--primary)]"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      {STEP_LABELS[step]}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Primary contextual action */}
        {primaryAction && isValidOrderStatusTransition(order.status, primaryAction.next) && (
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-[var(--muted-surface)] p-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-0.5">
                Recommended next step
              </p>
              <p className="text-sm font-semibold text-[var(--text)]">
                {primaryAction.label} — moves order to{" "}
                <span className="font-bold text-[var(--primary)]">{primaryAction.next}</span>
              </p>
            </div>
            <Button
              onClick={() => handleUpdateOrderStatus(primaryAction.next)}
              disabled={isUpdatingOrderStatus}
              variant="primary"
              size="sm"
              className="shrink-0 gap-1.5"
              aria-label={primaryAction.label}
            >
              {isUpdatingOrderStatus ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                primaryAction.icon
              )}
              <span className="whitespace-nowrap">{primaryAction.label}</span>
            </Button>
          </div>
        )}
      </Card>

      {/* ── ADMIN ACTION CONTROLS (Advanced) ─────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Status Controller */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 border-b pb-3 text-sm font-bold text-[var(--primary)] uppercase tracking-widest">
            <ChevronRight size={15} aria-hidden="true" />
            Manual Order Status
          </h2>
          <div className="space-y-3">
            <div>
              <label htmlFor="order-status-select" className="block text-xs font-semibold mb-1">
                New Status
              </label>
              <Select
                id="order-status-select"
                value={selectedOrderStatus}
                onChange={(e) => setSelectedOrderStatus(e.target.value as OrderStatus)}
              >
                {Object.values(OrderStatus).map((status) => {
                  const valid = isValidOrderStatusTransition(order.status, status);
                  return (
                    <option key={status} value={status} disabled={!valid}>
                      {status} {!valid ? "(Invalid Transition)" : ""}
                    </option>
                  );
                })}
              </Select>
            </div>

            <div>
              <label htmlFor="order-status-note" className="block text-xs font-semibold mb-1">
                Status Change Note <span className="font-normal text-[var(--muted)]">(Optional)</span>
              </label>
              <Textarea
                id="order-status-note"
                value={orderStatusNote}
                onChange={(e) => setOrderStatusNote(e.target.value)}
                placeholder="e.g. Package handed over to courier service"
                rows={2}
              />
            </div>

            <Button
              onClick={() => handleUpdateOrderStatus()}
              disabled={
                isUpdatingOrderStatus ||
                selectedOrderStatus === order.status ||
                !isValidOrderStatusTransition(order.status, selectedOrderStatus)
              }
              variant="primary"
              size="sm"
              className="w-full"
            >
              {isUpdatingOrderStatus ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Updating...
                </>
              ) : (
                "Update Order Status"
              )}
            </Button>
          </div>
        </Card>

        {/* Payment Status Controller */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 border-b pb-3 text-sm font-bold text-[var(--primary)] uppercase tracking-widest">
            <CreditCard size={15} aria-hidden="true" />
            Manual Payment Status
          </h2>
          <div className="space-y-3">
            <div>
              <label htmlFor="payment-status-select" className="block text-xs font-semibold mb-1">
                Payment Status
              </label>
              <Select
                id="payment-status-select"
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value as PaymentStatus)}
              >
                {Object.values(PaymentStatus).map((status) => {
                  const valid = isValidPaymentStatusTransition(order.paymentStatus, status);
                  return (
                    <option key={status} value={status} disabled={!valid}>
                      {status} {!valid ? "(Invalid Transition)" : ""}
                    </option>
                  );
                })}
              </Select>
            </div>

            <div>
              <label htmlFor="payment-status-note" className="block text-xs font-semibold mb-1">
                Payment Change Note <span className="font-normal text-[var(--muted)]">(Optional)</span>
              </label>
              <Textarea
                id="payment-status-note"
                value={paymentStatusNote}
                onChange={(e) => setPaymentStatusNote(e.target.value)}
                placeholder="e.g. Payment verified via bKash TxnID"
                rows={2}
              />
            </div>

            <Button
              onClick={handleUpdatePaymentStatus}
              disabled={
                isUpdatingPaymentStatus ||
                selectedPaymentStatus === order.paymentStatus ||
                !isValidPaymentStatusTransition(order.paymentStatus, selectedPaymentStatus)
              }
              variant="primary"
              size="sm"
              className="w-full"
            >
              {isUpdatingPaymentStatus ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Updating...
                </>
              ) : (
                "Update Payment Status"
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* ── PAYMENT TRANSACTIONS & VERIFICATION ──────────────────────────── */}
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 border-b pb-3 text-base font-bold text-[var(--primary)]">
          <CreditCard size={18} aria-hidden="true" />
          Payment Transactions &amp; Verification
        </h2>

        {!order.paymentTransactions || order.paymentTransactions.length === 0 ? (
          <p className="text-xs text-[var(--muted)] py-2">
            No payment transactions recorded for this order.
          </p>
        ) : (
          <div className="space-y-4">
            {order.paymentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--muted-surface)]/50 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-sm">{tx.provider}</span>
                    {tx.method && (
                      <span className="ml-2 text-xs text-[var(--muted)]">({tx.method})</span>
                    )}
                  </div>
                  <span
                    aria-label={`Transaction status: ${tx.status}`}
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      tx.status === "VERIFIED" || tx.status === "SUCCESS"
                        ? "bg-emerald-100 text-emerald-800"
                        : tx.status === "FAILED"
                        ? "bg-red-100 text-red-800"
                        : tx.status === "REFUNDED"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                  <div>
                    <dt className="text-[var(--muted)]">Amount</dt>
                    <dd className="font-bold text-sm mt-0.5">
                      ৳{tx.amount} {tx.currency}
                    </dd>
                  </div>
                  {tx.transactionId && (
                    <div>
                      <dt className="text-[var(--muted)]">Transaction ID</dt>
                      <dd className="font-mono font-semibold mt-0.5 break-all">{tx.transactionId}</dd>
                    </div>
                  )}
                  {tx.providerReference && (
                    <div>
                      <dt className="text-[var(--muted)]">Reference / TxnID</dt>
                      <dd className="font-mono font-semibold mt-0.5 break-all">{tx.providerReference}</dd>
                    </div>
                  )}
                </dl>

                {tx.failureReason && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
                    <p className="text-xs text-red-700 font-medium">{tx.failureReason}</p>
                  </div>
                )}

                {/* Manual payment verification actions */}
                {tx.provider === "MANUAL" && tx.status === "PENDING" && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t">
                    <p className="w-full text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      ⚠️ Manual payment awaiting verification
                    </p>
                    <Button
                      size="sm"
                      variant="primary"
                      aria-label="Verify this manual payment"
                      onClick={async () => {
                        const res = await fetch("/api/admin/payments", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "verify_manual", transactionId: tx.id }),
                        });
                        if (res.ok) window.location.reload();
                      }}
                    >
                      <CheckCircle2 size={15} aria-hidden="true" />
                      Verify Payment
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      aria-label="Reject this manual payment"
                      onClick={async () => {
                        const reason = prompt("Enter reason for rejection:");
                        if (!reason) return;
                        const res = await fetch("/api/admin/payments", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "reject_manual", transactionId: tx.id, reason }),
                        });
                        if (res.ok) window.location.reload();
                      }}
                    >
                      <XCircle size={15} aria-hidden="true" />
                      Reject Payment
                    </Button>
                  </div>
                )}

                {tx.provider === "CASH_ON_DELIVERY" && order.paymentStatus === "PENDING" && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Button
                      size="sm"
                      variant="primary"
                      aria-label="Mark cash on delivery payment as collected"
                      onClick={async () => {
                        const res = await fetch("/api/admin/payments", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "mark_cod_paid", orderId: order.id }),
                        });
                        if (res.ok) window.location.reload();
                      }}
                    >
                      <CheckCircle2 size={15} aria-hidden="true" />
                      Mark COD as Collected (PAID)
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── ORDER ITEMS SNAPSHOT ──────────────────────────────────────────── */}
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 border-b pb-3 text-base font-bold text-[var(--primary)]">
          <ShoppingBag size={18} aria-hidden="true" />
          Order Items Snapshot
        </h2>

        {/* Items list */}
        <div className="divide-y divide-[var(--border)]">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-4">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-[var(--muted-surface)]">
                <Image
                  src={item.productImageUrl || "/images/placeholders/plant.svg"}
                  alt={item.productName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{item.productName}</p>
                <p className="text-xs text-[var(--muted)]">SKU: {item.sku}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {item.quantity} × {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-bold text-sm text-[var(--primary)]">
                  {formatCurrency(item.lineTotal)}
                </p>
                <p className="text-[10px] text-[var(--muted)]">Line total</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order totals */}
        <div className="ml-auto mt-4 max-w-xs space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between text-[var(--muted)]">
            <span>Subtotal</span>
            <span className="font-semibold text-[var(--text)]">{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>
                Discount{order.couponCode ? ` (${order.couponCode})` : ""}
              </span>
              <span className="font-semibold">−{formatCurrency(order.discountTotal)}</span>
            </div>
          )}
          {order.couponDiscountTotal !== undefined && order.couponDiscountTotal > 0 && order.discountTotal === 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Coupon{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span className="font-semibold">−{formatCurrency(order.couponDiscountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-[var(--muted)]">
            <span>Shipping{order.shippingMethodName ? ` (${order.shippingMethodName})` : ""}</span>
            <span className="font-semibold text-[var(--text)]">{formatCurrency(order.shippingTotal)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-extrabold text-[var(--primary)]">
            <span>Grand Total</span>
            <span>{formatCurrency(order.grandTotal)}</span>
          </div>
        </div>
      </Card>

      {/* ── ADMIN INTERNAL NOTES ──────────────────────────────────────────── */}
      <Card className="p-6">
        <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-[var(--primary)]">
          <FileText size={18} aria-hidden="true" />
          Admin Internal Notes
        </h2>
        <p className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] border-b pb-3">
          <Lock size={11} aria-hidden="true" />
          Internal only — not visible to customers
        </p>
        <div className="space-y-3">
          <Textarea
            id="admin-notes"
            aria-label="Admin internal notes — visible only to administrators"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add internal notes accessible only to administrators..."
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSaveAdminNotes}
              disabled={isSavingAdminNotes}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              {isSavingAdminNotes ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save size={14} aria-hidden="true" />
              )}
              Save Notes
            </Button>
          </div>
        </div>
      </Card>

      {/* ── READ-ONLY STATUS & AUDIT TIMELINE ────────────────────────────── */}
      <Card className="p-6">
        <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-[var(--primary)]">
          <Clock size={18} aria-hidden="true" />
          Status &amp; Audit Timeline
        </h2>
        <p className="mb-5 text-xs text-[var(--muted)] border-b pb-3">
          Read-only record of all order status changes
        </p>

        <ol className="relative border-l-2 border-[var(--muted-surface)] ml-3 space-y-6">
          {order.statusHistory.map((history, index) => {
            const isAdmin = history.performedByRole === "ADMIN";
            const isCustomer =
              history.performedByRole === "CUSTOMER" || history.performedByRole === "GUEST";
            const isFirst = index === 0;

            return (
              <li key={history.id} className="relative pl-6">
                {/* Timeline dot */}
                <span
                  aria-hidden="true"
                  className={`absolute -left-[9px] top-1 size-4 rounded-full border-2 border-white ${
                    isAdmin
                      ? "bg-[var(--primary)]"
                      : isCustomer
                      ? "bg-blue-500"
                      : "bg-[var(--muted)]"
                  }`}
                />

                {/* Status + date */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-bold text-sm text-[var(--primary)]">
                    {history.status}
                  </span>
                  {history.paymentStatus && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getPaymentStatusStyle(history.paymentStatus)}`}
                    >
                      {history.paymentStatus}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-[var(--muted)]">
                    {formatDate(history.createdAt)}
                  </span>
                </div>

                {/* Actor attribution — context-aware */}
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  {isFirst && isCustomer
                    ? `Order placed by: ${history.performedByName || "Customer"}`
                    : isAdmin
                    ? `Updated by admin: ${history.performedByName || "Pick Plant Admin"}`
                    : isCustomer
                    ? `Action by customer: ${history.performedByName || "Customer"}`
                    : `System`}
                </p>

                {history.note && (
                  <p className="mt-1 text-xs text-[var(--muted)] italic">{history.note}</p>
                )}
              </li>
            );
          })}
        </ol>
      </Card>

      {/* ── CANCELLATION MODAL ────────────────────────────────────────────── */}
      {showCancelModal && (
        <Modal
          open={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancel Order &amp; Restore Inventory"
        >
          <form onSubmit={handleCancelOrder} className="space-y-4 pt-2">
            <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-3">
              <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
              <p className="text-sm text-red-800">
                Cancelling order <strong className="font-mono">{order.orderNumber}</strong> will
                restore item stock levels and create an inventory movement record.
              </p>
            </div>

            <div>
              <label htmlFor="cancelReason" className="block text-xs font-semibold mb-1">
                Reason for cancellation <span aria-hidden="true" className="text-[var(--danger)]">*</span>
              </label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer requested cancellation / Out of stock"
                className="w-full rounded-xl border p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                rows={3}
                required
                aria-required="true"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                Dismiss
              </Button>
              <Button type="submit" variant="danger" disabled={isCancelling}>
                {isCancelling ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Cancelling &amp; Restocking...
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
