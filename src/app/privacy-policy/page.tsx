import React from 'react';
import { Lock, FileKey, ShieldCheck, UserCog, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden py-12 sm:px-6 lg:px-8">
      {/* Decorative background elements */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-50 to-slate-50 pointer-events-none" />
      <div className="absolute top-1/4 -right-64 w-96 h-96 bg-indigo-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-sky-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        
        {/* Breadcrumb / Navigation */}
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900">Privacy Policy</span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Header Section */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-8 py-12 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 p-8 opacity-10">
              <Lock className="w-64 h-64 transform rotate-12" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white mb-6 shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
                  Privacy & HIPAA Compliance
                </h1>
                <p className="text-indigo-100 font-medium text-sm md:text-base max-w-lg leading-relaxed">
                  Your medical data is sensitive. We treat your personal and health information with the highest level of security and confidentiality.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3 text-white">
                <AlertCircle className="w-5 h-5 text-indigo-200" />
                <span className="text-sm font-semibold tracking-wide">Last Updated: March 2024</span>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 md:p-12 space-y-12">
            
            <section className="flex flex-col md:flex-row gap-6 md:gap-8 bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-indigo-100 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-200 relative z-10">
                  <FileKey className="w-7 h-7" />
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Data Encryption & Storage</h3>
                <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
                  All personal data, medical records, and prescriptions uploaded to our platform are encrypted in transit using industry-standard <strong className="text-slate-800">TLS protocols</strong> and at rest using <strong className="text-slate-800">AES-256 encryption</strong>. Our database infrastructure ensures robust data isolation and continuous security monitoring.
                </p>
              </div>
            </section>

            <section className="flex flex-col md:flex-row gap-6 md:gap-8 bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-sky-100 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center border border-sky-200 relative z-10">
                  <ShieldCheck className="w-7 h-7" />
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Information Sharing</h3>
                <p className="text-[15px] text-slate-600 leading-relaxed font-medium mb-4">
                  We do not sell, rent, or trade your personal or medical information to third-party marketers. Your data is strictly shared on a <span className="italic text-slate-800">need-to-know basis</span> with:
                </p>
                <ul className="space-y-3 text-[14px] text-slate-600 font-medium">
                  <li className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                    <span>Our registered pharmacists to verify and fulfill your prescriptions.</span>
                  </li>
                  <li className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                    <span>Delivery partners (restricted to basic contact and delivery address).</span>
                  </li>
                  <li className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                    <span>Legal authorities if mandated by law or a valid court order.</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="flex flex-col md:flex-row gap-6 md:gap-8 bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-rose-100 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-200 relative z-10">
                  <UserCog className="w-7 h-7" />
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Your Rights & Controls</h3>
                <p className="text-[15px] text-slate-600 leading-relaxed font-medium mb-4">
                  You have the right to request a copy of your personal data, request corrections to inaccurate data, or request the deletion of your account and associated records (subject to regulatory retention requirements for medical prescriptions).
                </p>
                <Link 
                  href="/data-deletion" 
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-700 font-bold rounded-xl border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition-all text-sm shadow-sm"
                >
                  Manage Data Deletion
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

          </div>
          
          <div className="bg-slate-50 border-t border-slate-100 p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm font-medium">Have questions about your privacy?</p>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
            >
              Contact Privacy Officer
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
