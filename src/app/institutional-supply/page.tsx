'use client';

import React from 'react';
import { Building2, Package, ShieldCheck, Truck } from 'lucide-react';
import SupportContactSection from '../../components/SupportContactSection';

export default function InstitutionalSupplyPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 pt-24 pb-32">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-brand-400 opacity-20 blur-[100px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-sm font-semibold mb-6 border border-brand-100">
            <Building2 className="w-4 h-4" /> B2B Healthcare Partner
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Seamless Procurement for <span className="text-brand-600">Healthcare Institutions</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Partnering with hospitals, clinics, and pharmacies to provide bulk supply of genuine medicines with priority fulfillment and wholesale pricing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#contact-support" className="inline-flex justify-center items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-8 rounded-full transition-all shadow-lg shadow-brand-200 w-full sm:w-auto text-lg">
              Partner With Us
            </a>
            <a href="#contact-support" className="inline-flex justify-center items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-8 rounded-full transition-all border border-slate-200 shadow-sm w-full sm:w-auto text-lg">
              Report an Issue
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                <Package className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Bulk Orders & Pricing</h3>
              <p className="text-slate-600 leading-relaxed">
                Enjoy specialized B2B pricing, dedicated account managers, and priority fulfillment for large-scale healthcare institutional needs.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Verified Supply Chain</h3>
              <p className="text-slate-600 leading-relaxed">
                100% genuine medicines sourced directly from manufacturers with complete GST compliance and automated invoicing.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Priority Logistics</h3>
              <p className="text-slate-600 leading-relaxed">
                Cold-chain capability and expedited nationwide delivery ensures your critical supplies reach you exactly when needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Support / Contact Section */}
      <SupportContactSection />

    </div>
  );
}
