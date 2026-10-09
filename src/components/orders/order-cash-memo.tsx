"use client";

import { useRef } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer, ShieldCheck, ShoppingBag } from "lucide-react";

export type CashMemoOrder = {
  id: string;
  orderNumber: string;
  createdAt: Date | string;
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
  paymentMethod: string | null;
  paymentProvider?: string | null;
  paymentStatus: string;
  status: string;
  subtotal: number | string;
  shippingTotal: number | string;
  discountTotal?: number | string;
  couponCode?: string | null;
  shippingZoneName?: string | null;
  grandTotal: number | string;
  items: Array<{
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number | string;
    lineTotal: number | string;
  }>;
};

export function OrderCashMemo({
  order,
  backUrl = "/account/orders",
}: {
  order: CashMemoOrder;
  backUrl?: string;
}) {
  const memoRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const isPaid = order.paymentStatus === "PAID" || order.paymentStatus === "VERIFIED";

  return (
    <div className="min-h-screen bg-slate-50/70 py-6 px-4 sm:px-6 print:bg-white print:p-0">
      {/* Top Action Bar (Hidden during print) */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700 transition"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex items-center gap-2 bg-white text-slate-700 border-slate-300 shadow-sm hover:bg-slate-50"
          >
            <Printer size={16} /> Print Memo
          </Button>
          <Button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm"
          >
            <Download size={16} /> Download PDF
          </Button>
        </div>
      </div>

      {/* Cash Memo Sheet (A4 / Standard Invoice format) */}
      <div
        ref={memoRef}
        className="max-w-3xl mx-auto bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-10 print:border-none print:shadow-none print:p-4 print:max-w-none text-slate-800"
      >
        {/* Memo Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-emerald-700 text-white font-black text-lg">
                🌱
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-emerald-900">
                Pick Plant
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Green Life · Natural Plants & Gardening
            </p>
            <p className="text-xs text-slate-500">Dhaka, Bangladesh · 01700-000000</p>
            <p className="text-xs text-slate-500">support@pickplant.com · pickplant.com</p>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block bg-emerald-100/80 text-emerald-800 font-bold text-xs uppercase px-3 py-1 rounded-full mb-1">
              Official Cash Memo / রসিদ
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              Order #{order.orderNumber}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Date: {formatDate(order.createdAt)}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border"
              style={{
                borderColor: isPaid ? "#86efac" : "#fed7aa",
                backgroundColor: isPaid ? "#f0fdf4" : "#fff7ed",
                color: isPaid ? "#15803d" : "#c2410c",
              }}
            >
              <ShieldCheck size={14} />
              {isPaid ? "PAID / পরিশোধিত" : "CASH ON DELIVERY (বাকি)"}
            </div>
          </div>
        </div>

        {/* Customer & Delivery Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs sm:text-sm">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 mb-1">
              Customer Details (গ্রাহক তথ্য)
            </p>
            <p className="font-bold text-slate-900 text-base">{order.customerName || "Customer"}</p>
            <p className="text-slate-600 mt-0.5 font-medium">📞 {order.customerPhone || "N/A"}</p>
            {order.customerEmail && (
              <p className="text-slate-500 text-xs mt-0.5">✉️ {order.customerEmail}</p>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-400 mb-1">
              Delivery Address (ডেলিভারি ঠিকানা)
            </p>
            <p className="text-slate-800 font-medium">
              {order.shippingAddressLine1}
              {order.shippingAddressLine2 ? `, ${order.shippingAddressLine2}` : ""}
            </p>
            <p className="text-slate-600">
              {order.shippingCity}, {order.shippingDistrict} {order.shippingPostalCode || ""}
            </p>
            <p className="text-xs text-emerald-800 mt-1 font-semibold">
              Payment Method: {order.paymentMethod || "Cash on Delivery"}
            </p>
          </div>
        </div>

        {/* Itemized Order Table */}
        <div className="py-6">
          <p className="text-xs font-bold uppercase text-slate-400 mb-3">
            Item Details (পণ্যের বিবরণ)
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="pb-3 w-10">#</th>
                  <th className="pb-3">Plant / Item Name</th>
                  <th className="pb-3 text-center w-24">SKU</th>
                  <th className="pb-3 text-right w-24">Unit Price</th>
                  <th className="pb-3 text-center w-16">Qty</th>
                  <th className="pb-3 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <tr key={item.id} className="text-slate-700">
                    <td className="py-3 text-slate-400">{idx + 1}</td>
                    <td className="py-3 font-semibold text-slate-900">
                      {item.productName}
                    </td>
                    <td className="py-3 text-center text-xs text-slate-500 font-mono">
                      {item.sku}
                    </td>
                    <td className="py-3 text-right">
                      {formatCurrency(Number(item.unitPrice))}
                    </td>
                    <td className="py-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      {formatCurrency(Number(item.lineTotal))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculation & Summary Breakdown */}
        <div className="border-t border-slate-200 pt-4 pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="text-xs text-slate-500 space-y-1 max-w-sm">
              <p className="font-semibold text-slate-700">বিশেষ দ্রষ্টব্য (Terms):</p>
              <p>১. গাছ ডেলিভারি পাওয়ার সাথে সাথে ভালো করে পরীক্ষা করে রিসিভ করুন।</p>
              <p>২. ডেলিভারির পর দ্রুত গাছে পর্যাপ্ত পানি ও আলো নিশ্চিত করুন।</p>
              <p>৩. যেকোনো অভিযোগের জন্য আমাদের হেল্পলাইনে অর্ডার নাম্বারসহ যোগাযোগ করুন।</p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (মোট মূল্য)</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(Number(order.subtotal))}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>
                  Shipping Fee {order.shippingZoneName ? `(${order.shippingZoneName})` : ""}
                </span>
                <span className="font-semibold text-slate-900">
                  {Number(order.shippingTotal) === 0
                    ? "FREE"
                    : formatCurrency(Number(order.shippingTotal))}
                </span>
              </div>

              {Number(order.discountTotal || 0) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <span>-{formatCurrency(Number(order.discountTotal))}</span>
                </div>
              )}

              <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-base font-extrabold text-slate-900">
                <span>Grand Total (সর্বমোট)</span>
                <span className="text-emerald-800">
                  {formatCurrency(Number(order.grandTotal))}
                </span>
              </div>

              {!isPaid && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-center text-xs font-bold text-amber-900 mt-2">
                  ডেলিভারিম্যানের কাছে প্রদেয়: {formatCurrency(Number(order.grandTotal))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Memo Footer / Stamp */}
        <div className="border-t border-dashed border-slate-200 pt-6 mt-2 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <p>Thank you for choosing Pick Plant! 🌿</p>
          <div className="text-center sm:text-right">
            <p className="font-semibold text-slate-700">Pick Plant Authorized</p>
            <p className="text-[10px]">Computer Generated Cash Memo · No physical seal required</p>
          </div>
        </div>
      </div>
    </div>
  );
}
