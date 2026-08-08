"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/providers/cart-provider";
import {
  completeCheckoutSubmissionAction,
  placeOrderAction,
  prepareCheckoutSubmissionAction,
} from "@/app/(store)/checkout/actions";
import { checkoutFormSchema, type CheckoutInput } from "@/lib/orders/order-validation";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ShoppingBag, Truck, CreditCard, Loader2, AlertCircle, TicketPercent, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PaymentProvider } from "@/generated/prisma/enums";
import {
  asOnlinePaymentProvider,
  type OnlinePaymentProvider,
} from "@/lib/orders/payment-initiation-eligibility";
import { requestOnlinePaymentRedirect } from "@/lib/payments/client-payment-initiation";
import { PaymentRetryButton } from "@/components/payments/payment-retry-button";
import { ManualPaymentSelector } from "./manual-payment-selector";
import type { MobileBankingChannelId } from "@/config/payment-channels";

type Props = {
  availableOnlineProviders: OnlinePaymentProvider[];
  authenticationError?: string | null;
  initialUser?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
};

type PendingOnlinePayment = {
  orderId: string;
  orderNumber: string;
  provider: OnlinePaymentProvider;
  expiresAt: string;
  retryEligible: boolean;
};

export function CheckoutForm({
  availableOnlineProviders,
  authenticationError,
  initialUser,
}: Props) {
  const router = useRouter();
  const { items, subtotal, clearCart, hydrated } = useCart();
  const submissionInFlight = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState<
    "placing" | "initiating"
  >("placing");
  const [pendingPayment, setPendingPayment] =
    useState<PendingOnlinePayment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    authenticationError ?? null,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    name: string;
    discountAmount: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    customerName: initialUser?.name || "",
    customerEmail: initialUser?.email || "",
    customerPhone: initialUser?.phone || "",
    shippingAddressLine1: "",
    shippingAddressLine2: "",
    shippingCity: "Dhaka",
    shippingDistrict: "Dhaka",
    shippingArea: "",
    shippingPostalCode: "",
    paymentMethod: "COD",
    manualPaymentChannel: "bKash",
    manualTransactionRef: "",
    customerNote: "",
  });

  // Dynamic Shipping Fee calculation derived from district location & subtotal
  const isDhakaLocation = (formData.shippingDistrict || "Dhaka").toLowerCase().includes("dhaka");
  const shippingTotal = isDhakaLocation ? (subtotal >= 2000 ? 0 : 60) : (subtotal >= 3500 ? 0 : 120);
  const estimatedDeliveryText = isDhakaLocation ? "1-2 business days" : "3-5 business days";
  const shippingZoneName = isDhakaLocation ? "Dhaka City" : "Outside Dhaka";

  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, subtotal + shippingTotal - couponDiscount);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const res = await fetch("/api/checkout/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shippingDistrict: formData.shippingDistrict,
          couponCode: couponCodeInput.trim().toUpperCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.couponInfo) {
        throw new Error(data.error || "Invalid coupon code.");
      }

      setAppliedCoupon({
        code: data.couponInfo.code,
        name: data.couponInfo.name,
        discountAmount: data.couponDiscount,
      });
      setCouponSuccess(`Coupon "${data.couponInfo.code}" applied! You saved ${formatCurrency(data.couponDiscount)}.`);
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Coupon application failed.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponSuccess(null);
    setCouponError(null);
  };

  const finishCheckoutSubmission = async () => {
    clearCart();
    try {
      await completeCheckoutSubmissionAction();
    } catch {
      // The signed checkout key also has a hard expiry.
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submissionInFlight.current || pendingPayment) return;
    if (authenticationError) {
      setErrorMessage(authenticationError);
      return;
    }
    setErrorMessage(null);
    setFieldErrors({});

    if (items.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    if (formData.paymentMethod === "MANUAL") {
      const ref = formData.manualTransactionRef.trim();
      if (!ref) {
        setFieldErrors({ manualTransactionRef: "Please enter your Transaction ID or reference number." });
        setErrorMessage("Please enter your Transaction ID or reference number for Send Money payment.");
        return;
      }
      if (ref.length < 6 || !/^[A-Za-z0-9_-]{6,30}$/.test(ref)) {
        setFieldErrors({ manualTransactionRef: "Transaction ID must be at least 6 alphanumeric characters (e.g. 9B87A6C5)." });
        setErrorMessage("Transaction ID must be at least 6 alphanumeric characters (e.g. 9B87A6C5).");
        return;
      }
    }

    const payload: CheckoutInput = {
      ...formData,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    const parsed = checkoutFormSchema.safeParse(payload);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[String(err.path[0])] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    submissionInFlight.current = true;
    setSubmissionStage("placing");
    setIsSubmitting(true);
    let navigationStarted = false;

    try {
      const prepared = await prepareCheckoutSubmissionAction();
      if (!prepared.success) {
        setErrorMessage(prepared.error);
        return;
      }

      const result = await placeOrderAction(parsed.data);
      if (result.success) {
        const onlineProvider = asOnlinePaymentProvider(
          result.paymentProvider,
        );

        if (onlineProvider) {
          const pendingOrder = {
            orderId: result.orderId,
            orderNumber: result.orderNumber,
            provider: onlineProvider,
            expiresAt: result.expiresAt ?? "",
            retryEligible: true,
          };
          setPendingPayment(pendingOrder);
          setSubmissionStage("initiating");

          const payment = await requestOnlinePaymentRedirect(
            result.orderId,
            onlineProvider,
          );

          if (payment.success) {
            navigationStarted = true;
            await finishCheckoutSubmission();
            window.location.assign(payment.redirectUrl);
            return;
          }

          if (payment.unavailable) {
            setPendingPayment((current) =>
              current ? { ...current, retryEligible: false } : current,
            );
          }
          setErrorMessage(
            payment.unavailable
              ? "Payment can no longer be started for this order. Your cart has been preserved."
              : "Your order was created, but payment could not be started. Retry payment below; your cart has been preserved.",
          );
          return;
        }

        if (
          result.paymentProvider === PaymentProvider.CASH_ON_DELIVERY ||
          result.paymentProvider === PaymentProvider.MANUAL
        ) {
          navigationStarted = true;
          await finishCheckoutSubmission();
          router.push(
            `/checkout/success?orderNumber=${encodeURIComponent(result.orderNumber)}`,
          );
          return;
        }

        setErrorMessage(
          "Your order was created, but its payment method could not be continued safely.",
        );
      } else {
        setErrorMessage(result.error);
      }
    } catch {
      setErrorMessage("An error occurred while processing your order. Please try again.");
    } finally {
      if (!navigationStarted) {
        submissionInFlight.current = false;
        setIsSubmitting(false);
      }
    }
  };

  if (!hydrated) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-[var(--primary)]" />
        <p className="mt-3 text-[var(--muted)]">Loading checkout...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <ShoppingBag className="mx-auto size-12 text-[var(--muted)]" />
        <h2 className="mt-4 text-2xl font-bold">Your cart is empty</h2>
        <p className="mt-2 text-[var(--muted)]">Add some plants to your cart before checking out.</p>
        <Link
          href="/plants"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]"
        >
          Browse Plants
        </Link>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-12">
      {/* Left Column - Delivery & Customer Information */}
      <div className="space-y-6 lg:col-span-7">
        {errorMessage && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            <AlertCircle className="size-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--primary)]">
            <Truck className="size-5" /> Customer & Shipping Information
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="customerName" className="block text-sm font-semibold mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="e.g. Tanvir Hossain"
                required
              />
              {fieldErrors.customerName && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.customerName}</p>
              )}
            </div>

            <div>
              <label htmlFor="customerEmail" className="block text-sm font-semibold mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                id="customerEmail"
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                placeholder="tanvir@example.com"
                required
              />
              {fieldErrors.customerEmail && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.customerEmail}</p>
              )}
            </div>

            <div>
              <label htmlFor="customerPhone" className="block text-sm font-semibold mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <Input
                id="customerPhone"
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                placeholder="01700000000"
                required
              />
              {fieldErrors.customerPhone && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.customerPhone}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="shippingAddressLine1" className="block text-sm font-semibold mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <Input
                id="shippingAddressLine1"
                name="shippingAddressLine1"
                value={formData.shippingAddressLine1}
                onChange={handleChange}
                placeholder="House #12, Road #4, Block C"
                required
              />
              {fieldErrors.shippingAddressLine1 && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.shippingAddressLine1}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="shippingAddressLine2" className="block text-sm font-semibold mb-1">
                Apartment / Suite / Landmark (Optional)
              </label>
              <Input
                id="shippingAddressLine2"
                name="shippingAddressLine2"
                value={formData.shippingAddressLine2}
                onChange={handleChange}
                placeholder="2nd Floor, Apt 2B"
              />
            </div>

            <div>
              <label htmlFor="shippingCity" className="block text-sm font-semibold mb-1">
                City / Division <span className="text-red-500">*</span>
              </label>
              <Input
                id="shippingCity"
                name="shippingCity"
                value={formData.shippingCity}
                onChange={handleChange}
                placeholder="Dhaka"
                required
              />
            </div>

            <div>
              <label htmlFor="shippingDistrict" className="block text-sm font-semibold mb-1">
                District <span className="text-red-500">*</span>
              </label>
              <select
                id="shippingDistrict"
                name="shippingDistrict"
                value={formData.shippingDistrict}
                onChange={handleChange}
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="Dhaka">Dhaka</option>
                <option value="Chittagong">Chittagong</option>
                <option value="Rajshahi">Rajshahi</option>
                <option value="Khulna">Khulna</option>
                <option value="Barisal">Barisal</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Rangpur">Rangpur</option>
                <option value="Mymensingh">Mymensingh</option>
                <option value="Comilla">Comilla</option>
                <option value="Gazipur">Gazipur</option>
                <option value="Narayanganj">Narayanganj</option>
                <option value="Outside Dhaka">Other District (Outside Dhaka)</option>
              </select>
            </div>

            <div>
              <label htmlFor="shippingArea" className="block text-sm font-semibold mb-1">
                Area / Thana (Optional)
              </label>
              <Input
                id="shippingArea"
                name="shippingArea"
                value={formData.shippingArea}
                onChange={handleChange}
                placeholder="Dhanmondi"
              />
            </div>

            <div>
              <label htmlFor="shippingPostalCode" className="block text-sm font-semibold mb-1">
                Postal Code (Optional)
              </label>
              <Input
                id="shippingPostalCode"
                name="shippingPostalCode"
                value={formData.shippingPostalCode}
                onChange={handleChange}
                placeholder="1209"
              />
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--primary)]">
            <CreditCard className="size-5" /> Payment Method
          </h2>
          <div className="mt-4 space-y-3">
            {/* Cash on Delivery */}
            <label className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-[var(--muted-surface)] transition">
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={formData.paymentMethod === "COD"}
                onChange={handleChange}
                className="size-4 text-[var(--primary)]"
              />
              <div>
                <p className="font-bold">Cash on Delivery (COD)</p>
                <p className="text-xs text-[var(--muted)]">Pay cash when your plants arrive at your doorstep</p>
              </div>
            </label>

            {/* Manual Payment */}
            <label className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-[var(--muted-surface)] transition">
              <input
                type="radio"
                name="paymentMethod"
                value="MANUAL"
                checked={formData.paymentMethod === "MANUAL"}
                onChange={handleChange}
                className="size-4 text-[var(--primary)]"
              />
              <div>
                <p className="font-bold">Send Money (bKash, Nagad, Rocket, Bank Transfer)</p>
                <p className="text-xs text-[var(--muted)]">
                  Manual Send Money payment to our personal wallet or bank account
                </p>
              </div>
            </label>

            {/* Manual Payment Inputs */}
            {formData.paymentMethod === "MANUAL" && (
              <ManualPaymentSelector
                selectedChannel={(formData.manualPaymentChannel as MobileBankingChannelId) || "bKash"}
                onSelectChannel={(ch) =>
                  setFormData((prev) => ({ ...prev, manualPaymentChannel: ch }))
                }
                transactionRef={formData.manualTransactionRef}
                onChangeTransactionRef={(val) => {
                  setFormData((prev) => ({ ...prev, manualTransactionRef: val }));
                  if (fieldErrors.manualTransactionRef) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.manualTransactionRef;
                      return next;
                    });
                  }
                }}
                grandTotal={grandTotal}
                error={fieldErrors.manualTransactionRef}
              />
            )}

            {availableOnlineProviders.includes(PaymentProvider.STRIPE) && (
              <label className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-[var(--muted-surface)] transition">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="STRIPE"
                  checked={formData.paymentMethod === "STRIPE"}
                  onChange={handleChange}
                  className="size-4 text-[var(--primary)]"
                />
                <div>
                  <p className="font-bold">Credit / Debit Card (Stripe)</p>
                  <p className="text-xs text-[var(--muted)]">
                    Continue to Stripe Checkout after placing your order
                  </p>
                </div>
              </label>
            )}

            {availableOnlineProviders.includes(
              PaymentProvider.SSLCOMMERZ,
            ) && (
              <label className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-[var(--muted-surface)] transition">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="SSLCOMMERZ"
                  checked={formData.paymentMethod === "SSLCOMMERZ"}
                  onChange={handleChange}
                  className="size-4 text-[var(--primary)]"
                />
                <div>
                  <p className="font-bold">
                    Card / Mobile Banking (SSLCommerz)
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Continue to the secure SSLCommerz gateway after ordering
                  </p>
                </div>
              </label>
            )}
          </div>

          <div className="mt-5">
            <label htmlFor="customerNote" className="block text-sm font-semibold mb-1">
              Order Notes / Delivery Instructions (Optional)
            </label>
            <Textarea
              id="customerNote"
              name="customerNote"
              value={formData.customerNote}
              onChange={handleChange}
              placeholder="e.g. Please call before delivery"
              rows={3}
            />
          </div>
        </Card>
      </div>

      {/* Right Column - Order Summary & Coupon Input */}
      <div className="space-y-6 lg:col-span-5">
        <Card className="p-6 sticky top-24 space-y-6">
          <h2 className="text-xl font-bold text-[var(--primary)] border-b pb-4">Order Summary</h2>

          {/* Coupon Code Form */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-700">Have a Promo Coupon?</label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <div>
                    <p className="font-bold font-mono">{appliedCoupon.code}</p>
                    <p className="text-[11px] text-emerald-600">Saved {formatCurrency(appliedCoupon.discountAmount)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs font-semibold text-stone-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Coupon Code (e.g. SUMMER20)"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  className="uppercase font-mono text-xs"
                />
                <Button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCodeInput.trim()}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  {couponLoading ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                </Button>
              </div>
            )}

            {couponError && <p className="text-xs text-red-600 font-medium">{couponError}</p>}
            {couponSuccess && <p className="text-xs text-emerald-600 font-medium">{couponSuccess}</p>}
          </div>

          <ul className="divide-y max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3 py-3">
                <div className="relative size-14 shrink-0 rounded-lg overflow-hidden bg-[var(--muted-surface)]">
                  <Image
                    src={item.image || "/images/placeholders/plant.svg"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate text-sm">{item.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    Qty: {item.quantity} × {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="font-bold text-sm">
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t pt-4 space-y-2.5 text-sm">
            <div className="flex justify-between text-[var(--muted)]">
              <span>Subtotal</span>
              <span className="font-semibold text-black">{formatCurrency(subtotal)}</span>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span className="flex items-center gap-1">
                  <TicketPercent size={14} /> Coupon ({appliedCoupon.code})
                </span>
                <span>-{formatCurrency(couponDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between text-[var(--muted)]">
              <div>
                <span>Shipping Fee</span>
                <span className="block text-[11px] text-stone-400">
                  {shippingZoneName} ({estimatedDeliveryText})
                </span>
              </div>
              <span className="font-semibold text-black">
                {shippingTotal === 0 ? <span className="text-emerald-600">FREE</span> : formatCurrency(shippingTotal)}
              </span>
            </div>

            <div className="flex justify-between text-base font-bold border-t pt-3 text-[var(--primary)]">
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {pendingPayment && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">
                Order {pendingPayment.orderNumber} is waiting for payment.
              </p>
              <p className="mt-1 text-xs text-amber-800">
                Retrying uses this order and will not create another order.
              </p>
              {pendingPayment.expiresAt && pendingPayment.retryEligible ? (
                <PaymentRetryButton
                  className="mt-3"
                  orderId={pendingPayment.orderId}
                  provider={pendingPayment.provider}
                  expiresAt={pendingPayment.expiresAt}
                  label="Pay now"
                  onRedirectReady={finishCheckoutSubmission}
                />
              ) : (
                <p className="mt-2 text-xs text-amber-800">
                  This order is not eligible for another payment attempt.
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-6"
            disabled={
              isSubmitting ||
              Boolean(pendingPayment) ||
              Boolean(authenticationError)
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                {submissionStage === "initiating"
                  ? "Connecting to payment..."
                  : "Placing Order..."}
              </>
            ) : pendingPayment ? (
              "Order already created"
            ) : (
              `Place Order (${formatCurrency(grandTotal)})`
            )}
          </Button>
        </Card>
      </div>
    </form>
  );
}
