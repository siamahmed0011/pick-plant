"use client";

import { useState } from "react";
import {
  Store,
  Mail,
  Phone,
  MapPin,
  Megaphone,
  Truck,
  CreditCard,
  Share2,
  Save,
  CheckCircle2,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { StoreSettings } from "@/lib/admin/settings-service";

export function AdminSettingsView({ initialSettings }: { initialSettings: StoreSettings }) {
  const [formData, setFormData] = useState<StoreSettings>(initialSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert("Failed to save settings");
      }
    } catch {
      alert("Error saving settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl p-6">
      <AdminPageHeader
        title="Store Configuration & Settings"
        description="Manage store contact details, announcement text, default shipping fees, and fulfillment rules."
        status={null}
      />

      {saveSuccess && (
        <div className="flex items-center gap-3 rounded-2xl bg-[#EAF5EE] border border-[#DDE7DD] p-4 text-sm font-bold text-[#1E5A3A]">
          <CheckCircle2 size={20} className="shrink-0 text-[#1E5A3A]" />
          Store configuration updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Store Identity & Contacts */}
        <div className="rounded-[20px] border border-[#DDE7DD] bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-[#DDE7DD] pb-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#1E5A3A]">
              <Store size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1F2D22]">Store Identity & Contact Details</h3>
              <p className="text-xs text-[#66746A]">
                Displayed on customer receipts, contact pages, and transaction emails.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase text-[#1F2D22] mb-1.5 flex items-center gap-1.5">
                <Store size={14} className="text-[#1E5A3A]" /> Store Brand Name
              </label>
              <Input
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="rounded-xl border-[#DDE7DD] text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#1F2D22] mb-1.5 flex items-center gap-1.5">
                <Mail size={14} className="text-[#1E5A3A]" /> Support Email Address
              </label>
              <Input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="rounded-xl border-[#DDE7DD] text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#1F2D22] mb-1.5 flex items-center gap-1.5">
                <Phone size={14} className="text-[#1E5A3A]" /> Customer Care Phone
              </label>
              <Input
                value={formData.supportPhone}
                onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                className="rounded-xl border-[#DDE7DD] text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#1F2D22] mb-1.5 flex items-center gap-1.5">
                <MapPin size={14} className="text-[#1E5A3A]" /> Physical Nursery & Office Address
              </label>
              <Input
                value={formData.storeAddress}
                onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                className="rounded-xl border-[#DDE7DD] text-sm font-medium"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Storefront Announcements & Banners */}
        <div className="rounded-[20px] border border-[#DDE7DD] bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-[#DDE7DD] pb-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#1E5A3A]">
              <Megaphone size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1F2D22]">Announcement Banner & Maintenance</h3>
              <p className="text-xs text-[#66746A]">Manage header promo text and emergency maintenance status.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-[#1F2D22] mb-1.5 block">
                Storefront Top Announcement Message
              </label>
              <Textarea
                rows={2}
                value={formData.announcementText}
                onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
                className="rounded-xl border-[#DDE7DD] text-sm font-medium"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#F7F8F5] p-4">
              <div>
                <span className="font-bold text-[#1F2D22] text-sm block">Storefront Maintenance Mode</span>
                <span className="text-xs text-[#66746A]">
                  Temporarily disable new customer order placements for stock audits.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.maintenanceMode}
                  onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E5A3A]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Shipping & Payment Rules */}
        <div className="rounded-[20px] border border-[#DDE7DD] bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-[#DDE7DD] pb-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#1E5A3A]">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1F2D22]">Fulfillment Rates & Payment Controls</h3>
              <p className="text-xs text-[#66746A]">Set nationwide courier fees, free shipping rules, and COD.</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase text-[#1F2D22] mb-1.5 block">
                Dhaka Inside Delivery Fee (৳)
              </label>
              <Input
                type="number"
                value={formData.dhakaShippingFee}
                onChange={(e) => setFormData({ ...formData, dhakaShippingFee: Number(e.target.value) })}
                className="rounded-xl border-[#DDE7DD] text-sm font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#1F2D22] mb-1.5 block">
                Outside Dhaka Delivery Fee (৳)
              </label>
              <Input
                type="number"
                value={formData.outsideDhakaShippingFee}
                onChange={(e) =>
                  setFormData({ ...formData, outsideDhakaShippingFee: Number(e.target.value) })
                }
                className="rounded-xl border-[#DDE7DD] text-sm font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#1F2D22] mb-1.5 block">
                Free Shipping Threshold (৳)
              </label>
              <Input
                type="number"
                value={formData.freeShippingThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, freeShippingThreshold: Number(e.target.value) })
                }
                className="rounded-xl border-[#DDE7DD] text-sm font-bold text-[#1E5A3A]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[#F7F8F5] p-4">
            <div>
              <span className="font-bold text-[#1F2D22] text-sm block flex items-center gap-1.5">
                <CreditCard size={16} className="text-[#1E5A3A]" /> Cash On Delivery (COD) Enabled
              </span>
              <span className="text-xs text-[#66746A]">Allow customers to pay upon delivery at doorstep.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.codEnabled}
                onChange={(e) => setFormData({ ...formData, codEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E5A3A]"></div>
            </label>
          </div>
        </div>

        {/* Section 4: Social Links */}
        <div className="rounded-[20px] border border-[#DDE7DD] bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-[#DDE7DD] pb-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#1E5A3A]">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1F2D22]">Social Channels</h3>
              <p className="text-xs text-[#66746A]">Pick Plant social media URLs linked in header & footer.</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase text-[#1F2D22] mb-1.5 block">Facebook Page</label>
              <Input
                value={formData.facebookUrl}
                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                className="rounded-xl border-[#DDE7DD] text-sm font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-[#1F2D22] mb-1.5 block">Instagram Account</label>
              <Input
                value={formData.instagramUrl}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                className="rounded-xl border-[#DDE7DD] text-sm font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-[#1F2D22] mb-1.5 block">YouTube Channel</label>
              <Input
                value={formData.youtubeUrl}
                onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                className="rounded-xl border-[#DDE7DD] text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-xl bg-[#1E5A3A] px-8 text-sm font-bold text-white shadow-md transition hover:bg-[#17482F] inline-flex items-center gap-2"
          >
            <Save size={18} /> {isSubmitting ? "Saving Configuration..." : "Save Store Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
