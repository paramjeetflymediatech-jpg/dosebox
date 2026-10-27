"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Building2,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    category: "Compliance",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success(
        formData.category === "Compliance"
          ? "Grievance received. Our Compliance Officer will respond within 48 hours."
          : "Message sent! Our support team will get in touch shortly."
      );
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Breadcrumb & Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-200 rounded-full text-brand-700 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            Official Regulatory & Customer Support
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Contact Support & Compliance Center
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Have questions about clinical orders, cold-chain safety, or statutory regulations?
            Reach our customer assistance desk or connect directly with our designated Compliance Officer.
          </p>
        </div>

        {/* Highlighted Compliance Officer Desk */}
        <div className="bg-gradient-to-br from-brand-900 via-brand-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-brand-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                Statutory Redressal Desk
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Contact Compliance & Grievance Officer
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Under the Drugs and Cosmetics Act (1940), Drugs & Cosmetics Rules (1945), and Digital Personal Data Protection (DPDP) Act 2023, DoseBox maintains a dedicated Grievance Officer for handling regulatory inquiries, drug batch verifications, and compliance disclosures.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
                  <span className="text-[11px] font-bold text-brand-300 uppercase tracking-widest block mb-1">
                    Designated Officer
                  </span>
                  <p className="text-base font-bold text-white">Regulatory Compliance Head</p>
                  <p className="text-xs text-slate-400">DoseBox Healthcare Pvt. Ltd.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
                  <span className="text-[11px] font-bold text-brand-300 uppercase tracking-widest block mb-1">
                    Statutory SLA
                  </span>
                  <p className="text-base font-bold text-emerald-400">Acknowledgment within 24h</p>
                  <p className="text-xs text-slate-400">Resolution within 48-72 hours</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white/10 border border-white/15 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <h3 className="font-extrabold text-base text-white border-b border-white/10 pb-3">
                Compliance Desk Direct Contacts
              </h3>
              <ul className="space-y-3.5 text-xs text-slate-200">
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Official Compliance Email</span>
                    <a href="mailto:compliance@dosebox.in" className="text-brand-200 hover:underline">
                      compliance@dosebox.in
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Regulatory Priority Desk</span>
                    <span>+91 11 4000 3000 (Mon - Sat, 9 AM - 6 PM IST)</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Nodal Registered Office</span>
                    <span>B 2, Basement, Mohta Building 4, Bhikaji Cama Place, New Delhi, Delhi - 110066</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Statutory Guidelines</span>
                    <Link href="/fda-guidelines" className="text-brand-300 hover:underline inline-flex items-center gap-1 font-semibold">
                      Read FDA (India) Regulatory Guidelines <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 2-Column: General Inquiries Form + Direct Helplines */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Direct Customer Support Cards */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-lg">
                Customer Care & Order Assistance
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                For everyday prescription assistance, tracking queries, and chronic refills, contact our pharmacy helpdesk.
              </p>

              <div className="space-y-3 pt-2">
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    WA
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-emerald-950 text-xs sm:text-sm">WhatsApp Care Desk</p>
                    <p className="text-[11px] text-emerald-700">Instant answers for prescriptions & PAP offers</p>
                  </div>
                </a>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-slate-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm">Email Support</p>
                    <p className="text-[11px] text-slate-500">support@dosebox.in</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-slate-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm">Operating Hours</p>
                    <p className="text-[11px] text-slate-500">9:00 AM – 8:00 PM IST (All 7 Days)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                Emergency Medical Notice
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                DoseBox is an e-pharmacy and specialty delivery platform. For medical emergencies or acute conditions, please immediately call 112 (India) or visit the nearest hospital emergency department.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Contact / Compliance Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl">
                  Send a Formal Message
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                  Choose the query type to direct your communication to the right team.
                </p>
              </div>

              {isSubmitted ? (
                <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="text-lg font-black text-emerald-950">
                    Inquiry Received Successfully
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto">
                    Your request has been routed to our{" "}
                    <strong>
                      {formData.category === "Compliance"
                        ? "Compliance Officer Desk"
                        : "Customer Support Team"}
                    </strong>
                    . A case tracking ID and copy of your message has been logged.
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({
                        fullName: "",
                        email: "",
                        phone: "",
                        category: "Compliance",
                        subject: "",
                        message: "",
                      });
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-emerald-300 text-emerald-800 font-bold text-xs rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        placeholder="e.g. Dr. Rajesh Sharma"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="rajesh@example.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Department / Inquiry Type *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                      >
                        <option value="Compliance">
                          Compliance & Grievance Officer
                        </option>
                        <option value="Order">Order & Delivery Assistance</option>
                        <option value="Prescription">
                          Prescription / Pharmacist Review
                        </option>
                        <option value="PAP">
                          Patient Assistance Program (PAP)
                        </option>
                        <option value="Institutional">
                          Institutional / Hospital Supply
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      placeholder="Summary of your inquiry or grievance..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Detailed Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="Please provide complete details, including relevant Order ID or Prescription ID if applicable..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#1F5C52] hover:bg-[#174a42] text-white font-bold text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#1F5C52]/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>
                          {formData.category === "Compliance"
                            ? "Submit to Compliance Officer"
                            : "Submit Inquiry"}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
