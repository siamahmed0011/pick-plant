"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, Calendar, User, Save, Check, Trash2 } from "lucide-react";
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
  const router = useRouter();
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this contact message?")) return;
    try {
      const res = await fetch(`/api/admin/contact-messages/${message.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/contact-messages");
      } else {
        alert("Failed to delete message");
      }
    } catch {
      alert("Error deleting message");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/contact-messages" className="p-2 rounded-xl hover:bg-[#EEF5F0] text-[#66746A]">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold text-[#1F2D22]">Inquiry Details</h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          className="rounded-xl border-rose-200 text-rose-700 font-bold hover:bg-rose-50 inline-flex items-center gap-1.5"
        >
          <Trash2 size={15} /> Delete Message
        </Button>
      </div>

      <div className="rounded-[24px] border border-[#DDE7DD] bg-white p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE7DD] pb-6">
          <div>
            <Badge className="bg-[#EEF5F0] text-[#1F2D22] text-xs font-semibold border-[#DDE7DD]">
              {message.inquiryType}
            </Badge>
            <h2 className="text-2xl font-bold text-[#1F2D22] mt-2">{message.subject}</h2>
            <p className="text-xs text-[#66746A] mt-1 flex items-center gap-1 font-medium">
              <Calendar size={13} /> Received on {formatDate(message.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-[#66746A]">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-[#DDE7DD] bg-[#F7F8F5] p-2 text-xs font-bold text-[#1F2D22] focus:outline-none"
            >
              <option value="NEW">NEW</option>
              <option value="READ">READ</option>
              <option value="REPLIED">REPLIED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>

        {/* Sender Details */}
        <div className="grid gap-4 sm:grid-cols-3 rounded-2xl bg-[#F7F8F5] p-5 text-sm">
          <div>
            <span className="text-xs font-bold uppercase text-[#66746A] flex items-center gap-1">
              <User size={13} /> Sender Name
            </span>
            <p className="font-bold text-[#1F2D22] mt-1">{message.name}</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-[#66746A] flex items-center gap-1">
              <Mail size={13} /> Email
            </span>
            <p className="font-semibold text-[#1F2D22] mt-1">{message.email}</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-[#66746A] flex items-center gap-1">
              <Phone size={13} /> Phone
            </span>
            <p className="font-semibold text-[#1F2D22] mt-1 font-mono">{message.phone || "Not provided"}</p>
          </div>
        </div>

        {/* Full Message Body */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#66746A]">Message Content:</h3>
          <div className="rounded-2xl border border-[#DDE7DD] bg-[#F7F8F5]/50 p-6 text-sm leading-relaxed text-[#1F2D22] whitespace-pre-wrap">
            {message.message}
          </div>
        </div>

        {/* Admin Internal Notes Form */}
        <form onSubmit={handleUpdate} className="pt-6 border-t border-[#DDE7DD] space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#66746A]">
            Admin Internal Notes & Follow-up
          </h3>
          <Textarea
            rows={3}
            placeholder="Record internal staff notes or follow-up status..."
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            className="rounded-xl border-[#DDE7DD] text-sm"
          />

          <div className="flex items-center justify-between">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1E5A3A] text-white font-bold rounded-xl inline-flex items-center gap-2 hover:bg-[#17482F]"
            >
              <Save size={16} /> {isSubmitting ? "Updating..." : "Save Status & Notes"}
            </Button>

            {saveSuccess && (
              <span className="text-xs font-bold text-[#1E5A3A] flex items-center gap-1 bg-[#EAF5EE] px-3 py-1.5 rounded-lg border border-[#DDE7DD]">
                <Check size={14} /> Saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
