'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShieldCheck, Truck, Percent, Activity, Star, ArrowRight, ChevronDown, Award, Sparkles, AlertCircle, FileText, CheckCircle2, ThermometerSnowflake, FileCheck, Stethoscope, Droplets, Heart, ActivitySquare, Pill, Beaker, Filter, Calendar
} from 'lucide-react';
import Link from 'next/link';
import api from '../lib/api';
import { useCart } from '../context/CartContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  image: string;
  link: string;
}

interface Medicine {
  id: number;
  name: string;
  genericName: string;
  composition: string;
  price: number;
  discountPrice?: number;
  images: string;
  prescriptionRequired: boolean;
  brand?: { name: string };
}

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
}

export default function HomePage() {
  const { addToCart } = useCart();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trending, setTrending] = useState<Medicine[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const categoriesRef = useRef<HTMLElement>(null);
  const trendingRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  const testimonialsRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Scroll animations
    const sections = [
      featuresRef.current,
      categoriesRef.current,
      trendingRef.current,
      ctaRef.current,
      testimonialsRef.current,
      faqRef.current
    ];

    sections.forEach((section) => {
      if (section) {
        gsap.fromTo(
          section,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            }
          }
        );
      }
    });

    // Staggered cards in features
    if (featuresRef.current) {
      gsap.fromTo(
        gsap.utils.toArray('.feature-card', featuresRef.current),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: featuresRef.current,
            start: 'top 80%',
          }
        }
      );
    }

    // Staggered categories
    if (categoriesRef.current) {
      gsap.fromTo(
        gsap.utils.toArray('.category-card', categoriesRef.current),
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: categoriesRef.current,
            start: 'top 80%',
          }
        }
      );
    }

    // Staggered medicine cards
    if (trendingRef.current) {
      gsap.fromTo(
        gsap.utils.toArray('.medicine-card', trendingRef.current),
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.1)',
          scrollTrigger: {
            trigger: trendingRef.current,
            start: 'top 80%',
          }
        }
      );
    }
  }, { scope: containerRef });

  // Load content
  useEffect(() => {
    async function loadData() {
      try {
        const [banRes, catRes, medRes] = await Promise.all([
          api.get('/admin/banners'),
          api.get('/medicines/categories'),
          api.get('/medicines?limit=4')
        ]);
        
        if (banRes.data?.success) setBanners(banRes.data.data);
        if (catRes.data?.success) setCategories(catRes.data.data);
        if (medRes.data?.success) setTrending(medRes.data.data);
      } catch (err) {
        console.warn('API error in homepage. Loading static fallbacks.');
        // Setup default fallbacks
        setBanners([
          { id: 1, title: 'Flat 15% OFF on Chronic Care Medicines', subtitle: 'Manage Diabetes & Heart Health with Ease', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200', link: '/medicines?category=chronic-care' },
          { id: 2, title: 'Instant Doctor Video Consultation at ₹499', subtitle: 'Speak to Certified Specialists in 10 Mins', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200', link: '/consultations' }
        ]);
        setCategories([
          { id: 1, name: 'Chronic Care', slug: 'chronic-care', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=250' },
          { id: 2, name: 'OTC Medicines', slug: 'otc-medicines', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250' },
          { id: 3, name: 'Vitamins & Supplements', slug: 'vitamins-supplements', image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=250' },
          { id: 4, name: 'Ayurveda & Herbs', slug: 'ayurveda-herbs', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=250' }
        ]);
      }
    }
    loadData();
  }, []);

  // Slide loop interval
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/medicines?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleAddToCart = (med: Medicine) => {
    let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
    try {
      if (med.images) {
        imagesArr = JSON.parse(med.images);
      }
    } catch (e) {}

    addToCart({
      id: med.id,
      name: med.name,
      price: Number(med.price),
      discountPrice: med.discountPrice ? Number(med.discountPrice) : undefined,
      prescriptionRequired: med.prescriptionRequired,
      image: imagesArr[0]
    });
    alert(`${med.name} added to cart!`);
  };

  const faqs = [
    { q: 'How do I upload my doctor prescription?', a: 'You can upload your prescription in JPG, PNG, or PDF format directly from your shopping cart page or the Prescription Module inside your Customer Dashboard. Our certified pharmacist will review and verify it in under 15 minutes.' },
    { q: 'Are the medicines sold on MrMed genuine?', a: 'Yes. We source all medications directly from certified global and national pharmaceutical manufacturers (e.g. Cipla, Abbott, Sun Pharma). Every order is verified by a licensed pharmacist before dispatch.' },
    { q: 'How does the Doctor consultation booking work?', a: 'Simply head over to the Doctor Clinic section, select your doctor specialized in your field, pick a date & time slot, and submit booking. You will be able to start a video or chat consultation directly from your dashboard.' },
    { q: 'What are the charges for shipping and GST?', a: 'GST is calculated at 18% on applicable items and is already inclusive in the listed price. Shipping is FREE for orders above ₹500, else a nominal fee of ₹50 is added at checkout.' }
  ];

  return (
    <div className="relative" ref={containerRef}>
      
      {/* 1. HERO SECTION */}
      <section ref={heroRef} className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="lg:w-1/2 flex flex-col items-start text-left">
          <div className="bg-brand-50 text-brand-700 font-bold text-[10px] sm:text-xs uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-2 mb-6 border border-brand-100 shadow-sm">
            <Activity className="w-3.5 h-3.5" /> DoseBox Specialty Smart Pharmacy
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
            Specialty Medicines, <span className="text-brand-600">Up To 85% Off.</span>
          </h1>
          
          <p className="text-slate-500 text-base sm:text-lg max-w-lg leading-relaxed mb-8 font-medium">
            DoseBox is India's digital super-specialty pharmacy. Find life-saving oncology, kidney, and transplant medications with absolute cold-chain logistics, certified WHO-GMP distribution logs, and deep price transparency.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-10 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-500" /> 100% Bioequivalence</div>
            <div className="flex items-center gap-1.5"><ThermometerSnowflake className="w-4 h-4 text-accent" /> Cold Chain Validated</div>
            <div className="flex items-center gap-1.5"><FileCheck className="w-4 h-4 text-emerald-500" /> Patient Assistance (PAP)</div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link href="/upload-prescription" className="w-full sm:w-auto bg-accent hover:bg-accent-dark text-white font-bold py-3.5 px-8 rounded-full shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 border border-accent-dark/50">
              <FileText className="w-4 h-4" />
              Upload Rx & Order Specialty Drugs
            </Link>
            <Link href="/medicines" className="w-full sm:w-auto bg-[#E8F8F5] hover:bg-[#D1F2EB] text-brand-700 font-bold py-3.5 px-8 rounded-full border border-brand-200 transition-all flex items-center justify-center gap-2">
              Browse Specialties <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* HERO RIGHT BENTO CARD */}
        <div className="lg:w-[45%] w-full">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
            
            <div className="relative z-10">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Savings Simulator</div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                High-Precision Therapy Savings
                <Sparkles className="w-5 h-5 text-amber-400" />
              </h3>

              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">💊</div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Branded Drug</div>
                      <div className="font-bold text-slate-700 text-sm">Vildagliptin 50mg</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">MRP</div>
                    <div className="font-bold text-rose-500 text-sm line-through">₹245.00</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-brand-100 bg-brand-50 shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand-500" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-600 border border-brand-100 shadow-sm">✨</div>
                    <div>
                      <div className="text-[10px] text-brand-600 font-bold uppercase">DoseBox Generic</div>
                      <div className="font-bold text-brand-900 text-sm">VildaMac 50</div>
                    </div>
                  </div>
                  <div className="text-right pr-3">
                    <div className="text-[10px] text-brand-600 font-bold uppercase">DoseBox Price</div>
                    <div className="font-black text-brand-700 text-base">₹55.00</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex-1 flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estimated Annual Savings</span>
                  <span className="text-2xl font-black text-emerald-600">₹6,840.00</span>
                </div>
                <button className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-6 rounded-xl transition-all text-sm whitespace-nowrap shadow-md shadow-brand-500/20">
                  Launch Calculator <ArrowRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS STRIP */}
      <section className="bg-brand-900 border-y-4 border-brand-600/30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-white/10">
            <div className="px-4">
              <div className="text-2xl sm:text-3xl font-black text-white">80%+</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-brand-300 uppercase tracking-widest mt-1">ONCOLOGY SAVINGS RATE</div>
            </div>
            <div className="px-4">
              <div className="text-2xl sm:text-3xl font-black text-white">₹18 Cr+</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-brand-300 uppercase tracking-widest mt-1">PATIENT COSTS SAVED</div>
            </div>
            <div className="px-4">
              <div className="text-2xl sm:text-3xl font-black text-white">2-8°C</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-brand-300 uppercase tracking-widest mt-1">TEMPERATURE VERIFIED COLD CHAIN</div>
            </div>
            <div className="px-4">
              <div className="text-2xl sm:text-3xl font-black text-white">WHO-GMP</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-brand-300 uppercase tracking-widest mt-1">LICENSED GENERIC PHARMACIES</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOP BY CHRONIC CATEGORY */}
      <section ref={categoriesRef} className="py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center sm:text-left">
            <span className="text-[10px] text-brand-600 font-bold uppercase tracking-widest">Your Health Journey</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Shop by Chronic Category</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Hardcoded based on image: Oncology, Kidney, Liver, Rheumatology, Specialty Nutrients, Critical Devices */}
            <Link href="/medicines?category=oncology" className="category-card group rounded-2xl border border-slate-100 p-5 hover:border-brand-500 hover:shadow-lg transition-all flex flex-col items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-brand-50 flex items-center justify-center text-slate-600 group-hover:text-brand-600 transition-colors border border-slate-100">
                <ActivitySquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">Oncology (Cancer)</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Targeted therapies & supportive care</p>
              </div>
            </Link>

            <Link href="/medicines?category=kidney" className="category-card group rounded-2xl border border-slate-100 p-5 hover:border-accent hover:shadow-lg transition-all flex flex-col items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-rose-50 flex items-center justify-center text-slate-600 group-hover:text-accent transition-colors border border-slate-100">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">Kidney (Nephrology)</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-1">CKD & dialysis care formulations</p>
              </div>
            </Link>

            <Link href="/medicines?category=liver" className="category-card group rounded-2xl border border-slate-100 p-5 hover:border-amber-500 hover:shadow-lg transition-all flex flex-col items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-amber-50 flex items-center justify-center text-slate-600 group-hover:text-amber-500 transition-colors border border-slate-100">
                <Beaker className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">Liver (Hepatology)</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Hepatitis care & chronic liver function</p>
              </div>
            </Link>

            <Link href="/medicines?category=rheumatology" className="category-card group rounded-2xl border border-slate-100 p-5 hover:border-blue-500 hover:shadow-lg transition-all flex flex-col items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center text-slate-600 group-hover:text-blue-500 transition-colors border border-slate-100">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">Rheumatology & Transplant</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Immunosuppressants, Rheumatoid arthritis</p>
              </div>
            </Link>

            <Link href="/medicines?category=nutrients" className="category-card group rounded-2xl border border-slate-100 p-5 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center text-slate-600 group-hover:text-emerald-500 transition-colors border border-slate-100">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">Specialty Nutrients</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Renal nutrition, peptide-based diets</p>
              </div>
            </Link>

            <Link href="/medicines?category=devices" className="category-card group rounded-2xl border border-slate-100 p-5 hover:border-indigo-500 hover:shadow-lg transition-all flex flex-col items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center text-slate-600 group-hover:text-indigo-500 transition-colors border border-slate-100">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">Clinical Devices</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Glucometers, BP monitors, & critical disposables</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. DIGITAL SPECIALTY SHELF */}
      <section ref={trendingRef} className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
          <div>
            <span className="text-[10px] text-brand-600 font-bold uppercase tracking-widest">Digital Specialty Shelf</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Substitute & Save Instantly</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <input type="text" placeholder="Search generics..." className="bg-slate-50 border border-slate-200 text-slate-800 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:border-brand-500 text-sm w-48 shadow-inner" />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>
            <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trending.length > 0 ? (
            trending.map((med) => {
              let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
              try {
                if (med.images) imagesArr = JSON.parse(med.images);
              } catch(e) {}
              
              const discPrice = med.discountPrice ? Number(med.discountPrice) : null;
              const price = Number(med.price);
              const savings = discPrice ? Math.round(((price - discPrice) / price) * 100) : 0;
              
              return (
                <div 
                  key={med.id} 
                  className="medicine-card bg-white rounded-3xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  {savings > 0 && (
                    <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 font-black text-xs px-2.5 py-1 rounded-lg border border-emerald-100 z-10 shadow-sm">
                      {savings}% OFF
                    </div>
                  )}
                  {med.prescriptionRequired && (
                    <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white font-bold text-[9px] uppercase tracking-wider px-2 py-1 rounded z-10 flex items-center gap-1 shadow-sm">
                      <AlertCircle className="w-3 h-3 text-brand-400" /> Rx
                    </div>
                  )}

                  <div>
                    <div className="h-44 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden mb-5 relative group-hover:bg-brand-50/50 transition-colors duration-500 border border-slate-100">
                      <img 
                        src={imagesArr[0]} 
                        alt={med.name} 
                        className="object-contain max-h-36 mix-blend-multiply drop-shadow-sm group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{med.brand?.name || 'GENERIC'}</span>
                    <h3 className="font-bold text-slate-900 text-base mt-1 line-clamp-1 group-hover:text-brand-600 transition-colors">
                      <Link href={`/medicines/detail?id=${med.id}`}>{med.name}</Link>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-1 line-clamp-1">{med.genericName}</p>
                    
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Branded MRP:</span>
                        <span className="text-slate-400 line-through font-semibold">₹{price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-brand-700 font-bold">DoseBox Price:</span>
                        <span className="text-brand-700 font-black">₹{discPrice ? discPrice.toFixed(2) : price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <button 
                      onClick={() => handleAddToCart(med)}
                      className="w-full bg-slate-900 hover:bg-brand-600 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md hover:shadow-brand-500/20"
                    >
                      Add Equivalent Generic
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            // Static loading cards
            [1,2,3,4].map(idx => (
              <div key={idx} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm h-96 animate-pulse" />
            ))
          )}
        </div>
      </section>

      {/* 5. PERSONAL CARE ROUTINE */}
      <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/4 w-[800px] h-[800px] bg-brand-600/10 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px] translate-y-1/4 translate-x-1/4 pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-12 text-center">
            <span className="text-[10px] text-brand-400 font-bold uppercase tracking-widest">Wellness Modules</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">Find Your Personal Care Routine</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-8 hover:bg-slate-800/50 transition-colors group cursor-pointer">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <Activity className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Daily Immunity & Stamina</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Fortify your body's natural defense mechanism. Explore our curated selection of high-absorption Multivitamins, Ashwagandha extracts, and essential Zinc supplements.
              </p>
              <Link href="/medicines?category=immunity" className="inline-flex items-center gap-2 text-emerald-400 font-bold text-sm hover:text-emerald-300 transition-colors">
                Shop Immunity Pack <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-8 hover:bg-slate-800/50 transition-colors group cursor-pointer">
              <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6 border border-accent/20 group-hover:scale-110 transition-transform">
                <ActivitySquare className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Joint Health & Bone Density</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Maintain mobility and comfort with clinical-grade formulations. Discover precise dosing for Calcium Citrate, Vitamin D3 (60K IU), and Glucosamine compounds.
              </p>
              <Link href="/medicines?category=bone-health" className="inline-flex items-center gap-2 text-accent font-bold text-sm hover:text-accent-light transition-colors">
                Shop Bone Health <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CHRONIC & SPECIALTY CARE INSIGHTS */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-[10px] text-brand-600 font-bold uppercase tracking-widest">Medical Literature</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Chronic & Specialty Care Insights</h2>
            </div>
            <Link href="/blogs" className="text-brand-600 hover:text-brand-700 font-bold text-sm flex items-center gap-1">
              Read All Articles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/blogs" className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all">
              <div className="h-48 bg-slate-200 overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-brand-700 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded shadow-sm">Nephrology</div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                  <Calendar className="w-3 h-3" /> Oct 12, 2025
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2 leading-tight group-hover:text-brand-600 transition-colors">Understanding CKD Diet: What to Avoid</h3>
                <p className="text-slate-500 text-sm line-clamp-2">A comprehensive guide on managing chronic kidney disease through precise dietary control and nutrient balancing.</p>
              </div>
            </Link>

            <Link href="/blogs" className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all">
              <div className="h-48 bg-slate-200 overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-brand-700 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded shadow-sm">Oncology</div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                  <Calendar className="w-3 h-3" /> Sep 28, 2025
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2 leading-tight group-hover:text-brand-600 transition-colors">The Rise of Generic Targeted Therapies</h3>
                <p className="text-slate-500 text-sm line-clamp-2">How Indian pharmaceutical manufacturing is democratizing access to complex cancer treatments with WHO-GMP generics.</p>
              </div>
            </Link>

            <Link href="/blogs" className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all">
              <div className="h-48 bg-slate-200 overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-brand-700 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded shadow-sm">Diabetes</div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                  <Calendar className="w-3 h-3" /> Sep 15, 2025
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2 leading-tight group-hover:text-brand-600 transition-colors">Vildagliptin vs Sitagliptin: A Comparison</h3>
                <p className="text-slate-500 text-sm line-clamp-2">Breaking down the efficacy and cost-benefits of popular DPP-4 inhibitors used in Type 2 Diabetes management.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. CLINICAL CARE & ONLINE CONSULTATION CTA */}
      <section ref={ctaRef} className="bg-slate-900 text-white py-20 overflow-hidden relative rounded-[3rem] mx-4 sm:mx-8 lg:mx-auto max-w-7xl my-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-brand-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Tele-Health Consultation
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 leading-tight">
              Consult Top Verified Doctors & Specialists Online
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-4 leading-relaxed max-w-lg">
              Get diagnostic reports, prescription sheets, and expert medical advice from General Physicians, Dermatologists, and Cardiologists in under 10 minutes via private video or chat sessions.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="flex -space-x-3 overflow-hidden">
                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150" alt="" />
                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150" alt="" />
                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150" alt="" />
              </div>
              <div className="text-xs sm:text-sm text-slate-300">
                <span className="font-bold text-brand-400">12+ Certified Doctors</span> online right now
              </div>
            </div>

            <div className="mt-10">
              <Link 
                href="/consultations" 
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 px-8 rounded-full shadow-lg shadow-brand-500/20 text-sm tracking-wide transition-all inline-flex items-center gap-2"
              >
                Book Consultation Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700/80 shadow-2xl relative">
            <div className="absolute top-4 left-4 bg-brand-500/20 text-brand-400 text-xxs font-bold uppercase tracking-wider py-1 px-3 rounded-full border border-brand-500/30">
              Live clinic slots
            </div>
            
            <div className="space-y-4 mt-6">
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=100" className="object-cover w-full h-full" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Dr. Arvinder Singh</h4>
                    <p className="text-xxs text-brand-400 font-semibold">General Physician • 14 Yrs Exp</p>
                  </div>
                </div>
                <Link href="/consultations" className="bg-brand-600 hover:bg-brand-500 text-white text-xxs font-bold py-1.5 px-3 rounded-full transition-all">Book</Link>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=100" className="object-cover w-full h-full" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Dr. Priya Ramachandran</h4>
                    <p className="text-xxs text-brand-400 font-semibold">Dermatologist • 10 Yrs Exp</p>
                  </div>
                </div>
                <Link href="/consultations" className="bg-brand-600 hover:bg-brand-500 text-white text-xxs font-bold py-1.5 px-3 rounded-full transition-all">Book</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CUSTOMER TESTIMONIALS */}
      <section ref={testimonialsRef} className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
          <span className="text-xs text-brand-600 font-bold uppercase tracking-wider">Patient Stories</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">What Our Customers Say</h2>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col justify-between group">
            <p className="text-slate-600 text-sm italic leading-relaxed group-hover:text-slate-900 transition-colors">
              "Ordering chronic care diabetes drugs on MrMed has saved me nearly ₹800 monthly compared to local physical stores. Prescription uploads were parsed instantly."
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">R</div>
              <div>
                <h5 className="font-bold text-slate-950 text-xs">Rajesh Sharma</h5>
                <span className="text-xxs text-slate-400">Verified Customer • Delhi</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col justify-between group">
            <p className="text-slate-600 text-sm italic leading-relaxed group-hover:text-slate-900 transition-colors">
              "The video consultation slot booking is extremely clean. I booked a skin specialist at 10 AM, had session at 10:15 AM, and had my medicines shipped by afternoon!"
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">P</div>
              <div>
                <h5 className="font-bold text-slate-950 text-xs">Priyanka Sen</h5>
                <span className="text-xxs text-slate-400">Verified Patient • Kolkata</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col justify-between group">
            <p className="text-slate-600 text-sm italic leading-relaxed group-hover:text-slate-900 transition-colors">
              "Extremely impressed by the GST compliance invoice layout. I need this to file company medical reimbursement. The PDF matches physical enterprise standards."
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">A</div>
              <div>
                <h5 className="font-bold text-slate-950 text-xs">Amit Verma</h5>
                <span className="text-xxs text-slate-400">Verified Customer • Mumbai</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION SECTION */}
      <section ref={faqRef} className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs text-brand-600 font-bold uppercase tracking-wider">Common Questions</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Frequently Asked FAQs</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="border border-slate-200/80 rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full text-left p-5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between font-bold text-slate-800 text-sm sm:text-base focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedFaq === idx ? 'transform rotate-180' : ''}`} />
                </button>
                
                {expandedFaq === idx && (
                  <div className="p-5 border-t border-slate-100 bg-white text-slate-500 text-sm leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
