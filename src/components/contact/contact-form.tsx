"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Globe,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactFormSchema, type ContactFormInput } from "@/lib/contact/contact-validation";

export function ContactFormView() {
  const searchParams = useSearchParams();
  const initialSubject = searchParams.get("subject") || "";
  const initialInquiryType = searchParams.get("inquiryType") || "General Inquiry";

  const [formData, setFormData] = useState<ContactFormInput>({
    name: "",
    email: "",
    phone: "",
    subject: initialSubject,
    inquiryType: initialInquiryType,
    message: "",
    consent: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});

    // Client-side Zod validation
    const result = contactFormSchema.safeParse(formData);
    if (!result.success) {
      const formatted: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          formatted[String(issue.path[0])] = issue.message;
        }
      });
      setFieldErrors(formatted);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const response = await res.json() as { success: boolean; message?: string; error?: string };
      if (response.success) {
        setSuccessMessage(response.message || "Your message has been sent successfully!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          inquiryType: "General Inquiry",
          message: "",
          consent: false,
        });
      } else {
        setErrorMessage(response.error || "Failed to send message.");
      }
    } catch {
      setErrorMessage("Network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="py-8 sm:py-12">
      <Container>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact Us" }]} />

        {/* Hero Header */}
        <header className="relative mt-6 overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[var(--primary)] to-emerald-950 p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-200 backdrop-blur-md">
              <MessageSquare size={14} /> Get in Touch
            </div>
            <h1 className="mt-4 text-3xl font-extrabold sm:text-5xl tracking-tight">
              We&apos;d Love to Hear From You
            </h1>
            <p className="mt-4 text-base sm:text-lg text-emerald-100/90 leading-relaxed">
              গাছের যত্ন, অর্ডারের তথ্য, কনসালটেশন বা সার্ভিস ইনকোয়ারির জন্য ফর্মটি পূরণ করে মেসেজ পাঠান।
            </p>
          </div>
        </header>

        {/* Grid Layout */}
        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_24rem]">
          {/* Form */}
          <section className="rounded-3xl border border-stone-200/90 bg-white p-7 sm:p-10 shadow-sm">
            <h2 className="text-2xl font-bold text-stone-900">Send Us a Message</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Fill out the form below and our plant care team will respond within 24 hours.
            </p>

            {successMessage && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <CheckCircle2 size={20} className="shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Message Received!</h4>
                  <p className="text-xs mt-0.5 leading-relaxed">{successMessage}</p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900">
                <AlertCircle size={20} className="shrink-0 text-red-600 mt-0.5" />
                <p className="text-xs font-semibold">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Your Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Tanvir Ahmed"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="rounded-xl border-stone-200"
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.name}</p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="e.g. tanvir@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="rounded-xl border-stone-200"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {/* Phone Number (Optional) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Phone Number (Optional)
                  </label>
                  <Input
                    type="tel"
                    placeholder="e.g. 01700000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="rounded-xl border-stone-200"
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.phone}</p>
                  )}
                </div>

                {/* Inquiry Type */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Inquiry Type *
                  </label>
                  <select
                    value={formData.inquiryType}
                    onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm font-medium text-stone-800 focus:border-[var(--primary)] focus:outline-none"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Service Inquiry">Gardening Service Inquiry</option>
                    <option value="Plant Care Support">Plant Health Emergency</option>
                    <option value="Custom Project">Custom Landscaping / Corporate</option>
                    <option value="Order Support">Order & Delivery Support</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Subject *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Inquiry about balcony garden setup"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="rounded-xl border-stone-200"
                />
                {fieldErrors.subject && (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.subject}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Your Message *
                </label>
                <Textarea
                  rows={5}
                  placeholder="Tell us details about your inquiry or plant requirements..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="rounded-xl border-stone-200"
                />
                {fieldErrors.message && (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.message}</p>
                )}
              </div>

              {/* Consent Checkbox */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consent}
                    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-stone-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="text-xs text-[var(--muted)] leading-relaxed font-medium">
                    I agree to allow Pick Plant to store and process my contact details to respond to this message.
                  </span>
                </label>
                {fieldErrors.consent && (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.consent}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto h-12 px-8 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-bold rounded-xl shadow-md transition inline-flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  "Sending Message..."
                ) : (
                  <>
                    Send Message <Send size={16} />
                  </>
                )}
              </Button>
            </form>
          </section>

          {/* Contact Details & Info Card */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-stone-200/90 bg-stone-900 text-white p-7 sm:p-8 space-y-6 shadow-sm">
              <h3 className="text-xl font-bold border-b border-stone-800 pb-4">
                Contact Information
              </h3>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Office & Nursery Address</h4>
                    <p className="text-sm text-stone-200 mt-1 leading-relaxed">
                      House 42, Road 11, Block D, Banani, Dhaka-1213, Bangladesh
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Phone Support</h4>
                    <p className="text-sm text-stone-200 mt-1 font-semibold">+880 1700-000000</p>
                    <p className="text-xs text-stone-400 mt-0.5">+880 1800-111222 (Hotline)</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Email Inquiries</h4>
                    <p className="text-sm text-stone-200 mt-1">support@pickplant.com</p>
                    <p className="text-xs text-stone-400 mt-0.5">sales@pickplant.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Working Hours</h4>
                    <p className="text-sm text-stone-200 mt-1">Saturday – Thursday: 9:00 AM – 8:00 PM</p>
                    <p className="text-xs text-emerald-400 font-semibold mt-0.5">Friday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Coverage Card */}
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-7 space-y-3 text-emerald-950">
              <h4 className="font-bold text-base flex items-center gap-2">
                <Globe size={18} className="text-emerald-700" /> Delivery & Service Coverage
              </h4>
              <p className="text-xs text-emerald-900/80 leading-relaxed">
                • <strong>Dhaka City:</strong> 1-2 Days Fast Home Delivery & On-Site Setup.  
                <br />
                • <strong>Nationwide Bangladesh:</strong> 3-5 Days Courier Delivery for Healthy Plants & Supplies.
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
