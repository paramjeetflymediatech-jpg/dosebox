'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, SlidersHorizontal, CheckSquare, Square, ChevronRight, Eye, AlertCircle, X, Shield, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { useCart } from '../../context/CartContext';

interface Medicine {
  id: number;
  name: string;
  genericName: string;
  composition: string;
  price: number;
  discountPrice?: number;
  prescriptionRequired: boolean;
  images: string;
  brand?: { name: string };
  categoryDetail?: { name: string };
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

  // Fetch medicines based on active filters
  useEffect(() => {
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

        const res = await api.get('/medicines', { params });
        if (res.data?.success) {
          setMedicines(res.data.data);
          setTotalPages(res.data.pagination?.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to load medicines list', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMedicines();
  }, [searchTerm, selectedCategory, selectedBrand, minPrice, maxPrice, sortBy, currentPage]);

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
      quantity: customQty || 1
    });
    
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
    setCurrentPage(1);
  };

  return (
    <div className="bg-slate-50/50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">
          <Link href="/" className="hover:text-brand-600 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900">Pharmacy Store</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* 1. STICKY MINIMAL SIDEBAR FILTERS */}
          <div className="lg:sticky lg:top-28 self-start space-y-8">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-brand-600" />
                Filters
              </span>
              <button 
                onClick={handleResetFilters}
                className="text-xs font-bold text-slate-400 hover:text-brand-600 transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Keyword Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search generic or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100/80 border-none text-slate-900 text-sm font-semibold rounded-[1rem] p-3 pl-10 focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all placeholder:text-slate-400"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>

            {/* Categories */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Categories</label>
              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left text-sm py-2 px-3 rounded-xl font-semibold transition-all flex items-center gap-2.5 ${!selectedCategory ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.slug); setCurrentPage(1); }}
                    className={`w-full text-left text-sm py-2 px-3 rounded-xl font-semibold transition-all flex items-center gap-2.5 ${selectedCategory === cat.slug ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Price Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-100/80 border-none text-slate-900 text-sm font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all placeholder:text-slate-400"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-100/80 border-none text-slate-900 text-sm font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* 2. PRODUCT GRID */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Top Bar Sort and Counters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-slate-500 text-sm font-semibold">
                Showing page <span className="text-slate-900 font-extrabold">{currentPage}</span> of <span className="text-slate-900 font-extrabold">{totalPages}</span>
              </div>

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

            {/* List products */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="bg-slate-100 rounded-[2rem] h-[340px] animate-pulse" />
                ))}
              </div>
            ) : medicines.length === 0 ? (
              <div className="bg-slate-100/50 rounded-[2.5rem] p-16 text-center flex flex-col items-center justify-center border border-slate-100 border-dashed">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-slate-900 font-extrabold text-lg mb-2">No medicines found</h3>
                <p className="text-slate-500 text-sm font-medium mb-6">We couldn't find any items matching your current filters.</p>
                <button 
                  onClick={handleResetFilters}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 px-6 rounded-full transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {medicines.map((med, idx) => {
                    let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
                    try {
                      if (med.images) imagesArr = JSON.parse(med.images);
                    } catch(e) {}
                    
                    const discPrice = med.discountPrice ? Number(med.discountPrice) : null;
                    const price = Number(med.price);

                    return (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        key={med.id} 
                        className="bg-slate-50 hover:bg-white rounded-[2rem] p-5 border border-transparent hover:border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all flex flex-col justify-between group relative"
                      >
                        {med.prescriptionRequired && (
                          <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-md text-rose-600 font-bold text-[10px] px-2 py-1 rounded-full flex items-center gap-1 shadow-sm border border-rose-100/50">
                            <AlertCircle className="w-3 h-3" />
                            Rx
                          </div>
                        )}
                        {discPrice && (
                          <div className="absolute top-4 right-4 z-10 bg-brand-600 text-white font-extrabold text-[10px] px-2 py-1 rounded-full shadow-sm">
                            {Math.round(((price - discPrice) / price) * 100)}% OFF
                          </div>
                        )}

                        <div>
                          <Link href={`/medicines/detail?id=${med.id}`}>
                            <div className="h-40 rounded-2xl bg-white flex items-center justify-center overflow-hidden mb-5 relative mix-blend-multiply border border-slate-100/50">
                              <img src={imagesArr[0]} alt={med.name} className="object-contain max-h-28 group-hover:scale-110 transition-transform duration-500 ease-out p-4" />
                            </div>
                          </Link>
                          
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{med.brand?.name || 'GENERIC'}</span>
                          <h3 className="font-bold text-slate-900 text-sm mt-1 line-clamp-2 leading-snug">
                            <Link href={`/medicines/detail?id=${med.id}`}>{med.name}</Link>
                          </h3>
                        </div>

                        <div className="mt-5 flex items-end justify-between border-t border-slate-100/50 pt-4">
                          <div>
                            {discPrice ? (
                              <div className="flex flex-col">
                                <span className="text-base font-extrabold text-slate-900 leading-none mb-1">₹{discPrice.toFixed(2)}</span>
                                <span className="text-[11px] text-slate-400 line-through leading-none">₹{price.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="text-base font-extrabold text-slate-900 leading-none">₹{price.toFixed(2)}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => { setQuickViewMed(med); setQty(1); }}
                              className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleAddToCart(med)}
                              className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-brand-600 hover:scale-105 transition-all shadow-sm"
                            >
                              +
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
                      try { return JSON.parse(quickViewMed.images)[0]; } catch(e) { return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'; }
                    })()}
                    alt={quickViewMed.name}
                    className="object-contain max-h-full"
                  />
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-3 text-center shadow-sm">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">PACK DETAILS</span>
                    <span className="block text-xs font-bold text-slate-800">Strip of 10 Tablets</span>
                  </div>
                  <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-3 text-center shadow-sm">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">MANUFACTURER</span>
                    <span className="block text-xs font-bold text-slate-800 truncate px-1">{quickViewMed.brand?.name || 'DoseBox Speciality Gen...'}</span>
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
                    ₹{quickViewMed.discountPrice ? Number(quickViewMed.discountPrice).toFixed(0) : Number(quickViewMed.price).toFixed(0)}
                  </span>
                  {quickViewMed.discountPrice && (
                    <>
                      <span className="text-sm text-slate-400 font-semibold line-through mb-1.5">
                        ₹{Number(quickViewMed.price).toFixed(0)}
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
                    An advanced formulation used primarily in the treatment of related chronic conditions. Please consult your physician before initiating this therapy.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 text-brand-600 font-bold text-xs mb-2">
                      <Shield className="w-4 h-4" /> Dosage Guideline
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      1 tablet daily at least 1 hour before or 2 hours after food.
                    </p>
                  </div>
                  <div className="bg-rose-50/30 border border-rose-100 shadow-sm rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs mb-2">
                      <ShieldAlert className="w-4 h-4" /> Precaution Check
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Skin lesions, loss of appetite, breathlessness.
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
                    Add to Basket • ₹{(qty * (quickViewMed.discountPrice ? Number(quickViewMed.discountPrice) : Number(quickViewMed.price))).toFixed(0)}
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
