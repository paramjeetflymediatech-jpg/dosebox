import React from 'react';
import { Building2, Package, Handshake, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function InstitutionalSupplyPage() {
  return (
    <div className="bg-slate-50/50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-white rounded-[2rem] border border-slate-100/50 shadow-sm p-8 sm:p-12">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-8">
            <Building2 className="w-8 h-8" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Institutional Supply
          </h1>
          <p className="text-slate-500 font-medium mb-10 text-lg leading-relaxed">
            Partnering with hospitals, clinics, and healthcare organizations to provide bulk supply of genuine medicines with seamless procurement.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <Package className="w-6 h-6 text-slate-700 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Bulk Orders & Pricing</h3>
              <p className="text-sm text-slate-500">We offer specialized B2B pricing, dedicated account managers, and priority fulfillment for large healthcare institutions.</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <Handshake className="w-6 h-6 text-slate-700 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Vendor Registration</h3>
              <p className="text-sm text-slate-500">Easy onboarding process with GST compliance, automated invoicing, and credit line facilities for verified partners.</p>
            </div>
          </div>

          <div className="bg-blue-50/50 rounded-2xl p-8 border border-blue-100 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Ready to partner with us?</h2>
            <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">Get in touch with our institutional sales team to discuss your organization's requirements.</p>
            <Link href="/consultations" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all">
              Contact Sales Team <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
