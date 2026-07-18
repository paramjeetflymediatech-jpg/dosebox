import React from 'react';
import { Shield, CheckCircle2, FileCheck, Stethoscope, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FDAGuidelinesPage() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden py-12 sm:px-6 lg:px-8">
      {/* Decorative background elements */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-brand-50 to-slate-50 pointer-events-none" />
      <div className="absolute top-1/4 -right-64 w-96 h-96 bg-brand-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-emerald-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        
        {/* Breadcrumb / Navigation */}
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Link href="/" className="hover:text-brand-600 transition-colors">Home</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900">FDA Guidelines</span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Header Section */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-12 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 p-8 opacity-10">
              <Shield className="w-64 h-64 transform rotate-12" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white mb-6 shadow-inner">
                  <Shield className="w-8 h-8" />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
                  FDA & CDSCO Guidelines
                </h1>
                <p className="text-brand-100 font-medium text-sm md:text-base max-w-lg leading-relaxed">
                  We adhere strictly to the guidelines established by the Central Drugs Standard Control Organization (CDSCO) and state FDA authorities in India.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3 text-white">
                <AlertCircle className="w-5 h-5 text-brand-200" />
                <span className="text-sm font-semibold tracking-wide">Last Updated: March 2024</span>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 md:p-12 space-y-12">
            
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand-50 text-brand-600 rounded-xl border border-brand-100">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Prescription Requirements</h2>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-100 to-white rounded-full -mr-16 -mt-16 pointer-events-none" />
                
                <p className="text-slate-600 text-[15px] leading-relaxed mb-6 relative z-10 font-medium">
                  As per the Drugs and Cosmetics Act, 1940 and Rules, 1945, certain medicines (Schedule H, H1, and X) cannot be sold without a valid prescription from a registered medical practitioner.
                </p>
                
                <ul className="space-y-4 relative z-10">
                  <li className="flex items-start gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">Legible & Verified</h4>
                      <span className="text-sm text-slate-600 leading-relaxed">Prescriptions must be clear, legible, and distinctly include the doctor's registration number and signature.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">Digital Prescriptions</h4>
                      <span className="text-sm text-slate-600 leading-relaxed">Digital prescriptions are accepted provided they fully comply with the Telemedicine Practice Guidelines issued by the Ministry of Health and Family Welfare.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">Schedule X Restrictions</h4>
                      <span className="text-sm text-slate-600 leading-relaxed">Schedule X drugs are strictly monitored and require original physical copies of the prescription in specific mandated formats.</span>
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quality Assurance & Sourcing</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-slate-900 mb-3 text-lg">Direct Sourcing</h3>
                  <p className="text-slate-600 text-[15px] leading-relaxed">
                    All medications provided through our platform are sourced directly from authorized distributors or the manufacturers themselves. We guarantee that no counterfeit, expired, or sub-standard drugs are distributed.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-slate-900 mb-3 text-lg">Rigorous Auditing</h3>
                  <p className="text-slate-600 text-[15px] leading-relaxed">
                    Our facilities are regularly audited by local FDA bodies to ensure proper storage conditions, especially for temperature-sensitive medications like vaccines and specialized oncology drugs.
                  </p>
                </div>
              </div>
            </section>

          </div>
          
          <div className="bg-slate-50 border-t border-slate-100 p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm font-medium">Questions about compliance or prescriptions?</p>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
            >
              Contact Support
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
