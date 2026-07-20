"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
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
  grandTotal: number;
  createdAt: Date | string;
  items: OrderItem[];
  statusHistory: StatusHistoryItem[];
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

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

  // Handle Order Status Update
  const handleUpdateOrderStatus = async () => {
    if (selectedOrderStatus === order.status) return;
    setIsUpdatingOrderStatus(true);
    setMessage(null);

    const res = await updateOrderStatusAction({
      orderId: order.id,
      status: selectedOrderStatus,
      note: orderStatusNote || undefined,
    });

    setIsUpdatingOrderStatus(false);

    if (res.success) {
      setMessage({ type: "success", text: "Order status updated successfully." });
      setOrderStatusNote("");
    } else {
      setMessage({ type: "error", text: res.error || "Failed to update order status." });
    }
  };

  // Handle Payment Status Update
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

  // Handle Admin Notes Save
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

  // Handle Order Cancellation
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

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--primary)] transition"
      >
        <ArrowLeft size={16} /> Back to Orders List
      </Link>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Header Info */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div>
            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              Order Details
            </span>
            <h1 className="font-mono text-3xl font-extrabold text-[var(--primary)]">
              {order.orderNumber}
            </h1>
            <p className="text-xs text-[var(--muted)] mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
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

        {/* Info Grid */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div>
            <h2 className="font-bold text-sm text-[var(--primary)] flex items-center gap-2 mb-2">
              <User size={16} /> Customer Details
            </h2>
            <p className="font-bold text-sm">{order.customerName || "Guest Customer"}</p>
            <p className="text-xs text-[var(--muted)]">{order.customerEmail || "No email"}</p>
            <p className="text-xs text-[var(--muted)]">{order.customerPhone || "No phone"}</p>
            {order.user && (
              <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                Registered Account User
              </p>
            )}
          </div>

          <div>
            <h2 className="font-bold text-sm text-[var(--primary)] flex items-center gap-2 mb-2">
              <Truck size={16} /> Shipping Address
            </h2>
            <p className="text-xs text-[var(--muted)]">
              {order.shippingAddressLine1}
              {order.shippingAddressLine2 ? `, ${order.shippingAddressLine2}` : ""}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {order.shippingCity}, {order.shippingDistrict} {order.shippingPostalCode || ""}
            </p>
            {order.customerNote && (
              <p className="text-xs italic text-amber-900 bg-amber-50 p-2 rounded mt-2 border border-amber-200">
                Note: &quot;{order.customerNote}&quot;
              </p>
            )}
          </div>

          <div>
            <h2 className="font-bold text-sm text-[var(--primary)] flex items-center gap-2 mb-2">
              <CreditCard size={16} /> Payment Summary
            </h2>
            <p className="text-xs font-semibold">
              Payment Method: <span className="font-normal">{order.paymentMethod || "COD"}</span>
            </p>
            <p className="text-xs font-semibold mt-1">
              Grand Total:{" "}
              <span className="font-bold text-[var(--primary)]">
                {formatCurrency(order.grandTotal)}
              </span>
            </p>
          </div>
        </div>
      </Card>

      {/* Admin Action Controls */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Status Controller */}
        <Card className="p-6">
          <h2 className="font-bold text-base text-[var(--primary)] border-b pb-3 mb-4">
            Update Order Status
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1">New Status</label>
              <Select
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
              <label className="block text-xs font-semibold mb-1">
                Status Change Note (Optional)
              </label>
              <Textarea
                value={orderStatusNote}
                onChange={(e) => setOrderStatusNote(e.target.value)}
                placeholder="e.g. Package handed over to courier service"
                rows={2}
              />
            </div>

            <Button
              onClick={handleUpdateOrderStatus}
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
                  <Loader2 className="size-4 animate-spin" /> Updating...
                </>
              ) : (
                "Update Order Status"
              )}
            </Button>
          </div>
        </Card>

        {/* Payment Status Controller */}
        <Card className="p-6">
          <h2 className="font-bold text-base text-[var(--primary)] border-b pb-3 mb-4">
            Update Payment Status
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Payment Status</label>
              <Select
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
              <label className="block text-xs font-semibold mb-1">
                Payment Change Note (Optional)
              </label>
              <Textarea
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
                  <Loader2 className="size-4 animate-spin" /> Updating...
                </>
              ) : (
                "Update Payment Status"
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Admin Notes Section */}
      <Card className="p-6">
        <h2 className="font-bold text-base text-[var(--primary)] flex items-center gap-2 border-b pb-3 mb-4">
          <FileText size={18} /> Admin Internal Notes
        </h2>
        <div className="space-y-3">
          <Textarea
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
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save Admin Notes
            </Button>
          </div>
        </div>
      </Card>

      {/* Order Items Table */}
      <Card className="p-6">
        <h2 className="font-bold text-lg text-[var(--primary)] flex items-center gap-2 border-b pb-3 mb-4">
          <ShoppingBag size={18} /> Order Items Snapshot
        </h2>

        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 flex items-center gap-4">
              <img
                src={item.productImageUrl || "/images/placeholders/plant.svg"}
                alt={item.productName}
                className="size-14 rounded-lg object-cover bg-[var(--muted-surface)]"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{item.productName}</p>
                <p className="text-xs text-[var(--muted)]">SKU: {item.sku}</p>
                <p className="text-xs text-[var(--muted)]">
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
            <span>Grand Total</span>
            <span>{formatCurrency(order.grandTotal)}</span>
          </div>
        </div>
      </Card>

      {/* Read-Only Status History Timeline */}
      <Card className="p-6">
        <h2 className="font-bold text-lg text-[var(--primary)] flex items-center gap-2 border-b pb-3 mb-4">
          <Clock size={18} /> Read-Only Status & Audit Timeline
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
              <p className="text-xs font-semibold text-[var(--muted)] mt-0.5">
                By: {history.performedByName || "System"} ({history.performedByRole || "SYSTEM"})
              </p>
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
          title="Cancel Order & Restore Inventory"
        >
          <form onSubmit={handleCancelOrder} className="space-y-4 pt-2">
            <p className="text-sm text-[var(--muted)]">
              Cancelling order <strong className="font-mono">{order.orderNumber}</strong> will restore item stock levels and create an inventory movement record.
            </p>

            <div>
              <label htmlFor="cancelReason" className="block text-xs font-semibold mb-1">
                Reason for cancellation
              </label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer requested cancellation / Out of stock"
                className="w-full rounded-xl border p-3 text-sm outline-none"
                rows={3}
                required
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
                    <Loader2 className="size-4 animate-spin" /> Cancelling & Restocking...
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
