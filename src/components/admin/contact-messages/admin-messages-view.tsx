"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Phone, Mail, Search, Archive, Trash2, Clock, Inbox, CheckCircle2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredMessages = messages.filter((m) => {
    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      m.name.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      m.subject.toLowerCase().includes(term) ||
      (m.phone && m.phone.includes(term));

    return matchesStatus && matchesSearch;
  });

  const newCount = messages.filter((m) => m.status === "NEW").length;

  const updateMessageStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to update message status");
      }
    } catch {
      alert("Error updating message status");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this contact message?")) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete message");
      }
    } catch {
      alert("Error deleting message");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return <Badge className="bg-amber-50 text-amber-800 border-amber-200 font-bold">NEW</Badge>;
      case "READ":
        return <Badge className="bg-[#EEF5F0] text-[#1F2D22] font-semibold border-[#DDE7DD]">READ</Badge>;
      case "REPLIED":
        return <Badge className="bg-[#EAF5EE] text-[#1E5A3A] border-[#DDE7DD] font-bold">REPLIED</Badge>;
      case "ARCHIVED":
        return <Badge className="bg-stone-100 text-stone-600 border-stone-200">ARCHIVED</Badge>;
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[18px] border border-[#DDE7DD] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#66746A]">Total Inquiries</p>
            <p className="mt-1 text-2xl font-bold text-[#1E5A3A]">{messages.length}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EAF5EE] text-[#1E5A3A]">
            <Inbox size={22} />
          </div>
        </div>

        <div className="rounded-[18px] border border-[#DDE7DD] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#66746A]">New / Unread Messages</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{newCount}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <Clock size={22} />
          </div>
        </div>

        <div className="rounded-[18px] border border-[#DDE7DD] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#66746A]">Replied Inquiries</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {messages.filter((m) => m.status === "REPLIED").length}
            </p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EAF5EE] text-[#1E5A3A]">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDE7DD] pb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66746A]" />
          <input
            type="text"
            placeholder="Search sender, email, subject, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-[#DDE7DD] bg-white pl-10 pr-4 py-2 text-sm font-medium text-[#1F2D22] focus:border-[#1E5A3A] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {["ALL", "NEW", "READ", "REPLIED", "ARCHIVED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                statusFilter === st
                  ? "bg-[#1E5A3A] text-white shadow-xs"
                  : "bg-[#EEF5F0] text-[#1F2D22] hover:bg-[#DDE7DD]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Table */}
      <div className="overflow-hidden rounded-[18px] border border-[#DDE7DD] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#DDE7DD] bg-[#F7F8F5] text-xs uppercase text-[#66746A] font-bold">
              <tr>
                <th className="px-6 py-4">Sender Info</th>
                <th className="px-6 py-4">Subject & Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Received Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE7DD]">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-[#F7F8F5]/60 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#1F2D22]">{msg.name}</div>
                      <div className="text-xs text-[#66746A] flex items-center gap-1 mt-0.5">
                        <Mail size={12} /> {msg.email}
                      </div>
                      {msg.phone && (
                        <div className="text-xs text-[#66746A] flex items-center gap-1 mt-0.5 font-mono">
                          <Phone size={11} /> {msg.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#1F2D22]">{msg.subject}</div>
                      <Badge className="mt-1 bg-[#EEF5F0] text-[#1F2D22] text-[10px] font-semibold border-[#DDE7DD]">
                        {msg.inquiryType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(msg.status)}</td>
                    <td className="px-6 py-4 text-xs text-[#66746A] font-medium">
                      {formatDate(msg.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      <Link
                        href={`/admin/contact-messages/${msg.id}`}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#DDE7DD] px-3 text-xs font-bold text-[#1E5A3A] hover:bg-[#EAF5EE]"
                      >
                        <Eye size={14} /> View
                      </Link>

                      {msg.status !== "ARCHIVED" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={updatingId === msg.id}
                          onClick={() => updateMessageStatus(msg.id, "ARCHIVED")}
                          className="h-8 rounded-lg text-xs font-bold text-[#66746A] hover:bg-[#EEF5F0]"
                          title="Archive message"
                        >
                          <Archive size={14} />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={updatingId === msg.id}
                          onClick={() => updateMessageStatus(msg.id, "READ")}
                          className="h-8 rounded-lg text-xs font-bold text-[#1E5A3A] hover:bg-[#EAF5EE]"
                          title="Restore to read"
                        >
                          Restore
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={updatingId === msg.id}
                        onClick={() => deleteMessage(msg.id)}
                        className="h-8 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50"
                        title="Delete message"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#66746A] font-medium">
                    No contact messages found matching your search filter.
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
