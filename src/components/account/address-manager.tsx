"use client";

import { useState } from "react";
import { MapPin, Plus, Trash2, Edit3, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <MapPin className="text-[var(--primary)]" size={20} /> Saved Delivery Addresses
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Manage your delivery locations for faster checkout.
          </p>
        </div>

        {!isAdding && (
          <Button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="bg-[var(--primary)] text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
          >
            <Plus size={16} /> Add New Address
          </Button>
        )}
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <form onSubmit={handleSave} className="rounded-3xl border border-stone-200 bg-stone-50/50 p-6 sm:p-8 space-y-4 animate-fadeIn">
          <h3 className="text-base font-bold text-stone-900">
            {editingId ? "Edit Saved Address" : "Add New Delivery Address"}
          </h3>

          {errorMsg && (
            <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-900">
              {errorMsg}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-700 mb-1">Recipient Name *</label>
              <Input
                type="text"
                required
                placeholder="e.g. Tanvir Ahmed"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                className="bg-white rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-stone-700 mb-1">Phone Number *</label>
              <Input
                type="tel"
                required
                placeholder="e.g. 01700000000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-stone-700 mb-1">Street Address Line 1 *</label>
            <Input
              type="text"
              required
              placeholder="House #, Road #, Block/Section"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              className="bg-white rounded-xl"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-700 mb-1">Area / Suburb</label>
              <Input
                type="text"
                placeholder="e.g. Banani"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="bg-white rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-stone-700 mb-1">City *</label>
              <Input
                type="text"
                required
                placeholder="Dhaka"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="bg-white rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-stone-700 mb-1">District *</label>
              <Input
                type="text"
                required
                placeholder="Dhaka"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="bg-white rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-stone-300 text-[var(--primary)]"
              />
              <span className="text-xs font-bold text-stone-800">Set as default shipping address</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[var(--primary)] text-white font-bold rounded-xl"
            >
              {isSubmitting ? "Saving..." : "Save Address"}
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
              className={`rounded-2xl border p-5 bg-white shadow-sm flex flex-col justify-between transition ${
                addr.isDefault ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-stone-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-stone-900 text-base">{addr.recipientName}</span>
                  {addr.isDefault ? (
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-emerald-200">
                      Default Address
                    </Badge>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs text-[var(--muted)] hover:text-emerald-700 font-semibold flex items-center gap-1"
                    >
                      <Star size={12} /> Set Default
                    </button>
                  )}
                </div>

                <p className="text-xs font-semibold text-stone-700 mb-1">{addr.phone}</p>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                  {addr.area ? `, ${addr.area}` : ""}, {addr.city}, {addr.district}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleEditClick(addr)}
                  className="p-1.5 text-stone-600 hover:text-[var(--primary)] rounded-lg hover:bg-stone-50"
                  title="Edit Address"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-1.5 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50"
                  title="Delete Address"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
            <MapPin size={28} className="mx-auto text-stone-400 mb-2" />
            <p className="text-sm font-semibold text-stone-700">No saved addresses yet.</p>
            <p className="text-xs text-[var(--muted)] mt-1">Add your home or office address for easy checkout.</p>
          </div>
        )}
      </div>
    </div>
  );
}
