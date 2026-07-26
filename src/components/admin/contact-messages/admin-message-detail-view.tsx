"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Calendar, User, Save, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/formatters";

type ContactMessageDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  inquiryType: string;
  message: string;
  status: string;
  adminNote: string | null;
  createdAt: Date | string;
};

export function AdminMessageDetailView({ message }: { message: ContactMessageDetail }) {
  const [status, setStatus] = useState(message.status);
  const [adminNote, setAdminNote] = useState(message.adminNote || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/admin/contact-messages/${message.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Failed to update message status");
      }
    } catch {
      alert("Error updating message status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl p-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/contact-messages" className="p-2 rounded-xl hover:bg-stone-100 text-stone-600">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">Inquiry Details</h1>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
          <div>
            <Badge className="bg-stone-100 text-stone-800 text-xs font-semibold">
              {message.inquiryType}
            </Badge>
            <h2 className="text-2xl font-bold text-stone-900 mt-2">{message.subject}</h2>
            <p className="text-xs text-[var(--muted)] mt-1 flex items-center gap-1 font-medium">
              <Calendar size={13} /> Received on {formatDate(message.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-stone-500">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 p-2 text-xs font-bold text-stone-800 focus:outline-none"
            >
              <option value="NEW">NEW</option>
              <option value="READ">READ</option>
              <option value="REPLIED">REPLIED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>

        {/* Sender Details */}
        <div className="grid gap-4 sm:grid-cols-3 rounded-2xl bg-stone-50 p-5 text-sm">
          <div>
            <span className="text-xs font-bold uppercase text-[var(--muted)] flex items-center gap-1">
              <User size={13} /> Sender Name
            </span>
            <p className="font-bold text-stone-900 mt-1">{message.name}</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-[var(--muted)] flex items-center gap-1">
              <Mail size={13} /> Email
            </span>
            <p className="font-semibold text-stone-800 mt-1">{message.email}</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-[var(--muted)] flex items-center gap-1">
              <Phone size={13} /> Phone
            </span>
            <p className="font-semibold text-stone-800 mt-1">{message.phone || "Not provided"}</p>
          </div>
        </div>

        {/* Full Message Body */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">Message Content:</h3>
          <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-6 text-sm leading-relaxed text-stone-800 whitespace-pre-wrap">
            {message.message}
          </div>
        </div>

        {/* Admin Internal Notes Form */}
        <form onSubmit={handleUpdate} className="pt-6 border-t border-stone-100 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Admin Internal Notes & Follow-up
          </h3>
          <Textarea
            rows={3}
            placeholder="Record internal staff notes or follow-up status..."
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            className="rounded-xl border-stone-200 text-sm"
          />

          <div className="flex items-center justify-between">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[var(--primary)] text-white font-bold rounded-xl inline-flex items-center gap-2"
            >
              <Save size={16} /> {isSubmitting ? "Updating..." : "Save Status & Notes"}
            </Button>

            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <Check size={14} /> Saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
