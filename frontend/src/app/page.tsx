'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShieldCheck, Truck, Percent, Activity, Star, ArrowRight, ChevronDown, Award, Sparkles, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import api from '../lib/api';
import { useCart } from '../context/CartContext';

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
    <div className="relative">
      
      {/* 1. HERO SLIDER BANNER */}
      <section className="relative h-[450px] overflow-hidden bg-slate-950">
        <AnimatePresence mode="wait">
          {banners.map((slide, idx) => {
            if (idx !== activeSlide) return null;
            return (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 w-full h-full"
              >
                <div 
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.9) 30%, rgba(15, 23, 42, 0.2)), url(${slide.image})` }}
                >
                  <div className="max-w-7xl mx-auto h-full px-6 sm:px-12 flex flex-col justify-center text-white">
                    <motion.span 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-brand-600/90 text-white font-semibold text-xs uppercase tracking-widest px-3.5 py-1 rounded-full w-max mb-4 shadow-sm"
                    >
                      Exclusive Offer
                    </motion.span>
                    <motion.h1 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-3xl sm:text-5xl font-extrabold max-w-2xl leading-tight tracking-tight mb-3"
                    >
                      {slide.title}
                    </motion.h1>
                    <motion.p 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-slate-300 text-sm sm:text-lg max-w-lg mb-8 leading-relaxed"
                    >
                      {slide.subtitle}
                    </motion.p>
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Link 
                        href={slide.link} 
                        className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 px-8 rounded-full shadow-lg shadow-brand-500/20 text-sm tracking-wide transition-all w-max flex items-center gap-2"
                      >
                        Explore Catalog
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* DOTS */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${idx === activeSlide ? 'bg-brand-500 w-8' : 'bg-white/40'}`}
            />
          ))}
        </div>
      </section>

      {/* 2. SEARCH BOX FOR MOBILE & TABLETS */}
      <section className="bg-brand-700 py-6 px-4 md:hidden shadow-inner">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search medicines, formulas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full py-3 pl-11 pr-4 focus:outline-none text-slate-800 text-sm shadow"
          />
          <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-400" />
        </form>
      </section>

      {/* 3. VALUE PROPS / CERTIFICATION SECTIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-teal-50 text-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">100% Genuine Medicines</h4>
            <p className="text-xs text-slate-500 mt-0.5">Sourced directly from licensed corporate manufacturers.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Up to 20% Savings</h4>
            <p className="text-xs text-slate-500 mt-0.5">High discounts on generic formulations and chronic drugs.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Free Express Home Delivery</h4>
            <p className="text-xs text-slate-500 mt-0.5">Complementary home delivery across India on orders over ₹500.</p>
          </div>
        </div>
      </section>

      {/* 4. FEATURED CATEGORIES */}
      <section className="bg-white py-16 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-xs text-brand-600 font-bold uppercase tracking-wider">Browse by Care</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Featured Health Categories</h2>
            </div>
            <Link href="/medicines" className="text-brand-600 hover:text-brand-700 font-bold text-sm flex items-center gap-1">
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link 
                key={cat.id} 
                href={`/medicines?category=${cat.slug}`} 
                className="group relative rounded-2xl overflow-hidden aspect-video border border-slate-150 shadow-sm flex items-end p-4 hover:shadow-md transition-all"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.8) 40%, rgba(15, 23, 42, 0.1)), url(${cat.image})` }}
                />
                <div className="relative z-10 text-white">
                  <h3 className="font-bold text-sm sm:text-base leading-tight">{cat.name}</h3>
                  <span className="text-xxs text-slate-300 font-semibold group-hover:text-brand-300 transition-colors flex items-center gap-0.5 mt-1">
                    Explore medicines
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TRENDING MEDICINES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-xs text-brand-600 font-bold uppercase tracking-wider">Top Selling Items</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Trending Healthcare Medicines</h2>
          </div>
          <Link href="/medicines" className="text-brand-600 hover:text-brand-700 font-bold text-sm flex items-center gap-1">
            See Store
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trending.length > 0 ? (
            trending.map((med) => {
              let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
              try {
                if (med.images) imagesArr = JSON.parse(med.images);
              } catch(e) {}
              
              const discPrice = med.discountPrice ? Number(med.discountPrice) : null;
              const price = Number(med.price);
              
              return (
                <div 
                  key={med.id} 
                  className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Image */}
                    <div className="h-36 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden mb-4 relative">
                      <img 
                        src={imagesArr[0]} 
                        alt={med.name} 
                        className="object-contain max-h-28 mix-blend-multiply"
                      />
                      {med.prescriptionRequired && (
                        <span className="absolute top-2 left-2 bg-rose-50 text-rose-600 font-bold text-xxs px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1 shadow-sm">
                          <AlertCircle className="w-3 h-3" />
                          Prescription Rx
                        </span>
                      )}
                      {discPrice && (
                        <span className="absolute top-2 right-2 bg-emerald-50 text-emerald-600 font-extrabold text-xxs px-2 py-0.5 rounded border border-emerald-100">
                          {Math.round(((price - discPrice) / price) * 100)}% OFF
                        </span>
                      )}
                    </div>
                    
                    <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider">{med.brand?.name || 'GENERIC'}</span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1 line-clamp-1 hover:underline">
                      <Link href={`/medicines/${med.id}`}>{med.name}</Link>
                    </h3>
                    <p className="text-xxs text-slate-500 italic mt-0.5 line-clamp-1">{med.genericName}</p>
                    <p className="text-xxs text-slate-400 mt-1 line-clamp-1">Comp: {med.composition}</p>
                  </div>

                  <div className="mt-5 border-t border-slate-50 pt-4 flex items-center justify-between">
                    <div>
                      {discPrice ? (
                        <>
                          <span className="text-sm font-extrabold text-slate-900">₹{discPrice.toFixed(2)}</span>
                          <span className="text-xxs text-slate-400 line-through ml-1.5">₹{price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-sm font-extrabold text-slate-900">₹{price.toFixed(2)}</span>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => handleAddToCart(med)}
                      className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-full transition-all"
                    >
                      Add +
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            // Static loading cards
            [1,2,3,4].map(idx => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm h-72 animate-pulse" />
            ))
          )}
        </div>
      </section>

      {/* 6. CLINICAL CARE & ONLINE CONSULTATION CTA */}
      <section className="bg-slate-900 text-white py-16 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
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
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
          <span className="text-xs text-brand-600 font-bold uppercase tracking-wider">Patient Stories</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">What Our Customers Say</h2>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <p className="text-slate-600 text-sm italic leading-relaxed">
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

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <p className="text-slate-600 text-sm italic leading-relaxed">
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

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <p className="text-slate-600 text-sm italic leading-relaxed">
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
      <section className="bg-white py-16 border-t border-slate-100">
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
