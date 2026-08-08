"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  UserCheck,
  ShieldAlert,
  Search,
  Eye,
  MapPin,
  ShoppingBag,
  Calendar,
  Phone,
  Mail,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { CustomerItem, CustomerDetail } from "@/lib/admin/customers-data";

type CustomersViewProps = {
  data: {
    items: CustomerItem[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    summary: {
      totalCustomers: number;
      activeCustomers: number;
      adminUsers: number;
    };
  };
};

export function AdminCustomersView({ data }: { data: CustomersViewProps["data"] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedRole, setSelectedRole] = useState(searchParams.get("role") || "ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/admin/customers?${params.toString()}`);
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    const params = new URLSearchParams(searchParams.toString());
    if (role !== "ALL") {
      params.set("role", role);
    } else {
      params.delete("role");
    }
    params.set("page", "1");
    router.push(`/admin/customers?${params.toString()}`);
  };

  const toggleCustomerStatus = async (customer: CustomerItem) => {
    setUpdatingId(customer.id);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !customer.isActive }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to update user status");
      }
    } catch {
      alert("Error updating user status");
    } finally {
      setUpdatingId(null);
    }
  };

  const openCustomerDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      if (!res.ok) {
        // Fallback fetch via route
        const customer = data.items.find((c) => c.id === id);
        if (customer) {
          setSelectedCustomer({
            ...customer,
            addresses: [],
            recentOrders: [],
          });
        }
      } else {
        const detail = await res.json();
        setSelectedCustomer(detail.customer);
      }
    } catch {
      const customer = data.items.find((c) => c.id === id);
      if (customer) {
        setSelectedCustomer({
          ...customer,
          addresses: [],
          recentOrders: [],
        });
      }
    }
  };

  return (
    <div className="space-y-6 p-6">
      <AdminPageHeader
        title="Customer Management"
        description="View registered accounts, monitor order activity, inspect saved addresses, and manage account statuses."
        status={null}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[18px] border border-[#DDE7DD] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#66746A]">Total Registered Users</p>
            <p className="mt-1 text-2xl font-bold text-[#1E5A3A]">{data.summary.totalCustomers}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EAF5EE] text-[#1E5A3A]">
            <Users size={22} />
          </div>
        </div>

        <div className="rounded-[18px] border border-[#DDE7DD] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#66746A]">Active Accounts</p>
            <p className="mt-1 text-2xl font-bold text-[#1E5A3A]">{data.summary.activeCustomers}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EAF5EE] text-[#1E5A3A]">
            <UserCheck size={22} />
          </div>
        </div>

        <div className="rounded-[18px] border border-[#DDE7DD] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#66746A]">Administrator Users</p>
            <p className="mt-1 text-2xl font-bold text-[#1E5A3A]">{data.summary.adminUsers}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EAF5EE] text-[#1E5A3A]">
            <ShieldAlert size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDE7DD] pb-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66746A]" />
          <input
            type="text"
            placeholder="Search customer name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-[#DDE7DD] bg-white pl-10 pr-4 py-2 text-sm font-medium text-[#1F2D22] focus:border-[#1E5A3A] focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2">
          {["ALL", "CUSTOMER", "ADMIN"].map((r) => (
            <button
              key={r}
              onClick={() => handleRoleChange(r)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                selectedRole === r
                  ? "bg-[#1E5A3A] text-white shadow-xs"
                  : "bg-[#EEF5F0] text-[#1F2D22] hover:bg-[#DDE7DD]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table Surface */}
      <div className="overflow-hidden rounded-[18px] border border-[#DDE7DD] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#DDE7DD] bg-[#F7F8F5] text-xs font-bold uppercase text-[#66746A]">
              <tr>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Role & Status</th>
                <th className="px-6 py-4">Total Orders</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE7DD]">
              {data.items.length > 0 ? (
                data.items.map((cust) => (
                  <tr key={cust.id} className="hover:bg-[#F7F8F5]/60 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#1F2D22]">{cust.name}</div>
                      <div className="text-xs text-[#66746A]">{cust.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[#1F2D22]">
                      {cust.phone || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            cust.role === "ADMIN"
                              ? "bg-[#EAF5EE] text-[#1E5A3A] border-[#DDE7DD] font-bold"
                              : "bg-[#EEF5F0] text-[#1F2D22] font-semibold"
                          }
                        >
                          {cust.role}
                        </Badge>
                        {cust.isActive ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                            <XCircle size={12} /> Suspended
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#1F2D22]">{cust.totalOrders}</td>
                    <td className="px-6 py-4 font-bold text-[#1E5A3A]">
                      {formatCurrency(cust.totalSpent)}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#66746A]">
                      {formatDate(cust.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCustomerDetails(cust.id)}
                        className="h-8 rounded-lg text-xs font-bold text-[#1E5A3A] border-[#DDE7DD]"
                      >
                        <Eye size={14} className="mr-1" /> View
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={updatingId === cust.id}
                        onClick={() => toggleCustomerStatus(cust)}
                        className={`h-8 rounded-lg text-xs font-bold ${
                          cust.isActive ? "text-rose-600 hover:bg-rose-50" : "text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {cust.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#66746A] font-medium">
                    No registered customer records match your filter query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination
        basePath="/admin/customers"
        params={Object.fromEntries(searchParams.entries())}
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        totalItems={data.totalItems}
        pageSize={10}
      />

      {/* Customer Details Modal / Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-[#DDE7DD] bg-white p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#DDE7DD] pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#1F2D22]">{selectedCustomer.name}</h3>
                <p className="text-xs text-[#66746A]">Customer ID: {selectedCustomer.id}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-xl p-2 text-[#66746A] hover:bg-[#EEF5F0]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Account Details Grid */}
            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-[#F7F8F5] p-4 text-xs">
              <div>
                <span className="font-semibold text-[#66746A] flex items-center gap-1">
                  <Mail size={13} /> Email Address
                </span>
                <p className="font-bold text-[#1F2D22] mt-0.5">{selectedCustomer.email}</p>
              </div>
              <div>
                <span className="font-semibold text-[#66746A] flex items-center gap-1">
                  <Phone size={13} /> Phone Number
                </span>
                <p className="font-bold text-[#1F2D22] mt-0.5">{selectedCustomer.phone || "Not provided"}</p>
              </div>
              <div>
                <span className="font-semibold text-[#66746A] flex items-center gap-1">
                  <Calendar size={13} /> Account Created
                </span>
                <p className="font-bold text-[#1F2D22] mt-0.5">{formatDate(selectedCustomer.createdAt)}</p>
              </div>
              <div>
                <span className="font-semibold text-[#66746A] flex items-center gap-1">
                  <ShoppingBag size={13} /> Lifetime Spend
                </span>
                <p className="font-bold text-[#1E5A3A] mt-0.5">
                  {formatCurrency(selectedCustomer.totalSpent)} ({selectedCustomer.totalOrders} orders)
                </p>
              </div>
            </div>

            {/* Saved Addresses Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F2D22] flex items-center gap-1.5">
                <MapPin size={15} className="text-[#1E5A3A]" /> Saved Delivery Addresses (
                {selectedCustomer.addresses?.length || 0})
              </h4>
              {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedCustomer.addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="rounded-xl border border-[#DDE7DD] bg-white p-3.5 text-xs text-[#1F2D22]"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{addr.fullName} ({addr.phone})</span>
                        {addr.isDefault && (
                          <Badge className="bg-[#EAF5EE] text-[#1E5A3A] text-[10px]">Default</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-[#66746A]">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}, {addr.city},{" "}
                        {addr.district} {addr.postalCode || ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#66746A] italic">No saved delivery addresses found for this account.</p>
              )}
            </div>

            {/* Recent Orders Section */}
            <div className="space-y-3 pt-2 border-t border-[#DDE7DD]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F2D22] flex items-center gap-1.5">
                <ShoppingBag size={15} className="text-[#1E5A3A]" /> Recent Order History
              </h4>
              {selectedCustomer.recentOrders && selectedCustomer.recentOrders.length > 0 ? (
                <div className="space-y-2">
                  {selectedCustomer.recentOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="flex items-center justify-between rounded-xl border border-[#DDE7DD] bg-white p-3 text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#1F2D22]">#{ord.orderNumber}</span>
                        <span className="text-[#66746A] ml-2">{formatDate(ord.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-[#EEF5F0] text-[#1F2D22]">{ord.status}</Badge>
                        <span className="font-bold text-[#1E5A3A]">{formatCurrency(ord.grandTotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#66746A] italic">No previous orders placed yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
