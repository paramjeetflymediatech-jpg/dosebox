import React from 'react';
import { RefreshCcw, AlertTriangle, HelpCircle, PackageX, BoxSelect, CalendarClock, Gift, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden py-12 sm:px-6 lg:px-8">
      {/* Decorative background elements */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-amber-50 to-slate-50 pointer-events-none" />
      <div className="absolute top-1/4 -right-64 w-96 h-96 bg-amber-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-orange-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        
        {/* Breadcrumb / Navigation */}
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Link href="/" className="hover:text-amber-600 transition-colors">Home</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900">Return Policy</span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Header Section */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 px-8 py-12 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 p-8 opacity-10">
              <RefreshCcw className="w-64 h-64 transform rotate-12" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white mb-6 shadow-inner">
                  <RefreshCcw className="w-8 h-8" />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
                  Return & Safety Policy
                </h1>
                <p className="text-amber-50 font-medium text-sm md:text-base max-w-lg leading-relaxed">
                  Ensuring patient safety is our top priority. Due to the sensitive nature of pharmaceutical products, our return policy is strictly regulated.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3 text-white">
                <AlertTriangle className="w-5 h-5 text-amber-200" />
                <span className="text-sm font-semibold tracking-wide">Last Updated: March 2024</span>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 md:p-12 space-y-12">
            
            <section className="bg-rose-50/50 rounded-3xl p-6 md:p-8 border border-rose-100 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-rose-100 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-xl border border-rose-200">
                  <PackageX className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Non-Returnable Items</h2>
              </div>

              <div className="relative z-10">
                <p className="text-[15px] text-slate-600 leading-relaxed font-medium mb-5">
                  To ensure the safety and efficacy of medications for all our patients, we cannot accept returns for:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-700 leading-relaxed">Opened or tampered packaging.</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-700 leading-relaxed">Temperature-controlled medications (e.g., insulin) once leaving our facility.</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-700 leading-relaxed">Any medication past 7 days from the delivery date.</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <RefreshCcw className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Acceptable Return Conditions</h2>
              </div>
              
              <p className="text-[15px] text-slate-600 leading-relaxed font-medium mb-6">
                Returns or replacements are only processed under the strictly monitored circumstances listed below.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-shadow group">
                  <BoxSelect className="w-8 h-8 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                  <span className="block font-bold text-slate-900 text-lg mb-2">Wrong Item Delivered</span>
                  <span className="text-sm text-slate-600 font-medium">If the medicine delivered does not match your ordered prescription exactly.</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-shadow group">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
                  <span className="block font-bold text-slate-900 text-lg mb-2">Damaged Packaging</span>
                  <span className="text-sm text-slate-600 font-medium">If the product arrived with broken seals or signs of physical damage.</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-shadow group">
                  <CalendarClock className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                  <span className="block font-bold text-slate-900 text-lg mb-2">Near Expiry</span>
                  <span className="text-sm text-slate-600 font-medium">If the medicine has an expiration date of less than 3 months upon arrival.</span>
                </div>
              </div>
            </section>

            <section className="bg-amber-50/50 rounded-3xl p-6 md:p-8 border border-amber-100 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-amber-100 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl border border-amber-200">
                  <Gift className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reward Points Policy</h2>
              </div>
              
              <div className="relative z-10">
                <p className="text-[15px] text-slate-700 leading-relaxed font-bold mb-4 bg-white p-4 rounded-xl border border-amber-200 shadow-sm inline-block">
                  Important: We do not offer cash refunds. Instead, we have a rewarding points system.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-2">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-start gap-2">
                    <span className="text-amber-600 font-black text-xl">1 : ₹1</span>
                    <h4 className="font-bold text-slate-900 text-sm">Base Rewards</h4>
                    <span className="text-sm text-slate-600 font-medium leading-relaxed">Earn 1 point for every ₹1 spent on your orders.</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-start gap-2">
                    <span className="text-amber-600 font-black text-xl">+50</span>
                    <h4 className="font-bold text-slate-900 text-sm">Bonus for ₹500</h4>
                    <span className="text-sm text-slate-600 font-medium leading-relaxed">If your bill is exactly ₹500, receive an extra 50 bonus points.</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-start gap-2">
                    <span className="text-amber-600 font-black text-xl">+100</span>
                    <h4 className="font-bold text-slate-900 text-sm">Bonus for &gt;₹500</h4>
                    <span className="text-sm text-slate-600 font-medium leading-relaxed">If your bill exceeds ₹500, receive an extra 100 bonus points.</span>
                  </div>
                </div>
              </div>
            </section>

          </div>
          
          <div className="bg-slate-50 border-t border-slate-100 p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm font-medium">Need to request a replacement?</p>
            <Link 
              href="/dashboard/customer" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
            >
              Go to My Orders
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
