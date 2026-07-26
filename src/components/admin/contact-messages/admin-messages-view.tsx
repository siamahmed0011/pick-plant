"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Phone, Filter } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";

type MessageItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  inquiryType: string;
  status: string;
  createdAt: Date | string;
};

export function AdminMessagesView({ messages }: { messages: MessageItem[] }) {
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredMessages = messages.filter((m) => {
    if (statusFilter === "ALL") return true;
    return m.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return <Badge className="bg-blue-100 text-blue-800 font-bold border-blue-200">NEW</Badge>;
      case "READ":
        return <Badge className="bg-stone-100 text-stone-700 font-medium">READ</Badge>;
      case "REPLIED":
        return <Badge className="bg-emerald-100 text-emerald-800 font-bold border-emerald-200">REPLIED</Badge>;
      case "ARCHIVED":
        return <Badge className="bg-stone-200 text-stone-600">ARCHIVED</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <AdminPageHeader
        title="Contact Messages & Inquiries"
        description="Review customer inquiries, plant care emergency requests, and service setup requests."
        status={null}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <Filter size={16} className="text-stone-400 mr-2" />
        {["ALL", "NEW", "READ", "REPLIED", "ARCHIVED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              statusFilter === st
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Sender Info</th>
                <th className="px-6 py-4">Subject & Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date Received</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-stone-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-stone-900">{msg.name}</div>
                      <div className="text-xs text-[var(--muted)]">{msg.email}</div>
                      {msg.phone && (
                        <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5 font-mono">
                          <Phone size={11} /> {msg.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-stone-900">{msg.subject}</div>
                      <Badge className="mt-1 bg-stone-100 text-stone-700 text-[10px]">
                        {msg.inquiryType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(msg.status)}</td>
                    <td className="px-6 py-4 text-xs text-[var(--muted)] font-medium">
                      {formatDate(msg.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/contact-messages/${msg.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
                      >
                        <Eye size={15} /> View Message
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-500 font-medium">
                    No contact messages found for the selected status filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
