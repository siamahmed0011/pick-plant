"use client";

import { useState } from "react";
import { CheckCircle2, Copy, Check, Building2, Smartphone, ShieldAlert } from "lucide-react";
import { PAYMENT_CHANNELS, type MobileBankingChannelId } from "@/config/payment-channels";
import { formatCurrency } from "@/lib/formatters";

type Props = {
  selectedChannel: MobileBankingChannelId;
  onSelectChannel: (channel: MobileBankingChannelId) => void;
  transactionRef: string;
  onChangeTransactionRef: (ref: string) => void;
  grandTotal: number;
  error?: string;
};

export function ManualPaymentSelector({
  selectedChannel,
  onSelectChannel,
  transactionRef,
  onChangeTransactionRef,
  grandTotal,
  error,
}: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const channel = PAYMENT_CHANNELS[selectedChannel] || PAYMENT_CHANNELS["bKash"];

  return (
    <div className="mt-4 space-y-5 rounded-[20px] border border-[#DDE7DD] bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#DDE7DD] pb-3">
        <div>
          <h3 className="text-base font-bold text-[#1F2D22]">Send Money Payment Options</h3>
          <p className="text-xs text-[#66746A]">
            Select your preferred mobile banking wallet or bank transfer option below.
          </p>
        </div>
        <span className="rounded-full bg-[#EAF5EE] px-3 py-1 text-[11px] font-bold text-[#1E5A3A]">
          Manual Verification
        </span>
      </div>

      {/* Selectable Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(PAYMENT_CHANNELS) as MobileBankingChannelId[]).map((chKey) => {
          const item = PAYMENT_CHANNELS[chKey];
          const isSelected = selectedChannel === chKey;

          return (
            <button
              key={chKey}
              type="button"
              onClick={() => onSelectChannel(chKey)}
              className={`relative flex flex-col items-start justify-between rounded-xl p-3.5 text-left transition duration-200 border ${
                isSelected
                  ? "border-[#1E5A3A] bg-[#EEF5F0] shadow-xs"
                  : "border-[#DDE7DD] bg-white hover:border-[#1E5A3A]/40 hover:bg-[#F7F8F5]"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span
                  className={`inline-flex items-center justify-center rounded-lg p-1.5 text-xs font-bold ${item.badgeBg}`}
                >
                  {item.type === "mobile" ? <Smartphone size={16} /> : <Building2 size={16} />}
                </span>
                {isSelected && (
                  <CheckCircle2 size={18} className="text-[#1E5A3A] shrink-0" />
                )}
              </div>

              <div className="mt-3">
                <p className="text-sm font-bold text-[#1F2D22]">{item.name}</p>
                <p className="text-[11px] font-semibold text-[#1E5A3A]">Send Money</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Channel Details & Instructions */}
      <div className="rounded-2xl border border-[#DDE7DD] bg-[#F7F8F5] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDE7DD] pb-4">
          <div>
            <h4 className="text-sm font-bold text-[#1F2D22]">
              Send Money with {channel.name}
            </h4>
            <p className="text-xs text-[#66746A]">
              Send the exact order amount using the personal number / account details below.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#66746A] font-semibold block">Exact Payable Amount</span>
            <span className="text-lg font-extrabold text-[#1E5A3A]">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {/* Mobile Banking Personal Number Box */}
        {channel.type === "mobile" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#DDE7DD] bg-white p-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#66746A]">
                Personal Mobile Number
              </span>
              <p className="text-xl font-bold font-mono text-[#1F2D22] tracking-wider mt-0.5">
                {channel.number}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(channel.number, "phone")}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DDE7DD] bg-[#EEF5F0] px-4 py-2 text-xs font-bold text-[#1E5A3A] transition hover:bg-[#1E5A3A] hover:text-white shrink-0"
            >
              {copiedKey === "phone" ? (
                <>
                  <Check size={14} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Number
                </>
              )}
            </button>
          </div>
        )}

        {/* Bank Transfer Details Box */}
        {channel.type === "bank" && channel.bankDetails && (
          <div className="rounded-xl border border-[#DDE7DD] bg-white p-4 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="font-semibold text-[#66746A] block">Bank Name</span>
                <span className="font-bold text-[#1F2D22] text-sm">{channel.bankDetails.bankName}</span>
              </div>
              <div>
                <span className="font-semibold text-[#66746A] block">Account Name</span>
                <span className="font-bold text-[#1F2D22] text-sm">{channel.bankDetails.accountName}</span>
              </div>
              <div>
                <span className="font-semibold text-[#66746A] block">Account Number</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-bold font-mono text-sm text-[#1F2D22]">
                    {channel.bankDetails.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(channel.bankDetails!.accountNumber, "acc")}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E5A3A] hover:underline"
                  >
                    {copiedKey === "acc" ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
              <div>
                <span className="font-semibold text-[#66746A] block">Branch & Routing</span>
                <span className="font-medium text-[#1F2D22]">
                  {channel.bankDetails.branch} ({channel.bankDetails.routingNumber})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step-by-Step Instructions */}
        <div className="space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-[#1F2D22]">
            Step-by-Step Instructions:
          </h5>
          <ol className="space-y-1.5 pl-4 text-xs font-medium text-[#66746A] list-decimal leading-relaxed">
            {channel.instructions.map((step, idx) => (
              <li key={idx}>
                {step.includes("exact payable amount") ? (
                  <span>
                    Enter the exact payable amount (<strong className="text-[#1E5A3A]">{formatCurrency(grandTotal)}</strong>).
                  </span>
                ) : (
                  step
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* Security Assurance Banner */}
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-[11px] font-semibold text-emerald-800">
          <ShieldAlert size={15} className="shrink-0 text-emerald-600" />
          <span>
            Pick Plant will never ask for your PIN, OTP, or wallet password. Only submit your transaction ID reference below.
          </span>
        </div>

        {/* Transaction ID Input Field */}
        <div className="space-y-1.5 pt-2 border-t border-[#DDE7DD]">
          <label className="block text-xs font-bold text-[#1F2D22]">
            Transaction ID / Reference Number <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            value={transactionRef}
            onChange={(e) => onChangeTransactionRef(e.target.value.toUpperCase())}
            placeholder="e.g. 9B87A6C5 or TR098231"
            className={`w-full rounded-xl border bg-white px-4 py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-[#1F2D22] focus:outline-none ${
              error ? "border-rose-500 focus:border-rose-600" : "border-[#DDE7DD] focus:border-[#1E5A3A]"
            }`}
            required
          />
          {error && (
            <p className="text-xs font-bold text-rose-600 mt-1">{error}</p>
          )}
          <p className="text-[11px] text-[#66746A]">
            Enter the confirmation Transaction ID received in your SMS or app after completing Send Money.
          </p>
        </div>
      </div>
    </div>
  );
}
