'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShieldCheck, Truck, Percent, Activity, Star, ArrowRight, ChevronDown, Award, Sparkles, AlertCircle, FileText, CheckCircle2, ThermometerSnowflake, FileCheck, Stethoscope, Droplets, Heart, ActivitySquare, Pill, Beaker, Filter, Calendar, X, Clipboard, Eye, Shield, ShieldAlert, Baby, Bone, Brain, Thermometer, Tag
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';
import api from '../lib/api';
import { useCart } from '../context/CartContext';
import { toast } from 'react-hot-toast';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { formatCurrency, calculateUnitPrice } from '@/lib/utils';
import SupportContactSection from '../components/SupportContactSection';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  ScrollTrigger.clearScrollMemory("manual");
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
  packSize?: string;
  prescriptionRequired: boolean;
  description?: string;
  dosage?: string;
  sideEffects?: string;
  brand?: { name: string };
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image: string;
}

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  experience: number;
  avatar: string;
  fees: number;
  availability: string;
  rating: number;
}

export default function HomePage() {
  const { addToCart } = useCart();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trending, setTrending] = useState<Medicine[]>([]);
  const [recommendations, setRecommendations] = useState<Medicine[]>([]);
  const [homeDoctors, setHomeDoctors] = useState<Doctor[]>([
    { id: 1, name: 'Dr. Arvinder Singh', specialization: 'General Physician', experience: 14, avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250', rating: 4.8, fees: 500, availability: '' },
    { id: 2, name: 'Dr. Priya Ramachandran', specialization: 'Dermatologist', experience: 10, avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=250', rating: 4.9, fees: 600, availability: '' }
  ]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const [oncologyVal, setOncologyVal] = useState(0);
  const [costsVal, setCostsVal] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress);

      setOncologyVal(Math.floor(ease * 80));
      setCostsVal(Math.floor(ease * 18));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, []);

  // Shelf search & filter state
  const [shelfSearch, setShelfSearch] = useState('');
  const [shelfFilter, setShelfFilter] = useState<'all' | 'otc' | 'rx' | 'discounted'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);


  // Calculator state
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcExpense, setCalcExpense] = useState<number>(3000);

  // Quick View state
  const [quickViewMed, setQuickViewMed] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [dynamicFaqs, setDynamicFaqs] = useState<any[]>([]);
  const [expandedReviews, setExpandedReviews] = useState<number[]>([]);
  const reviewSliderRef = useRef<HTMLDivElement>(null);

  const scrollReviews = (dir: 'left' | 'right') => {
    if (reviewSliderRef.current) {
      const scrollAmount = 350;
      reviewSliderRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const toggleReview = (idx: number) => {
    if (expandedReviews.includes(idx)) {
      setExpandedReviews(expandedReviews.filter(i => i !== idx));
    } else {
      setExpandedReviews([...expandedReviews, idx]);
    }
  };


  useEffect(() => {
    async function fetchFaqs() {
      try {
        const res = await fetch('/api/faqs');
        const data = await res.json();
        if (data.success) {
          setDynamicFaqs(data.faqs);
        }
      } catch (err) {
        console.error('Failed to load FAQs', err);
      }
    }
    fetchFaqs();
  }, []);

  // Force scroll to top on mount
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Immediate scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Fallback for Next.js routing/rendering delays
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 100);

    return () => {
      clearTimeout(timer);
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const categoriesRef = useRef<HTMLElement>(null);
  const trendingRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  const testimonialsRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic for categories
  useEffect(() => {
    const container = categoriesScrollRef.current;
    if (!container || categories.length === 0) return;
    let intervalId: ReturnType<typeof setInterval>;
    const startAutoScroll = () => {
      intervalId = setInterval(() => {
        if (container) {
          // If scrolled near the end, reset to start smoothly or instantly
          if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 20) {
            container.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            // Scroll by approximately one card width + gap
            const cardWidth = 220; // estimate based on w-52 (13rem=208px) + gap
            container.scrollBy({ left: cardWidth, behavior: 'smooth' });
          }
        }
      }, 3000); // Scroll every 3 seconds
    };

    startAutoScroll();

    // Pause on hover or touch
    const handlePause = () => clearInterval(intervalId);
    const handleResume = () => startAutoScroll();

    container.addEventListener('mouseenter', handlePause);
    container.addEventListener('mouseleave', handleResume);
    container.addEventListener('touchstart', handlePause, { passive: true });
    container.addEventListener('touchend', handleResume, { passive: true });

    return () => {
      clearInterval(intervalId);
      container.removeEventListener('mouseenter', handlePause);
      container.removeEventListener('mouseleave', handleResume);
      container.removeEventListener('touchstart', handlePause);
      container.removeEventListener('touchend', handleResume);
    };
  }, [categories]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
      const targets = gsap.utils.toArray('.feature-card', featuresRef.current);
      if (targets.length > 0) {
        gsap.fromTo(
          targets,
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
    }

    // Staggered categories
    if (categoriesRef.current) {
      const targets = gsap.utils.toArray('.category-card', categoriesRef.current);
      if (targets.length > 0) {
        gsap.fromTo(
          targets,
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
    }

    // Staggered medicine cards
    if (trendingRef.current) {
      const targets = gsap.utils.toArray('.medicine-card', trendingRef.current);
      if (targets.length > 0) {
        gsap.fromTo(
          targets,
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
    }
  }, { scope: containerRef, dependencies: [categories, trending, banners, homeDoctors] });

  // Load content
  useEffect(() => {
    async function loadData() {
      try {
        const [banRes, catRes, medRes/* CONSULT_DISABLED , docRes */] = await Promise.all([
          api.get('/admin/banners'),
          api.get('/medicines/categories'),
          api.get('/medicines?limit=4'),
          // api.get('/appointments/doctors')  // CONSULT FEATURE DISABLED
        ]);

        if (banRes.data?.success) setBanners(banRes.data.data);
        if (catRes.data?.success) setCategories(catRes.data.data);
        if (medRes.data?.success) setTrending(medRes.data.data);
        // if (docRes.data?.success) setHomeDoctors(docRes.data.data);  // CONSULT FEATURE DISABLED
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
        // CONSULT FEATURE DISABLED
        // setHomeDoctors([
        //   { id: 1, name: 'Dr. Arvinder Singh', specialization: 'General Physician', experience: 14, avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250', rating: 4.8, fees: 500, availability: '' },
        //   { id: 2, name: 'Dr. Priya Ramachandran', specialization: 'Dermatologist', experience: 10, avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=250', rating: 4.9, fees: 600, availability: '' }
        // ]);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const res = await api.get('/medicines/recommendations');
        if (res.data?.success) {
          setRecommendations(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load recommendations', err);
      }
    }
    loadRecommendations();
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

  const handleAddToCart = (med: Medicine, customQty?: number) => {
    let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
    try {
      if (med.images) {
        imagesArr = JSON.parse(med.images);
      }
    } catch (e) { }

    addToCart({
      id: med.id,
      name: med.name,
      price: Number(med.price),
      discountPrice: med.discountPrice ? Number(med.discountPrice) : undefined,
      prescriptionRequired: med.prescriptionRequired,
      image: imagesArr[0],
      quantity: customQty || 1
    });
    toast.success(`${med.name} added to cart!`);

    if (quickViewMed) {
      setQuickViewMed(null);
    }
    setQty(1);
  };

  return (
    <div className="relative" ref={containerRef}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(12deg); }
          50% { transform: translateY(-12px) rotate(14deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(-12deg); }
          50% { transform: translateY(-8px) rotate(-10deg); }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 4s ease-in-out infinite;
        }
      `}} />

      {/* 1. HERO SECTION */}
      <section ref={heroRef} className="relative w-full overflow-hidden bg-gradient-to-br from-[#f0f9fb] via-[#e5f5f7] to-[#f0f9fb] border-b border-brand-100 py-16 lg:py-24">

        {/* BACKGROUND ILLUSTRATIONS (LEFT SIDE) */}
        <div className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 w-[28%] sm:w-[22%] lg:w-[15%] h-[80%] flex flex-col justify-between pointer-events-none z-0 opacity-25 sm:opacity-45 lg:opacity-100 transition-opacity duration-300">
          <img src="/hero/medicine_pills-Photoroom.png" alt="" className="w-10 h-10 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-contain rotate-12 self-start animate-float-slow" />
          <img src="/hero/100722business_2434-Photoroom.png" alt="" className="w-full h-auto max-h-36 sm:max-h-52 lg:max-h-64 object-contain drop-shadow-xl self-center" />
          <img src="/hero/0e012660-38ad-4ee4-aa1c-af35b66a03c7-Photoroom.png" alt="" className="w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 object-contain -rotate-12 self-end animate-float-medium" />
        </div>

        {/* BACKGROUND ILLUSTRATIONS (RIGHT SIDE) */}
        <div className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 w-[28%] sm:w-[22%] lg:w-[18%] h-[80%] flex flex-col justify-between items-end pointer-events-none z-0 opacity-25 sm:opacity-45 lg:opacity-100 transition-opacity duration-300">
          <div className="flex gap-4 items-start">
            <img src="/hero/83af8131-a85d-4670-874d-a03fcf5ac146-Photoroom.png" alt="" className="w-12 h-12 sm:w-20 sm:h-20 lg:w-28 lg:h-28 object-contain animate-float-medium" />
          </div>
          <img src="/hero/ChatGPT Image Aug 3, 2026, 12_41_35 PM-Photoroom.png" alt="" className="w-full h-auto max-h-36 sm:max-h-52 lg:max-h-72 object-contain drop-shadow-xl" />
          <div className="flex gap-4 items-end">
            <img src="/hero/222993f1-5587-45ad-8ffb-e3ba82b55161-Photoroom.png" alt="" className="w-10 h-10 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-contain rotate-12 animate-float-slow" />
            <img src="/hero/70-Photoroom.png" alt="" className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 object-contain" />
          </div>
        </div>

        {/* CENTRAL HERO CONTENT */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-20 flex flex-col items-center text-center">

          {/* <div className="bg-brand-100/80 text-brand-800 font-bold text-[10px] sm:text-xs uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-2 mb-6 border border-brand-200/50 shadow-sm backdrop-blur-sm">
            <Activity className="w-3.5 h-3.5 text-brand-600" /> DoseBox Specialty Smart Pharmacy
          </div> */}

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.15] tracking-tight mb-6 max-w-3xl">
            Specialty Medicines, <br className="hidden sm:inline" />
            <span className="text-brand-600">Up To 85% Off.</span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-xl leading-relaxed mb-8 font-medium">
            DoseBox is India's digital super-specialty pharmacy. Find life-saving oncology, kidney, and transplant medications with absolute cold-chain logistics and deep price transparency.
          </p>

          {/* Centered Search Bar */}
          {/* <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl bg-white p-2 rounded-2xl sm:rounded-full border border-slate-200 shadow-lg flex flex-col sm:flex-row items-center gap-2 mb-8">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-full text-xs font-semibold text-slate-500 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Deliver to 141001</span>
            </div>
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Medicines, Or Molecules..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-transparent text-sm focus:outline-none text-slate-800"
              />
            </div>
            <button 
              type="submit"
              className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-xl sm:rounded-full text-sm transition-colors shadow-md"
            >
              Search
            </button>
          </form> */}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-10">
            <Link href="/upload-prescription" className="w-full sm:w-auto bg-[#E68A85] hover:bg-[#d9736a] text-white font-bold py-3.5 px-8 rounded-full transition-all flex items-center justify-center gap-2 shadow-md">
              <Clipboard className="w-5 h-5" /> Upload Rx & Order
            </Link>
            <Link href="/medicines" className="w-full sm:w-auto bg-white hover:bg-slate-50 text-brand-700 font-bold py-3.5 px-8 rounded-full border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm">
              <Pill className="w-5 h-5" /> Browse Specialties
            </Link>
            <button 
              type="button"
              onClick={() => setShowCalculator(true)}
              className="w-full sm:w-auto bg-[#E8F8F5] hover:bg-[#D1F2EB] text-brand-800 font-bold py-3.5 px-8 rounded-full border border-brand-200 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4.5 h-4.5 text-amber-500 fill-amber-500" /> Launch Calculator
            </button>
          </div>

          {/* Bento Badges List */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-bold text-slate-500 bg-white/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-slate-200/40">
            <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-600" /> 100% Bioequivalence</div>
            <div className="flex items-center gap-1.5"><ThermometerSnowflake className="w-4 h-4 text-accent" /> Cold Chain Validated</div>
            <div className="flex items-center gap-1.5"><FileCheck className="w-4 h-4 text-emerald-500" /> Patient Assistance (PAP)</div>
          </div>

        </div>
      </section>

      {/* 2. STATS CARDS SECTION */}
      <section className="py-12 bg-[#0F667A] border-y border-slate-200/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,128,152,0.03),transparent_60%)] pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">

            {/* Card 1 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Percent className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{oncologyVal}%+</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ONCOLOGY SAVINGS</div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">₹{costsVal} Cr+</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">COSTS SAVED</div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent-light/10 text-accent-dark flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ThermometerSnowflake className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5">
                  <span>2°C - 8°C</span>
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">COLD CHAIN</div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">WHO-GMP</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">LICENSED PHARMACIES</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. SHOP BY CHRONIC CATEGORY */}
      <section ref={categoriesRef} className="py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <span className="text-[10px] text-brand-600 font-bold uppercase tracking-widest">Target Specific Ailments</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Shop by Specialty</h2>
            </div>
            <Link href="/condition" className="text-sm font-bold text-brand-600 hover:text-brand-700 hover:underline whitespace-nowrap flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div
            ref={categoriesScrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {(() => {
              const CATEGORY_GRADIENTS = [
                'linear-gradient(135deg, #4f87c5, #6fa3e0)',
                'linear-gradient(135deg, #0c888d, #29b5bb)',
                'linear-gradient(135deg, #e8783a, #f0974e)',
                'linear-gradient(135deg, #7c6fc4, #a494e0)',
                'linear-gradient(135deg, #3ea8b0, #5dc8d0)',
                'linear-gradient(135deg, #6b6b6b, #8c8c8c)'
              ];
              if (categories.length === 0) {
                return (
                  <div className="col-span-full py-8 text-center text-slate-500 font-medium bg-slate-50 rounded-2xl border border-slate-100">
                    Loading Categories...
                  </div>
                );
              }

              return categories.map((cat, idx) => {
                const gradient = CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length];
                const isImageFile = cat.image && cat.image.includes('.');
                const IconComp = !isImageFile ? ((LucideIcons as any)[cat.image] || LucideIcons.FileText) : null;

                return (
                  <Link key={cat.id} href={`/medicines?category=${cat.slug}`} className="snap-start flex-shrink-0 w-40 sm:w-48 lg:w-52 category-card group rounded-2xl border border-[#b2d8dc] p-5 hover:shadow-lg hover:border-brand-400 transition-all flex flex-col gap-4 bg-white">
                    {isImageFile ? (
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 shadow-inner overflow-hidden">
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-contain p-2" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: gradient }}>
                        {IconComp && <IconComp className="w-5 h-5" />}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{cat.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed line-clamp-2">{cat.description || 'View products in this category'}</p>
                    </div>
                  </Link>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* RECOMMENDED FOR YOU (Dynamic Personalization) */}
      {recommendations.length > 0 && (
        <section className="bg-slate-50 py-16 border-t border-slate-100">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> For You
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">Recommended for You</h2>
                <p className="text-sm text-slate-500 mt-2 font-medium max-w-lg">
                  Based on your recent browsing history, we've curated these specific matches to help you find exactly what you need.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map((med) => {
                let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
                try {
                  if (med.images) imagesArr = JSON.parse(med.images);
                } catch (e) { }

                const discPrice = med.discountPrice ? Number(med.discountPrice) : null;
                const price = Number(med.price);
                const savings = discPrice ? Math.round(((price - discPrice) / price) * 100) : 0;
                const activePrice = discPrice || price;
                const unitPriceObj = calculateUnitPrice(activePrice, med.packSize);

                return (
                  <div
                    key={med.id}
                    className="bg-white rounded-2xl border border-[#1b8d91]/60 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start absolute top-4 left-4 right-4 z-10 pointer-events-none">
                      {med.prescriptionRequired ? (
                        <div className="bg-[#f0ecec] border border-[#e6dfdf] text-[#786c6c] font-bold text-[8px] uppercase tracking-wide px-2 py-0.5 rounded-sm pointer-events-auto">
                          RX REQUIRED
                        </div>
                      ) : (
                        <div />
                      )}
                      {savings > 0 && (
                        <div className="bg-[#e68a7f] text-white font-bold text-[9px] px-2.5 py-0.5 rounded-full shadow-sm pointer-events-auto">
                          Save {savings}%
                        </div>
                      )}
                    </div>

                    <div className="mt-6 mb-4 relative z-0">
                      <Link href={`/medicines/detail?id=${med.id}`} className="block h-40 flex items-center justify-center overflow-hidden">
                        <img
                          src={imagesArr[0]}
                          alt={med.name}
                          className="object-contain w-full h-full mix-blend-multiply transition-transform duration-500 "
                        />
                      </Link>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-[8px] text-[#8c8c8c] font-semibold uppercase mb-1">
                        <span>{med.packSize || 'Strip of 10 Tablets'}</span>
                        <span>&bull;</span>
                        <span className="truncate">{med.brand?.name || 'DoseBox Speciality Generics'}</span>
                      </div>

                      <h3 className="font-bold text-[#2d3748] text-xs leading-snug line-clamp-2 min-h-[34px]">
                        <Link href={`/medicines/detail?id=${med.id}`}>{med.name}</Link>
                      </h3>

                      <div className="flex items-center gap-1 mt-1 text-[10px] text-[#9b9b9b] font-semibold mb-6">
                        <Star className="w-3 h-3 text-[#f6a041] fill-[#f6a041]" /> 4.8 (42)
                      </div>
                    </div>

                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <div className="flex items-center gap-1 text-[8px] mb-0.5 font-semibold">
                          <span className="line-through text-[#9b9b9b]">₹{formatCurrency(price)}</span>
                          {savings > 0 && <span className="text-[#e68a7f]">-{savings}% Swap Savings</span>}
                        </div>
                        <div className="text-[#0c888d] font-extrabold text-[20px] leading-none tracking-tight">
                          ₹{formatCurrency(activePrice.toFixed(0))}
                        </div>
                        {unitPriceObj && (
                          <div className="text-[10px] text-[#9b9b9b] font-medium mt-0.5">
                            ₹{formatCurrency(unitPriceObj.price)} per {unitPriceObj.unit}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setQuickViewMed(med); setQty(1); }}
                          className="w-7 h-7 rounded-full border border-[#0c888d]/30 text-[#0c888d] hover:bg-[#0c888d]/10 flex items-center justify-center transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAddToCart(med)}
                          className="w-7 h-7 rounded-full bg-[#0c888d] text-white flex items-center justify-center hover:bg-[#0a7378] hover:scale-105 transition-all shadow-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 4. DIGITAL SPECIALTY SHELF */}
      <section ref={trendingRef} className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
          <div>
            <span className="text-[10px] text-brand-600 font-bold uppercase tracking-widest">Digital Specialty Shelf</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Substitute &amp; Save Instantly</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search generics..."
                value={shelfSearch}
                onChange={e => setShelfSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:border-brand-500 text-sm w-48 shadow-inner"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(v => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm border ${shelfFilter !== 'all'
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <Filter className="w-4 h-4" />
                {shelfFilter === 'all' ? 'Filter' : shelfFilter === 'otc' ? 'OTC Only' : shelfFilter === 'rx' ? 'Rx Only' : 'On Sale'}
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[150px] overflow-hidden">
                  {([
                    { value: 'all', label: 'All Medicines' },
                    { value: 'otc', label: 'OTC Only' },
                    { value: 'rx', label: 'Rx Only' },
                    { value: 'discounted', label: 'On Sale' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setShelfFilter(opt.value); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${shelfFilter === opt.value
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(() => {
            const filtered = trending.filter(med => {
              const matchesSearch = shelfSearch === '' ||
                med.name.toLowerCase().includes(shelfSearch.toLowerCase()) ||
                (med.genericName || '').toLowerCase().includes(shelfSearch.toLowerCase());
              const matchesFilter =
                shelfFilter === 'all' ? true :
                  shelfFilter === 'otc' ? !med.prescriptionRequired :
                    shelfFilter === 'rx' ? med.prescriptionRequired :
                      shelfFilter === 'discounted' ? !!med.discountPrice : true;
              return matchesSearch && matchesFilter;
            });

            if (filtered.length === 0 && trending.length > 0) {
              return (
                <div className="col-span-4 text-center py-12 text-slate-500">
                  <Search className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                  <p className="font-semibold">No medicines match your search or filter.</p>
                  <button onClick={() => { setShelfSearch(''); setShelfFilter('all'); }} className="mt-3 text-brand-600 text-sm font-bold hover:underline">Clear filters</button>
                </div>
              );
            }

            if (filtered.length === 0) {
              return [1, 2, 3, 4].map(idx => (
                <div key={idx} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm h-96 animate-pulse" />
              ));
            }

            return filtered.map((med) => {
              let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
              try {
                if (med.images) imagesArr = JSON.parse(med.images);
              } catch (e) { }

              const discPrice = med.discountPrice ? Number(med.discountPrice) : null;
              const price = Number(med.price);
              const savings = discPrice ? Math.round(((price - discPrice) / price) * 100) : 0;
              const activePrice = discPrice || price;
              const unitPriceObj = calculateUnitPrice(activePrice, med.packSize);

              return (
                <div
                  key={med.id}
                  className="bg-white rounded-2xl border border-[#1b8d91]/60 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start absolute top-4 left-4 right-4 z-10 pointer-events-none">
                    {med.prescriptionRequired ? (
                      <div className="bg-[#f0ecec] border border-[#e6dfdf] text-[#786c6c] font-bold text-[8px] uppercase tracking-wide px-2 py-0.5 rounded-sm pointer-events-auto">
                        RX REQUIRED
                      </div>
                    ) : (
                      <div />
                    )}
                    {savings > 0 && (
                      <div className="bg-[#e68a7f] text-white font-bold text-[9px] px-2.5 py-0.5 rounded-full shadow-sm pointer-events-auto">
                        Save {savings}%
                      </div>
                    )}
                  </div>

                  <div className="mt-6 mb-4 relative z-0">
                    <Link href={`/medicines/detail?id=${med.id}`} className="block h-40 flex items-center justify-center overflow-hidden">
                      <img
                        src={imagesArr[0]}
                        alt={med.name}
                        className="object-contain w-full h-full mix-blend-multiply transition-transform duration-500 "
                      />
                    </Link>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-[8px] text-[#8c8c8c] font-semibold uppercase mb-1">
                      <span>{med.packSize || 'Strip of 10 Tablets'}</span>
                      <span>&bull;</span>
                      <span className="truncate">{med.brand?.name || 'DoseBox Speciality Generics'}</span>
                    </div>

                    <h3 className="font-bold text-[#2d3748] text-xs leading-snug line-clamp-2 min-h-[34px]">
                      <Link href={`/medicines/detail?id=${med.id}`}>{med.name}</Link>
                    </h3>

                    <div className="flex items-center gap-1 mt-1 text-[10px] text-[#9b9b9b] font-semibold mb-6">
                      <Star className="w-3 h-3 text-[#f6a041] fill-[#f6a041]" /> 4.8 (42)
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <div className="flex items-center gap-1 text-[8px] mb-0.5 font-semibold">
                        <span className="line-through text-[#9b9b9b]">₹{formatCurrency(price)}</span>
                        {savings > 0 && <span className="text-[#e68a7f]">-{savings}% Swap Savings</span>}
                      </div>
                      <div className="text-[#0c888d] font-extrabold text-[20px] leading-none tracking-tight">
                        ₹{formatCurrency(activePrice.toFixed(0))}
                      </div>
                      {unitPriceObj && (
                        <div className="text-[10px] text-[#9b9b9b] font-medium mt-0.5">
                          ₹{formatCurrency(unitPriceObj.price)} per {unitPriceObj.unit}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { setQuickViewMed(med); setQty(1); }}
                        className="w-7 h-7 rounded-full border border-[#0c888d]/30 text-[#0c888d] hover:bg-[#0c888d]/10 flex items-center justify-center transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleAddToCart(med)}
                        className="w-7 h-7 rounded-full bg-[#0c888d] text-white flex items-center justify-center hover:bg-[#0a7378] hover:scale-105 transition-all shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </section>

      {/* 5. PERSONAL CARE ROUTINE */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Single contained dark card */}
          <div className="relative rounded-3xl overflow-hidden bg-brand-900 p-6 sm:p-12 shadow-2xl">
            {/* Subtle gradient blobs */}
            <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-400/15 rounded-full blur-[80px] translate-y-1/3 pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row gap-10 lg:gap-16">
              {/* Left: header */}
              <div className="lg:w-72 flex-shrink-0 text-center lg:text-left flex flex-col items-center lg:items-start">
                <span className="inline-flex items-center gap-1.5 bg-brand-950/40 border border-brand-800/30 text-brand-300 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
                  <Sparkles className="w-3 h-3" /> Specialty Health Sorter
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-4">
                  Find Your Personal Care Routine
                </h2>
                <p className="text-brand-200/80 text-sm leading-relaxed max-w-md lg:max-w-none">
                  Struggling to find the right vitamins, specialty nutrients, or natural palliative remedies? Check your support goal to see matched recommendations.
                </p>
              </div>

              {/* Right: 2x2 compact cards */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Card 1 */}
                <Link href="/medicines?category=anti-bacterials" className="group flex items-start gap-3 sm:gap-4 bg-brand-950/40 hover:bg-brand-950/60 border border-brand-800/20 hover:border-brand-500/40 rounded-2xl p-3.5 sm:p-4 transition-all">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Activity className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xs sm:text-sm leading-snug">ANTI BACTERIALS</h3>
                    <p className="text-slate-300/90 text-[11px] sm:text-xs mt-0.5 leading-relaxed line-clamp-2">Combat bacterial infections, promote healing, and protect your body against harmful microbes.</p>
                  </div>
                </Link>

                {/* Card 2 */}
                <Link href="/medicines?category=anti-fungals" className="group flex items-start gap-3 sm:gap-4 bg-brand-950/40 hover:bg-brand-950/60 border border-brand-800/20 hover:border-brand-500/40 rounded-2xl p-3.5 sm:p-4 transition-all">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <ActivitySquare className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xs sm:text-sm leading-snug">ANTI FUNGALS</h3>
                    <p className="text-slate-300/90 text-[11px] sm:text-xs mt-0.5 leading-relaxed line-clamp-2">Treat fungal infections, relieve itching, and restore healthy skin and nails.</p>
                  </div>
                </Link>

                {/* Card 3 */}
                <Link href="/medicines?category=arthritis" className="group flex items-start gap-3 sm:gap-4 bg-brand-950/40 hover:bg-brand-950/60 border border-brand-800/20 hover:border-brand-500/40 rounded-2xl p-3.5 sm:p-4 transition-all">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Droplets className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xs sm:text-sm leading-snug">ARTHRITIS</h3>
                    <p className="text-slate-300/90 text-[11px] sm:text-xs mt-0.5 leading-relaxed line-clamp-2">Alleviate joint pain, reduce inflammation, and improve mobility for a better quality of life.</p>
                  </div>
                </Link>

                {/* Card 4 */}
                <Link href="/medicines?category=oncology" className="group flex items-start gap-3 sm:gap-4 bg-brand-950/40 hover:bg-brand-950/60 border border-brand-800/20 hover:border-brand-500/40 rounded-2xl p-3.5 sm:p-4 transition-all">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <ThermometerSnowflake className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xs sm:text-sm leading-snug">ONCOLOGY</h3>
                    <p className="text-slate-300/90 text-[11px] sm:text-xs mt-0.5 leading-relaxed line-clamp-2">Advanced care for cancer treatment, supporting recovery, and improving overall well-being.</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CHRONIC & SPECIALTY CARE INSIGHTS */}
      <section className="py-20 ">
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

      {/* 6. CLINICAL CARE & ONLINE CONSULTATION CTA — DISABLED */}
      {/* CONSULT FEATURE DISABLED — uncomment to re-enable
      <section ref={ctaRef} className="bg-brand-900 text-white py-12 sm:py-20 overflow-hidden relative rounded-2xl sm:rounded-[3rem] mx-3 sm:mx-6 lg:mx-auto max-w-7xl my-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/25 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center text-center lg:text-left">
          <div className="flex flex-col items-center lg:items-start">
            <span className="text-brand-300 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 justify-center lg:justify-start">
              <Sparkles className="w-4 h-4" />
              Tele-Health Consultation
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 leading-tight max-w-xl">
              Consult Top Verified Doctors & Specialists Online
            </h2>
            <p className="text-brand-200/80 text-sm sm:text-base mt-4 leading-relaxed max-w-lg">
              Get diagnostic reports, prescription sheets, and expert medical advice from General Physicians, Dermatologists, and Cardiologists in under 10 minutes via private video or chat sessions.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
              <div className="flex -space-x-3 overflow-hidden">
                {homeDoctors.slice(0, 3).map((doc, idx) => (
                  <img
                    key={doc.id || idx}
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-brand-900 object-cover"
                    src={doc.avatar || "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150"}
                    alt={doc.name}
                  />
                ))}
              </div>
              <div className="text-xs sm:text-sm text-brand-100/90 font-semibold">
                <span className="font-bold text-brand-300">{homeDoctors.length || 12}+ Certified Doctors</span> online right now
              </div>
            </div>

            <div className="mt-10 w-full sm:w-auto">
              <Link
                href="/consultations"
                className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 px-8 rounded-full shadow-lg shadow-brand-500/20 text-sm tracking-wide transition-all inline-flex items-center justify-center gap-2"
              >
                Book Consultation Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-brand-950/40 rounded-3xl p-5 sm:p-6 border border-brand-800/30 shadow-2xl relative w-full">
            <div className="absolute top-4 left-4 bg-brand-500/20 text-brand-300 text-xxs font-bold uppercase tracking-wider py-1 px-3 rounded-full border border-brand-500/30">
              Live clinic slots
            </div>

            <div className="space-y-4 mt-8">
              {homeDoctors.slice(0, 2).map((doc, idx) => (
                <div key={doc.id || idx} className="bg-brand-950/60 p-4 rounded-2xl border border-brand-800/20 flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0">
                      <img src={doc.avatar || "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=100"} className="object-cover w-full h-full" alt={doc.name} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{doc.name}</h4>
                      <p className="text-xxs text-brand-300 font-semibold">{doc.specialization} • {doc.experience} Yrs Exp</p>
                    </div>
                  </div>
                  <Link href="/consultations" className="bg-brand-600 hover:bg-brand-500 text-white text-xxs font-bold py-1.5 px-3 rounded-full transition-all shrink-0">Book</Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      CONSULT FEATURE DISABLED — end of commented section */}

      {/* 6.5. DOSEBOX MOBILE APP DOWNLOAD BANNER */}
      {/* <section className="py-20 bg-brand-900 border-t border-b border-brand-800/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(7,32,39,0.25),transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,136,133,0.08),transparent_50%)]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-7 space-y-6 text-left">
              <span className="bg-brand-950/40 text-brand-300 text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full border border-brand-800/30 inline-block">
                Dosebox on the go
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Manage your Healthcare from the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-amber-300">DoseBox Mobile App</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                Experience seamless prescription scanning, chronic drug auto-refills, secure messaging with certified pharmacists, and express home delivery at your fingertips.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-950/40 border border-brand-800/20 flex items-center justify-center text-brand-300 shrink-0">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Instant OCR Reader</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Scan written prescriptions in 3 seconds.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-950/40 border border-brand-800/20 flex items-center justify-center text-brand-300 shrink-0">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Refill Reminders</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Never run out of monthly chronic medicines.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-950/40 border border-brand-800/20 flex items-center justify-center text-brand-300 shrink-0">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Pharmacist Chat</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Direct live help for generic alternative choices.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-950/40 border border-brand-800/20 flex items-center justify-center text-brand-300 shrink-0">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Tele-Health Link</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Connect with doctors in 1-tap on video.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-6">
                <a
                  href="https://play.google.com/store/apps/details?id=com.doseboxmobile"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-all hover:scale-105 duration-200 shrink-0"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                    alt="Get it on Google Play"
                    className="h-[44px] w-auto shadow-md rounded-lg"
                  />
                </a>
                <a
                  href="https://apps.apple.com/app/dosebox"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-all hover:scale-105 duration-200 shrink-0"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                    alt="Download on the App Store"
                    className="h-[44px] w-auto shadow-md rounded-lg"
                  />
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="bg-brand-950/40 border border-brand-800/30 p-8 rounded-[2.5rem] shadow-2xl relative w-full max-w-sm flex flex-col items-center">
                <div className="absolute -top-3 -right-3 bg-amber-500 text-white font-extrabold text-xs px-4 py-1.5 rounded-full shadow-lg border border-amber-400 uppercase tracking-widest animate-bounce">
                  Scan To Install
                </div>

                <div className="flex gap-4 justify-center w-full mb-6">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="bg-white p-1.5 rounded-2xl shadow-md border-2 border-brand-100/50 flex items-center justify-center">
                      <img
                        src="https://quickchart.io/qr?text=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.doseboxmobile&size=300"
                        alt="Android Play Store QR"
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                    <span className="text-[9px] font-bold text-brand-300 tracking-wider">Android QR</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <div className="bg-white p-1.5 rounded-2xl shadow-md border-2 border-brand-100/50 flex items-center justify-center">
                      <img
                        src="https://quickchart.io/qr?text=https%3A%2F%2Fapps.apple.com%2Fapp%2Fdosebox&size=300"
                        alt="iOS App Store QR"
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                    <span className="text-[9px] font-bold text-brand-300 tracking-wider">iOS QR</span>
                  </div>
                </div>

                <h4 className="text-white font-bold text-base mb-1.5">Scan QR with your Phone</h4>
                <p className="text-slate-400 text-xs leading-relaxed max-w-[240px]">
                  Points directly to the Google Play Store or iOS App Store for secure installation.
                </p>

                <div className="w-16 h-1 bg-brand-800/80 rounded-full mt-6"></div>
              </div>
            </div>

          </div>
        </div>
      </section> */}

      {/* 7. CUSTOMER TESTIMONIALS (Dynamic Google Reviews) */}
      <section ref={testimonialsRef} className="py-20 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
          <span className="text-xs text-brand-600 font-bold uppercase tracking-wider">Patient Stories</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">What Our Customers Say</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-sm font-bold text-slate-700">Excellent 4.9</span>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 text-[#fbbc05] fill-[#fbbc05]" />)}
            </div>
            <span className="text-sm text-slate-500 font-medium">on Google</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative group">
          {/* Controls */}
          <button onClick={() => scrollReviews('left')} className="absolute -left-2 md:-left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg border border-slate-100 items-center justify-center text-slate-400 hover:text-brand-600 hover:scale-110 transition-all z-10 hidden sm:flex opacity-0 group-hover:opacity-100">
            <LucideIcons.ChevronLeft className="w-6 h-6" />
          </button>

          <div ref={reviewSliderRef} className="flex overflow-x-auto gap-6 snap-x snap-mandatory hide-scrollbar pb-6 pt-2">
            {[
              { author_name: "Rajesh Sharma", rating: 5, relative_time_description: "2 days ago", text: "Ordering chronic care diabetes drugs on DoseBox has saved me nearly ₹800 monthly compared to local physical stores. Prescription uploads were parsed instantly. Ordering chronic care diabetes drugs on DoseBox has saved me nearly ₹800 monthly compared to local physical stores. Prescription uploads were parsed instantly" },
              { author_name: "Priyanka Sen", rating: 5, relative_time_description: "1 week ago", text: "The video consultation slot booking is extremely clean. I booked a skin specialist at 10 AM, had session at 10:15 AM, and had my medicines shipped by afternoon!" },
              { author_name: "Amit Verma", rating: 5, relative_time_description: "2 weeks ago", text: "Extremely impressed by the GST compliance invoice layout. I need this to file company medical reimbursement. The PDF matches physical enterprise standards." }
            ].map((review: any, idx) => {
              const colors = ["bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-purple-100 text-purple-700"];
              const bgClass = colors[idx % colors.length];
              const initial = review.author_name ? review.author_name.charAt(0).toUpperCase() : 'U';

              const isExpanded = expandedReviews.includes(idx);
              const text = review.text || '';
              const isLong = text.length > 150;

              return (
                <div key={idx} className="w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] flex-shrink-0 snap-start bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group/card">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-1">
                        {[...Array(review.rating || 5)].map((_, i) => <Star key={i} className="w-4 h-4 text-[#fbbc05] fill-[#fbbc05]" />)}
                      </div>
                      <svg className="w-6 h-6 opacity-80" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    </div>
                    <p className={`text-slate-700 text-sm leading-relaxed font-medium transition-all ${!isExpanded ? 'line-clamp-6' : ''}`}>
                      "{isExpanded ? text : (isLong ? text.substring(0, 150) + '...' : text)}"
                    </p>
                    {isLong && (
                      <button onClick={() => toggleReview(idx)} className="text-brand-600 font-bold text-xs mt-3 hover:underline flex items-center gap-1">
                        {isExpanded ? 'Read less' : 'Read more'}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-6">
                    {review.profile_photo_url ? (
                      <img src={review.profile_photo_url} alt={review.author_name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${bgClass}`}>
                        {initial}
                      </div>
                    )}
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{review.author_name}</h5>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{review.relative_time_description}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={() => scrollReviews('right')} className="absolute -right-2 md:-right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg border border-slate-100 items-center justify-center text-slate-400 hover:text-brand-600 hover:scale-110 transition-all z-10 hidden sm:flex opacity-0 group-hover:opacity-100">
            <LucideIcons.ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* 8. FAQ ACCORDION SECTION */}
      <section ref={faqRef} className="bg-white py-20 border-t border-slate-100 relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-50 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <span className="text-xs text-brand-600 font-bold uppercase tracking-wider bg-brand-50 px-3 py-1 rounded-full">Common Questions</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-4">Frequently Asked FAQs</h2>
            <p className="text-slate-500 mt-3 max-w-2xl mx-auto">Everything you need to know about our products, delivery, and services.</p>
          </div>

          <div className="space-y-4">
            {dynamicFaqs.length === 0 ? (
              <div className="text-center text-slate-400 py-10">Loading FAQs...</div>
            ) : (
              dynamicFaqs.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div
                    key={faq.id}
                    className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-brand-200 bg-brand-50/30 shadow-sm' : 'border-slate-200/80 bg-white hover:border-brand-200'}`}
                  >
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full text-left p-6 flex items-start sm:items-center justify-between focus:outline-none group"
                    >
                      <span className={`font-bold text-base sm:text-lg pr-8 transition-colors ${isOpen ? 'text-brand-700' : 'text-slate-800 group-hover:text-brand-600'}`}>
                        {faq.question}
                      </span>
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600'}`}>
                        {isOpen ? <LucideIcons.Minus className="w-4 h-4" /> : <LucideIcons.Plus className="w-4 h-4" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* JSON-LD Schema Injection */}
        {dynamicFaqs.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": dynamicFaqs.map(faq => ({
                  "@type": "Question",
                  "name": faq.question,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                  }
                }))
              })
            }}
          />
        )}
      </section>


      {/* SAVINGS CALCULATOR MODAL */}
      <AnimatePresence>
        {showCalculator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowCalculator(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
            >
              <div className="p-6 bg-brand-900 text-white relative">
                <button onClick={() => setShowCalculator(false)} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/30 flex items-center justify-center border border-brand-400/30 text-brand-300">
                    <ActivitySquare className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">Savings Calculator</h3>
                </div>
                <p className="text-brand-200 text-sm">See how much you can save yearly with DoseBox's up to 85% discounts.</p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Current Monthly Medicine Expense: <span className="text-brand-600 text-lg">₹{formatCurrency(calcExpense)}</span>
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    value={calcExpense}
                    onChange={(e) => setCalcExpense(Number(e.target.value))}
                    className="w-full accent-brand-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-400 font-medium mt-2">
                    <span>₹500</span>
                    <span>₹50,000+</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-emerald-800 font-bold text-sm leading-tight">Estimated Annual Savings</div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                      ₹{((calcExpense * 12) * 0.65).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>

                <div className="text-xs text-slate-400 text-center leading-relaxed">
                  *Calculation based on average 65% discount across our specialty catalog. Actual savings may vary.
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setShowCalculator(false)}
                  className="px-6 py-2.5 w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors shadow-sm"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Support / Contact Section */}
      <SupportContactSection />

      {/* QUICK VIEW MODAL */}
      <AnimatePresence>
        {quickViewMed && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setQuickViewMed(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row z-10 max-h-[90vh] md:max-h-[600px]"
            >
              {/* Left Side - Image Panel */}
              <div className="md:w-[45%] bg-slate-50/50 p-8 flex flex-col justify-center relative border-r border-slate-100">
                {quickViewMed.prescriptionRequired && (
                  <div className="absolute top-6 left-6 bg-rose-50 text-rose-600 font-bold text-[10px] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-rose-100">
                    <AlertCircle className="w-3.5 h-3.5" />
                    RX MEDICINE
                  </div>
                )}

                <div className="bg-white rounded-3xl p-8 flex items-center justify-center aspect-square shadow-sm border border-slate-100 mt-6">
                  <img
                    src={(() => {
                      try { return JSON.parse(quickViewMed.images)[0]; } catch (e) { return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'; }
                    })()}
                    alt={quickViewMed.name}
                    className="object-contain max-h-full"
                  />
                </div>

                <div className="flex flex-col gap-2 mt-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pack Details</span>
                    <span className="text-xs font-bold text-slate-800 text-right w-1/2 line-clamp-2">{quickViewMed.packSize || 'Strip of 10 Tablets'}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manufacturer</span>
                    <span className="text-xs font-bold text-slate-800 text-right w-1/2 line-clamp-2">{quickViewMed.brand?.name || 'DoseBox Speciality Generics'}</span>
                  </div>
                </div>
              </div>

              {/* Right Side - Info Panel */}
              <div className="md:w-[55%] bg-white p-8 sm:p-10 flex flex-col relative overflow-y-auto custom-scrollbar">
                <button
                  onClick={() => setQuickViewMed(null)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mt-2 mb-6">
                  <span className="inline-block bg-slate-100 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                    {quickViewMed.categoryDetail?.name || 'ONCOLOGY FORMULATION'}
                  </span>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                    {quickViewMed.name}
                  </h2>
                  <p className="text-sm font-semibold text-slate-500 mt-2">
                    Active API: <span className="text-brand-600">{quickViewMed.composition}</span>
                  </p>
                </div>

                <div className="flex items-end gap-3 mb-8">
                  <span className="text-3xl font-extrabold text-brand-600">
                    ₹{formatCurrency(quickViewMed.discountPrice ? Number(quickViewMed.discountPrice).toFixed(0) : Number(quickViewMed.price))}
                  </span>
                  {quickViewMed.discountPrice && (
                    <>
                      <span className="text-sm text-slate-400 font-semibold line-through mb-1.5">
                        ₹{formatCurrency(Number(quickViewMed.price))}
                      </span>
                      <span className="bg-rose-50 text-rose-600 border border-rose-200 font-bold text-[11px] px-2.5 py-1 rounded-full mb-1.5">
                        Save {Math.round(((Number(quickViewMed.price) - Number(quickViewMed.discountPrice)) / Number(quickViewMed.price)) * 100)}%
                      </span>
                    </>
                  )}
                </div>

                <div className="space-y-2 mb-6">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CLINICAL DESCRIPTION:</h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {quickViewMed.description || 'An advanced formulation used primarily in the treatment of related chronic conditions. Please consult your physician before initiating this therapy.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 text-brand-600 font-bold text-xs mb-2">
                      <Shield className="w-4 h-4" /> Dosage Guideline
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {quickViewMed.dosage || '1 tablet daily at least 1 hour before or 2 hours after food.'}
                    </p>
                  </div>
                  <div className="bg-rose-50/30 border border-rose-100 shadow-sm rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs mb-2">
                      <ShieldAlert className="w-4 h-4" /> Precaution Check
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {quickViewMed.sideEffects || 'Skin lesions, loss of appetite, breathlessness.'}
                    </p>
                  </div>
                </div>

                {quickViewMed.prescriptionRequired && (
                  <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4 flex gap-3 mb-6">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-[11px] text-amber-700/80 font-medium leading-relaxed">
                      This medicine is classified under Schedule H. It cannot be sold without a verified prescription. Our customer pharmacy representatives will ring you to validate your details.
                    </p>
                  </div>
                )}

                <div className="mt-auto flex items-center gap-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2 w-32 shadow-sm">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-slate-400 hover:text-slate-900 pb-1">—</button>
                    <span className="font-bold text-slate-900 text-sm">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="text-slate-400 hover:text-slate-900 font-bold">+</button>
                  </div>
                  <button
                    onClick={() => handleAddToCart(quickViewMed, qty)}
                    className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    Add to Basket • ₹{formatCurrency((qty * (quickViewMed.discountPrice ? Number(quickViewMed.discountPrice) : Number(quickViewMed.price))))}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

