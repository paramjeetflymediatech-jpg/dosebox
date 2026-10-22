'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home,
  ArrowLeft,
  Search,
  Pill,
  UploadCloud,
  BookOpen,
  ShoppingCart,
  PhoneCall,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
} from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/medicines?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/medicines');
    }
  };

  const quickLinks = [
    {
      title: 'Specialty Medicines',
      desc: 'Browse oncology, nephrology & critical care medicines',
      href: '/medicines',
      icon: Pill,
      badge: 'Up to 85% OFF',
      color: 'teal',
    },
    {
      title: 'Upload Prescription',
      desc: 'Quick 1-step order — our pharmacists verify and prepare your order',
      href: '/upload-prescription',
      icon: UploadCloud,
      badge: 'Fast Delivery',
      color: 'emerald',
    },
    {
      title: 'Health Blogs & Guides',
      desc: 'Doctor-reviewed medication advice, dosage & wellness articles',
      href: '/blogs',
      icon: BookOpen,
      badge: 'Verified Info',
      color: 'blue',
    },
    {
      title: 'View Your Cart',
      desc: 'Review your saved medicines and proceed to checkout',
      href: '/cart',
      icon: ShoppingCart,
      badge: 'Active Items',
      color: 'amber',
    },
  ];

  const popularKeywords = [
    'Keytruda',
    'Lenalidomide',
    'Albumin',
    'Tacrolimus',
    'Pirfenidone',
    'Sorafenib',
  ];

  return (
    <main className="min-h-[85vh] bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50 flex flex-col justify-center relative overflow-hidden py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      {/* Decorative Background Orbs */}
      <div
        aria-hidden="true"
        className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#1F5C52]/10 via-emerald-200/20 to-teal-100/10 rounded-full blur-3xl pointer-events-none -z-0"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-10 right-10 w-72 h-72 bg-amber-100/30 rounded-full blur-2xl pointer-events-none -z-0"
      />

      <div className="relative z-10 max-w-4xl mx-auto w-full text-center">
        {/* Top Mini Pill Indicator */}
        {/* <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200/60 text-rose-700 text-xs font-black tracking-wider uppercase mb-6 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          Error 404 • Page Not Found
        </div> */}

        {/* Visual 404 Hero Illustration */}
        <div className="relative mb-6 inline-flex flex-col items-center">
          <div className="relative">
            <h1 className="text-7xl sm:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#1F5C52] via-emerald-600 to-[#174a42] select-none leading-none">
              404
            </h1>

            {/* Floating Medicine Capsule Icon Overlay */}
            <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-200 shadow-lg flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform">
              <Pill className="w-6 h-6 sm:w-8 sm:h-8 text-[#1F5C52]" />
            </div>
          </div>
        </div>

        {/* Headline & Friendly Reassurance */}
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
          This Aisle Seems to Be Missing
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto leading-relaxed mb-8">
          The medicine, article, or page you were looking for might have been moved, renamed,
          or is temporarily out of stock in this section.
        </p>

        {/* Search Bar for Direct Navigation */}
        <div className="max-w-xl mx-auto mb-6">
          <form
            onSubmit={handleSearch}
            className="relative flex items-center bg-white rounded-2xl border-2 border-slate-200 hover:border-[#1F5C52]/50 focus-within:border-[#1F5C52] shadow-sm transition-all p-1.5"
          >
            <div className="pl-3.5 pr-2 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by medicine name, brand, or condition..."
              className="w-full bg-transparent border-0 focus:outline-none text-sm text-slate-900 placeholder-slate-400 font-medium py-2"
            />
            <button
              type="submit"
              className="bg-[#1F5C52] hover:bg-[#174a42] text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Popular searches hints */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Popular:</span>
            {popularKeywords.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => router.push(`/medicines?q=${encodeURIComponent(kw)}`)}
                className="bg-slate-100 hover:bg-[#EAF4F2] hover:text-[#1F5C52] px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* Main CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            Go Back
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#1F5C52] hover:bg-[#174a42] text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-sm transition-all hover:shadow-md cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Return to Home
          </Link>

          <Link
            href="/upload-prescription"
            className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl border border-emerald-200/80 transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-emerald-600" />
            Upload Prescription
          </Link>
        </div>

        {/* Explore Other Aisles / Quick Links Grid */}
        <div className="text-left mt-8 pt-8 border-t border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500">
              Popular Pharmacy Aisles
            </h3>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Find medicines, services & care
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group relative bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-[#1F5C52]/40 rounded-2xl p-4 transition-all duration-200 shadow-2xs hover:shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EAF4F2] text-[#1F5C52] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 group-hover:bg-[#EAF4F2] group-hover:text-[#1F5C52] px-2 py-0.5 rounded-full transition-colors">
                        {item.badge}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#1F5C52] transition-colors mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#1F5C52] mt-3 pt-2.5 border-t border-slate-100">
                    <span>Visit aisle</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Emergency / Pharmacist Help Strip */}
        <div className="mt-8 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 rounded-2xl border border-emerald-200/60 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                Can&apos;t find your prescribed medicine?
              </p>
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
                Our licensed super-specialty pharmacists can source hard-to-find oncology &amp; critical medicines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <a
              href="tel:+919876543210"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Pharmacist</span>
            </a>
            <Link
              href="/consultations"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Help Desk</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
