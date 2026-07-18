'use client';
import React, { useState } from 'react';
import { AlertTriangle, Trash2, CheckCircle2, ShieldCheck, Mail, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function DataDeletionPage() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/data-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        toast.success('Your data deletion request has been submitted.');
      } else {
        toast.error(data.message || 'Failed to submit request.');
      }
    } catch (error) {
      console.error('Data Deletion Request Error:', error);
      toast.error('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center py-12 sm:px-6 lg:px-8">
      {/* Decorative background elements */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-rose-50 to-slate-50 pointer-events-none" />
      <div className="absolute top-1/4 -left-64 w-96 h-96 bg-rose-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-brand-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none" />

      <div className="max-w-xl w-full space-y-8 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Header Section */}
          <div className="bg-gradient-to-br from-rose-600 to-rose-700 px-8 py-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Trash2 className="w-48 h-48 -mr-16 -mt-16 transform rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white mb-6 shadow-inner">
                {isSuccess ? <CheckCircle2 className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                Account Deletion
              </h1>
              <p className="text-rose-100 font-medium text-sm max-w-sm mx-auto leading-relaxed">
                {isSuccess 
                  ? "We've received your request." 
                  : "Submit a request to permanently remove your data from our systems."}
              </p>
            </div>
          </div>

          <div className="px-8 py-10">
            {isSuccess ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full mb-6 ring-8 ring-emerald-50/50">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Request Successfully Submitted</h2>
                <p className="text-slate-600 mb-10 leading-relaxed">
                  Your data deletion request has been securely logged. Our support team will process it within the legally required timeframe and remove your personal information in accordance with our privacy policy.
                </p>
                <Link 
                  href="/"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-semibold rounded-2xl hover:bg-slate-800 transition-all hover:shadow-lg hover:shadow-slate-900/20 group"
                >
                  Return to Homepage
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ) : (
              <>
                <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-6 mb-8 flex items-start gap-4">
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-rose-100 flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-rose-900 mb-1.5">Permanent Action Warning</h3>
                    <p className="text-sm text-rose-700 leading-relaxed font-medium">
                      This action is permanent and cannot be undone. Once processed, all your personal data, order history, and account details will be irreversibly removed.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                      Account Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your registered email"
                        className="block w-full pl-11 pr-4 py-3.5 rounded-2xl border-slate-200 bg-slate-50 border focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reason" className="block text-sm font-bold text-slate-700 mb-2">
                      Reason for Deletion <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute top-3.5 left-0 pl-4 flex items-start pointer-events-none">
                        <FileText className="h-5 w-5 text-slate-400" />
                      </div>
                      <textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        rows={4}
                        placeholder="Please tell us why you are leaving..."
                        className="block w-full pl-11 pr-4 py-3.5 rounded-2xl border-slate-200 bg-slate-50 border focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 resize-none"
                      ></textarea>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-600/20 transition-all disabled:opacity-70 flex items-center justify-center gap-3 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing Request...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-5 h-5" />
                          Confirm Deletion Request
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-6 font-medium">
                      By submitting this request, you agree to our <Link href="/privacy-policy" className="text-rose-600 hover:underline">Privacy Policy</Link>.
                    </p>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
