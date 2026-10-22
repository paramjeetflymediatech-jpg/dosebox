'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, SlidersHorizontal, CheckSquare, Square, ChevronRight, ChevronLeft, Eye, AlertCircle, X, Shield, ShieldAlert, ShoppingBag, ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { formatCurrency, calculateUnitPrice } from '@/lib/utils';
import { showAddedToCart } from '@/lib/sweetalert';

interface Medicine {
  id: number;
  name: string;
  genericName: string;
  composition: string;
  price: number;
  discountPrice?: number;
  papOffer?: string;
  packSize?: string;
  hsnCode?: string;
  prescriptionRequired: boolean;
  images: string;
  brand?: { name: string };
  categoryDetail?: { name: string };
  description?: string;
  dosage?: string;
  sideEffects?: string;
  storageInstructions?: string;
  isColdChain?: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Brand {
  id: number;
  name: string;
  slug: string;
}

function MedicinesCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  
  // States
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewMed, setQuickViewMed] = useState<Medicine | null>(null);
  const [qty, setQty] = useState(1);
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams?.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams?.get('brand') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('nameAsc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [papOnly, setPapOnly] = useState(searchParams?.get('pap') === 'true');
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const step = Math.floor(categoryScrollRef.current.clientWidth * 0.5) || 200;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -step : step,
        behavior: 'smooth'
      });
    }
  };

  // Load static configurations
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/medicines/categories'),
          api.get('/medicines/brands')
        ]);
        if (catRes.data?.success) setCategories(catRes.data.data);
        if (brandRes.data?.success) setBrands(brandRes.data.data);
      } catch (err) {
        console.warn('Metadata loading warning:', err);
      }
    }
    loadMeta();
  }, []);

  // Sync URL search params to local state if navigated via navbar or external links
  useEffect(() => {
    if (searchParams) {
      const qSearch = searchParams.get('search');
      if (qSearch !== null && qSearch !== searchTerm) {
        setSearchTerm(qSearch);
        setCurrentPage(1);
      }
      
      const qCategory = searchParams.get('category');
      if (qCategory !== null && qCategory !== selectedCategory) {
        setSelectedCategory(qCategory);
        setCurrentPage(1);
      }
      
      const qBrand = searchParams.get('brand');
      if (qBrand !== null && qBrand !== selectedBrand) {
        setSelectedBrand(qBrand);
        setCurrentPage(1);
      }
      
      const qPap = searchParams.get('pap');
      if (qPap !== null && (qPap === 'true') !== papOnly) {
        setPapOnly(qPap === 'true');
        setCurrentPage(1);
      }
    }
  }, [searchParams, papOnly]);

  // Fetch medicines based on active filters
  useEffect(() => {
    const controller = new AbortController();
    async function fetchMedicines() {
      setLoading(true);
      try {
        const params: any = {
          page: currentPage.toString(),
          limit: '12',
          sortBy
        };

        if (searchTerm) params.search = searchTerm;
        if (selectedCategory) params.category = selectedCategory;
        if (selectedBrand) params.brand = selectedBrand;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (papOnly) params.pap = 'true';
        
        const res = await api.get('/medicines', { 
          params,
          signal: controller.signal
        });
        if (res.data?.success) {
          setMedicines(res.data.data);
          setTotalPages(res.data.pagination?.totalPages || 1);
        }
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log('Medicines page fetch aborted');
        } else {
          console.error('Failed to load medicines list', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    
    fetchMedicines();
    return () => {
      controller.abort();
    };
  }, [searchTerm, selectedCategory, selectedBrand, minPrice, maxPrice, sortBy, currentPage, papOnly]);

  const handleAddToCart = (med: Medicine, customQty?: number) => {
    let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
    try {
      if (med.images) imagesArr = JSON.parse(med.images);
    } catch (e) {}

    addToCart({
      id: med.id,
      name: med.name,
      price: Number(med.price),
      discountPrice: med.discountPrice ? Number(med.discountPrice) : undefined,
      prescriptionRequired: med.prescriptionRequired,
      image: imagesArr[0],
      manufacturer: (med as any).manufacturer || med.brand?.name,
      brandName: med.brand?.name,
      genericName: med.genericName,
      composition: med.composition || med.genericName,
      packSize: med.packSize,
      isColdChain: med.isColdChain || med.storageInstructions?.toLowerCase().includes('2-8') || med.storageInstructions?.toLowerCase().includes('cold'),
      quantity: customQty || 1
    });

    showAddedToCart(med.name, () => router.push('/cart'));
    
    if (quickViewMed) {
      setQuickViewMed(null);
    }
    setQty(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('nameAsc');
    setPapOnly(false);
    setCurrentPage(1);
  };

  return (
    <div className="bg-slate-50/50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">
          <Link href="/" className="hover:text-brand-600 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900">Pharmacy Store</span>
        </div>

        <div className="w-full space-y-8">
          
          {/* CATEGORIES NAVIGATION */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Browse by Category
              </h2>
              <div className="flex items-center gap-2">
                {/* Scroll buttons for smooth pagination */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => scrollCategories('left')}
                    aria-label="Scroll categories left"
                    className="w-6 h-6 rounded-full bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-500 hover:text-brand-600 hover:border-brand-300 hover:bg-slate-50 transition-all cursor-pointer active:scale-90"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCategories('right')}
                    aria-label="Scroll categories right"
                    className="w-6 h-6 rounded-full bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-500 hover:text-brand-600 hover:border-brand-300 hover:bg-slate-50 transition-all cursor-pointer active:scale-90"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Link 
                  href="/condition" 
                  className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-0.5"
                >
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Horizontal scroll container with exact card counts per view (2 on mobile, 4 on tablet, 6-8 on desktop, zero cutting) */}
            <div
              ref={categoryScrollRef}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 w-full whitespace-nowrap touch-pan-x overscroll-x-contain"
            >
              {/* All Medicines Button (2 on mobile, 3 on sm, 4 on md, 6 on lg, 8 on xl) */}
              <button
                onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
                className={`shrink-0 snap-start inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all active:scale-95 w-[calc(50%_-_4px)] sm:w-[calc(33.333%_-_6px)] md:w-[calc(25%_-_6px)] lg:w-[calc(16.666%_-_6.7px)] xl:w-[calc(12.5%_-_7px)] ${
                  !selectedCategory ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="truncate">All Medicines</span>
              </button>

              {/* Category Buttons (Zero cutting across all breakpoints) */}
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.slug); setCurrentPage(1); }}
                  className={`shrink-0 snap-start inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all active:scale-95 w-[calc(50%_-_4px)] sm:w-[calc(33.333%_-_6px)] md:w-[calc(25%_-_6px)] lg:w-[calc(16.666%_-_6.7px)] xl:w-[calc(12.5%_-_7px)] ${
                    selectedCategory === cat.slug ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}

              {/* More Categories Link */}
              <Link
                href="/condition"
                className="shrink-0 snap-start inline-flex items-center justify-center gap-1 px-3 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all active:scale-95 w-[calc(50%_-_4px)] sm:w-[calc(33.333%_-_6px)] md:w-[calc(25%_-_6px)] lg:w-[calc(16.666%_-_6.7px)] xl:w-[calc(12.5%_-_7px)]"
              >
                <span className="truncate">More Categories</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </Link>
            </div>
          </div>

          {/* 2. PRODUCT GRID */}
          <div className="w-full space-y-8">
            
            {/* Top Bar Sort and Counters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Search Bar */}
              <div className="flex items-center gap-4 w-full md:w-auto flex-1 max-w-md relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search medicines by name or generic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-100/80 border-none text-slate-900 text-sm font-semibold rounded-full p-2.5 pl-10 focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-6 w-full md:w-auto">
                <div className="text-sm font-bold text-slate-500 whitespace-nowrap hidden sm:block">
                  Showing {medicines.length} results
                </div>

                {/* PAP Toggle Button */}
                <button
                  onClick={() => { setPapOnly(!papOnly); setCurrentPage(1); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                    papOnly 
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25' 
                      : 'bg-slate-100 text-slate-600 border-transparent hover:border-amber-400 hover:bg-amber-50/20'
                  }`}
                >
                  <span>🎁 PAP Program Only</span>
                </button>

                <div className="flex items-center gap-3">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-widest flex-shrink-0">Sort:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-100/80 border-none text-slate-700 text-sm font-bold rounded-full py-2 px-4 focus:ring-2 focus:ring-brand-500/20 cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    <option value="nameAsc">A to Z</option>
                    <option value="nameDesc">Z to A</option>
                    <option value="priceAsc">Low to High</option>
                    <option value="priceDesc">High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Category / Section Heading */}
            <div className="pt-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {selectedCategory 
                  ? (categories.find(c => c.slug === selectedCategory)?.name || selectedCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
                  : searchTerm 
                  ? `Search results for "${searchTerm}"`
                  : 'All Medicines'
                }
              </h2>
            </div>

            {/* List products */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1,2,3,4,5,6,7,8].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 h-[380px] animate-pulse flex flex-col justify-between">
                    <div className="w-full h-44 bg-slate-100 rounded-xl" />
                    <div className="space-y-2 py-4">
                      <div className="h-4 bg-slate-100 rounded w-3/4 mx-auto" />
                      <div className="h-3 bg-slate-100 rounded w-1/2 mx-auto" />
                      <div className="h-5 bg-slate-100 rounded w-1/3 mx-auto mt-2" />
                    </div>
                    <div className="h-10 bg-slate-100 rounded-xl w-full" />
                  </div>
                ))}
              </div>
            ) : medicines.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center flex flex-col items-center justify-center border border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 shadow-sm">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-slate-900 font-extrabold text-lg mb-2">No medicines found</h3>
                <p className="text-slate-500 text-sm font-medium mb-6">We couldn't find any items matching your current filters.</p>
                <button 
                  onClick={handleResetFilters}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 px-6 rounded-full transition-all shadow-sm"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {medicines.map((med, idx) => {
                    let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
                    try {
                      if (med.images) imagesArr = JSON.parse(med.images);
                    } catch(e) {}
                    
                    const discPrice = med.discountPrice ? Number(med.discountPrice) : null;
                    const price = Number(med.price);
                    const savingsPercent = discPrice && price > 0 ? Math.round(((price - discPrice) / price) * 100) : 0;
                    const savingsAmount = discPrice && price > discPrice ? (price - discPrice).toFixed(2) : '0';
                    const activePrice = discPrice || price;
                    const molecule = med.genericName || med.composition || med.categoryDetail?.name || 'GENERIC';
                    const isColdChain = med.isColdChain || med.storageInstructions?.toLowerCase().includes('cold') || med.name.toLowerCase().includes('injection') || med.name.toLowerCase().includes('vaccine');
                    const isRx = med.prescriptionRequired || !med.categoryDetail?.name?.toLowerCase().includes('wellness');

                    return (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.04 }}
                        key={med.id} 
                        className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group h-full"
                      >
                        {/* Top Area: Badges & Product Image */}
                        <div className="relative p-4 pb-2 bg-white flex flex-col">
                          {/* Badges Row */}
                          <div className="w-full flex items-center justify-between min-h-[26px]">
                            {savingsPercent > 0 ? (
                              <span className="bg-[#dcfce7] text-[#15803d] font-bold text-xs px-2.5 py-0.5 rounded-md shadow-2xs">
                                {savingsPercent}% Off
                              </span>
                            ) : (
                              <span />
                            )}

                            <div className="flex items-center gap-1.5 ml-auto">
                              {isRx && (
                                <span 
                                  className="w-5 h-5 rounded-full bg-[#3b1d60] text-white flex items-center justify-center text-[10px] font-black shadow-2xs"
                                  title="Prescription Required (Rx)"
                                >
                                  ℞
                                </span>
                              )}
                              {isColdChain && (
                                <span 
                                  className="w-5 h-5 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center text-[10px] font-bold shadow-2xs"
                                  title="Cold Chain Storage"
                                >
                                  ❄
                                </span>
                              )}
                              {med.papOffer && (
                                <span 
                                  className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow-2xs"
                                  title={`PAP Offer: ${med.papOffer}`}
                                >
                                  🎁
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Product Image */}
                          <Link href={`/medicines/detail?id=${med.id}`} className="w-full h-44 flex items-center justify-center my-2 overflow-hidden">
                            <img 
                              src={imagesArr[0]} 
                              alt={med.name} 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250';
                              }}
                              className="w-full h-full max-h-36 object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out" 
                            />
                          </Link>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-100" />

                        {/* Bottom Area: Centered Product Info */}
                        <div className="p-4 pt-3 flex flex-col flex-1 justify-between text-center bg-white">
                          <div>
                            {/* Product Title */}
                            <Link href={`/medicines/detail?id=${med.id}`} className="block">
                              <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-brand-600 transition-colors" title={med.name}>
                                {med.name}
                              </h3>
                            </Link>

                            {/* Molecule / Generic Composition (Underlined) */}
                            <Link href={`/medicines?search=${encodeURIComponent(molecule)}`} className="inline-block mt-1 max-w-full">
                              <p className="text-[11px] text-slate-500 hover:text-brand-600 font-semibold uppercase tracking-wide underline underline-offset-2 line-clamp-1 truncate" title={molecule}>
                                {molecule}
                              </p>
                            </Link>

                            {/* Price Line: Active Price + Strike-through */}
                            <div className="mt-2.5 flex items-baseline justify-center gap-2">
                              <span className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
                                ₹{formatCurrency(activePrice.toFixed(0))}
                              </span>
                              {discPrice && savingsPercent > 0 && (
                                <span className="text-xs text-slate-400 line-through font-normal">
                                  ₹{formatCurrency(price)}
                                </span>
                              )}
                            </div>

                            {/* You Save Line */}
                            {discPrice && savingsPercent > 0 ? (
                              <p className="text-xs text-slate-500 mt-1.5 font-medium">
                                You Save: <span className="text-emerald-600 font-bold">₹{formatCurrency(savingsAmount)} ({savingsPercent}%)</span>
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 mt-1.5 font-medium">
                                {med.packSize || 'Standard Pack'}
                              </p>
                            )}
                          </div>

                          {/* Full-width Add to Cart Button */}
                          <div className="mt-4">
                            <button 
                              onClick={() => handleAddToCart(med)}
                              className="w-full bg-[#108098] hover:bg-[#0c6b80] text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all active:scale-[0.98]"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              <span>Add to cart</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 pt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-900 disabled:opacity-30 disabled:hover:bg-white hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm font-bold"
                >
                  ←
                </button>
                <span className="text-slate-900 text-sm font-bold bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-900 disabled:opacity-30 disabled:hover:bg-white hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm font-bold"
                >
                  →
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

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
              className="relative bg-white rounded-[2rem] w-[95%] sm:w-full max-w-4xl shadow-2xl flex flex-col md:flex-row z-10 max-h-[90vh] md:max-h-[600px] overflow-y-auto md:overflow-hidden"
            >
              <button 
                onClick={() => setQuickViewMed(null)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-500 hover:text-slate-900 bg-white/90 backdrop-blur-sm hover:bg-slate-100 p-2 rounded-full transition-colors z-50 shadow-sm border border-slate-200"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Side - Image Panel */}
              <div className="md:w-[45%] bg-slate-50/50 p-6 sm:p-8 flex flex-col justify-center relative border-b md:border-b-0 md:border-r border-slate-100 flex-shrink-0">
                {quickViewMed.prescriptionRequired && (
                  <div className="absolute top-6 left-6 bg-rose-50 text-rose-600 font-bold text-[10px] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-rose-100">
                    <AlertCircle className="w-3.5 h-3.5" />
                    RX MEDICINE
                  </div>
                )}
                
                <div className="bg-white rounded-3xl p-8 flex items-center justify-center aspect-square shadow-sm border border-slate-100 mt-6">
                  <img 
                    src={(() => {
                      try { return JSON.parse(quickViewMed.images)[0]; } catch(e) { return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'; }
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
              <div className="md:w-[55%] bg-white p-6 sm:p-10 flex flex-col relative md:overflow-y-auto custom-scrollbar flex-1">
                <div className="mt-2 md:mt-0 mb-6">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="inline-block bg-slate-100 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
                      {quickViewMed.categoryDetail?.name || 'ONCOLOGY FORMULATION'}
                    </span>
                    {(() => {
                      const quickHsn = quickViewMed.hsnCode || (quickViewMed as any).hsn_code || (quickViewMed as any).hsn;
                      return quickHsn ? (
                        <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-slate-200 font-mono">
                          HSN: {quickHsn}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  
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
                    {quickViewMed.description || 'An advanced formulation used primarily in the treatment of related conditions. Please consult your physician before initiating this therapy.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 text-brand-600 font-bold text-xs mb-2">
                      <Shield className="w-4 h-4" /> Dosage Guideline
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {quickViewMed.dosage || 'Please follow your physician\'s instructions strictly regarding the dosage and duration of this medication.'}
                    </p>
                  </div>
                  <div className="bg-rose-50/30 border border-rose-100 shadow-sm rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs mb-2">
                      <ShieldAlert className="w-4 h-4" /> Precaution Check
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium line-clamp-3">
                      {quickViewMed.sideEffects || 'Consult your doctor before taking if you have underlying conditions or are taking other medications.'}
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

                {quickViewMed.papOffer && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 mb-6">
                    <span className="text-amber-500 mt-0.5 text-base">🎁</span>
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-600 block mb-0.5">PAP Offer Available</span>
                      <p className="text-[11px] font-semibold text-amber-800 leading-snug">{quickViewMed.papOffer}</p>
                    </div>
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

export default function MedicinesCatalogPage() {
  return (
    <Suspense fallback={
      <div className="bg-slate-50/50 min-h-screen py-10 flex items-center justify-center">
        <div className="text-slate-500 font-bold animate-pulse">Loading catalog...</div>
      </div>
    }>
      <MedicinesCatalogContent />
    </Suspense>
  );
}
