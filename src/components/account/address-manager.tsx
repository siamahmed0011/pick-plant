"use client";

import { useState } from "react";
import { Edit3, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SavedAddress = {
  id: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  area: string | null;
  city: string;
  district: string;
  isDefault: boolean;
};

export function AddressManager({ initialAddresses }: { initialAddresses: SavedAddress[] }) {
  const [addresses, setAddresses] = useState<SavedAddress[]>(initialAddresses);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    recipientName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    area: "",
    city: "Dhaka",
    district: "Dhaka",
    isDefault: false,
  });

  const resetForm = () => {
    setFormData({
      recipientName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      area: "",
      city: "Dhaka",
      district: "Dhaka",
      isDefault: false,
    });
    setIsAdding(false);
    setEditingId(null);
    setErrorMsg(null);
  };

  const handleEditClick = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setFormData({
      recipientName: addr.recipientName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      area: addr.area || "",
      city: addr.city,
      district: addr.district,
      isDefault: addr.isDefault,
    });
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const url = editingId ? `/api/addresses/${editingId}` : "/api/addresses";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const fetchRes = await fetch("/api/addresses");
        if (fetchRes.ok) {
          const data = await fetchRes.json();
          setAddresses(data.addresses || []);
        }
        resetForm();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to save address");
      }
    } catch {
      setErrorMsg("Network error occurred while saving address.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      } else {
        alert("Failed to delete address");
      }
    } catch {
      alert("Error deleting address");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      if (res.ok) {
        setAddresses((prev) =>
          prev.map((a) => ({ ...a, isDefault: a.id === id }))
        );
      }
    } catch {
      alert("Failed to set default address");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1F2D22]">Delivery addresses</h2>
          <p className="text-xs text-[#66746A] mt-0.5">
            Saved delivery locations for easy one-click checkout.
          </p>
        </div>

        {!isAdding && (
          <Button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="h-10 bg-[#1E5A3A] text-white font-semibold text-xs rounded-[14px] inline-flex items-center gap-1.5 hover:bg-[#17482F] transition shadow-xs"
          >
            <Plus size={15} /> Add new address
          </Button>
        )}
      </div>

      {/* Add / Edit Form Card */}
      {isAdding && (
        <form onSubmit={handleSave} className="rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-5 sm:p-6 space-y-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <h3 className="text-sm font-bold text-[#1F2D22] border-b border-[#DDE7DD] pb-3">
            {editingId ? "Edit saved address" : "Add new delivery address"}
          </h3>

          {errorMsg && (
            <div className="p-3 rounded-[14px] border border-red-200 bg-red-50 text-xs font-medium text-red-900">
              {errorMsg}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#66746A] mb-1">Recipient name *</label>
              <Input
                type="text"
                required
                placeholder="e.g. Tanvir Ahmed"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                className="h-11 rounded-[14px] text-sm border-[#DDE7DD] text-[#1F2D22] focus-visible:ring-2 focus-visible:ring-[#1E5A3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#66746A] mb-1">Phone number *</label>
              <Input
                type="tel"
                required
                placeholder="e.g. 01700000000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-11 rounded-[14px] text-sm border-[#DDE7DD] text-[#1F2D22] focus-visible:ring-2 focus-visible:ring-[#1E5A3A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#66746A] mb-1">Street address line 1 *</label>
            <Input
              type="text"
              required
              placeholder="House #, Road #, Block/Section"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              className="h-11 rounded-[14px] text-sm border-[#DDE7DD] text-[#1F2D22] focus-visible:ring-2 focus-visible:ring-[#1E5A3A]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#66746A] mb-1">Area / Suburb</label>
              <Input
                type="text"
                placeholder="e.g. Banani"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="h-11 rounded-[14px] text-sm border-[#DDE7DD] text-[#1F2D22] focus-visible:ring-2 focus-visible:ring-[#1E5A3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#66746A] mb-1">City *</label>
              <Input
                type="text"
                required
                placeholder="Dhaka"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="h-11 rounded-[14px] text-sm border-[#DDE7DD] text-[#1F2D22] focus-visible:ring-2 focus-visible:ring-[#1E5A3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#66746A] mb-1">District *</label>
              <Input
                type="text"
                required
                placeholder="Dhaka"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="h-11 rounded-[14px] text-sm border-[#DDE7DD] text-[#1F2D22] focus-visible:ring-2 focus-visible:ring-[#1E5A3A]"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="size-4 rounded border-stone-300 accent-[#1E5A3A] focus:ring-[#1E5A3A]"
              />
              <span className="text-xs font-semibold text-[#1F2D22]">Set as default shipping address</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#DDE7DD]">
            <Button type="button" variant="outline" onClick={resetForm} className="h-10 rounded-[14px] border-[#DDE7DD] bg-[#FFFFFF] text-[#1F2D22] text-xs font-semibold">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 bg-[#1E5A3A] text-white font-semibold text-xs rounded-[14px] hover:bg-[#17482F] transition"
            >
              {isSubmitting ? "Saving..." : "Save address"}
            </Button>
          </div>
        </form>
      )}

      {/* Address Cards List */}
      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.length > 0 ? (
          addresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-[18px] border p-4 sm:p-5 bg-[#FFFFFF] shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between transition ${
                addr.isDefault ? "border-[#1E5A3A] ring-2 ring-[#1E5A3A]/10" : "border-[#DDE7DD]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#1F2D22] text-sm">{addr.recipientName}</span>
                  {addr.isDefault ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                      Default address
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs text-[#66746A] hover:text-[#1E5A3A] font-medium flex items-center gap-1 transition"
                    >
                      <Star size={12} /> Set as default
                    </button>
                  )}
                </div>

                <p className="text-xs font-semibold text-[#1F2D22] mb-1">{addr.phone}</p>
                <p className="text-xs text-[#66746A] leading-relaxed">
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                  {addr.area ? `, ${addr.area}` : ""}, {addr.city}, {addr.district}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#DDE7DD] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleEditClick(addr)}
                  className="p-1.5 text-stone-600 hover:text-[#1E5A3A] rounded-lg hover:bg-[#EEF5F0] transition"
                  title="Edit Address"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className="p-1.5 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50 transition"
                  title="Delete Address"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 rounded-[18px] border border-[#DDE7DD] bg-[#FFFFFF] p-6 sm:p-8 text-center shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <MapPin size={22} className="mx-auto text-[#7A877F] mb-2" />
            <p className="text-sm font-bold text-[#1F2D22]">No saved address</p>
            <p className="text-xs text-[#66746A] mt-1 max-w-sm mx-auto leading-relaxed">
              Save your home or office address to make checkout faster during plant purchases.
            </p>
            <div className="mt-4">
              <Button
                onClick={() => {
                  resetForm();
                  setIsAdding(true);
                }}
                className="h-10 bg-[#1E5A3A] text-white font-semibold text-xs rounded-[14px] hover:bg-[#17482F] transition"
              >
                Add an address
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
