'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, SlidersHorizontal, CheckSquare, Square, ChevronRight, ShoppingBag, Eye, X, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
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
  
  // Filters state (pre-filled from URL search params)
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
          limit: '8',
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

  const handleAddToCart = (med: Medicine) => {
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
      image: imagesArr[0]
    });
    alert(`${med.name} added to cart!`);
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
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-6 uppercase tracking-wider">
          <Link href="/" className="hover:text-brand-600 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600">All Medicines</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* 1. SIDEBAR FILTERS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 self-start shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand-600" />
                Refine Search
              </span>
              <button 
                onClick={handleResetFilters}
                className="text-xxs font-bold text-slate-400 hover:text-rose-600 transition-colors hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Keyword Search */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Search Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter generic or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 pl-9 focus:outline-none focus:border-brand-500 focus:bg-white"
                />
                <Search className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Category</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${!selectedCategory ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {!selectedCategory ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.slug); setCurrentPage(1); }}
                    className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${selectedCategory === cat.slug ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {selectedCategory === cat.slug ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Brands</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
                <button
                  onClick={() => setSelectedBrand('')}
                  className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${!selectedBrand ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {!selectedBrand ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  All Brands
                </button>
                {brands.map((br) => (
                  <button
                    key={br.id}
                    onClick={() => { setSelectedBrand(br.slug); setCurrentPage(1); }}
                    className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${selectedBrand === br.slug ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {selectedBrand === br.slug ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    {br.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Price Bounds (₹)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:border-brand-500 focus:bg-white"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* 2. PRODUCT GRID CONTAINER */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Top Bar Sort and Counters */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-slate-500 text-xs sm:text-sm font-semibold">
                Showing page <span className="text-slate-900 font-extrabold">{currentPage}</span> of <span className="text-slate-900 font-extrabold">{totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider flex-shrink-0">Sort By:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg p-2 focus:outline-none focus:border-brand-500"
                >
                  <option value="nameAsc">Alphabetical A-Z</option>
                  <option value="nameDesc">Alphabetical Z-A</option>
                  <option value="priceAsc">Price: Low to High</option>
                  <option value="priceDesc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* List products */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm h-72 animate-pulse" />
                ))}
              </div>
            ) : medicines.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
                <p className="text-slate-400 text-sm font-semibold mb-3">No matching medicines found in catalog.</p>
                <button 
                  onClick={handleResetFilters}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2 px-5 rounded-full transition-all shadow"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {medicines.map((med) => {
                  let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
                  try {
                    if (med.images) imagesArr = JSON.parse(med.images);
                  } catch(e) {}
                  
                  const discPrice = med.discountPrice ? Number(med.discountPrice) : null;
                  const price = Number(med.price);

                  return (
                    <div 
                      key={med.id} 
                      className="bg-white rounded-2xl border border-slate-150 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Image Frame */}
                        <div className="h-32 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden mb-4 relative">
                          <img 
                            src={imagesArr[0]} 
                            alt={med.name} 
                            className="object-contain max-h-24 mix-blend-multiply"
                          />
                          {med.prescriptionRequired && (
                            <span className="absolute top-2 left-2 bg-rose-50 text-rose-600 font-bold text-xxs px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1 shadow-sm">
                              <AlertCircle className="w-3 h-3" />
                              Rx
                            </span>
                          )}
                          {discPrice && (
                            <span className="absolute top-2 right-2 bg-emerald-50 text-emerald-600 font-extrabold text-xxs px-2 py-0.5 rounded border border-emerald-100">
                              {Math.round(((price - discPrice) / price) * 100)}% OFF
                            </span>
                          )}
                        </div>

                        <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider">{med.brand?.name || 'GENERIC'}</span>
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm mt-1 line-clamp-1 hover:underline">
                          <Link href={`/medicines/${med.id}`}>{med.name}</Link>
                        </h3>
                        <p className="text-xxs text-slate-400 mt-1 line-clamp-1">Comp: {med.composition}</p>
                      </div>

                      <div className="mt-5 border-t border-slate-50 pt-4 flex items-center justify-between">
                        <div>
                          {discPrice ? (
                            <>
                              <span className="text-xs sm:text-sm font-extrabold text-slate-900">₹{discPrice.toFixed(2)}</span>
                              <span className="text-xxs text-slate-400 line-through ml-1">₹{price.toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900">₹{price.toFixed(2)}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Link 
                            href={`/medicines/${med.id}`}
                            className="p-1.5 border border-slate-200 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-full transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button 
                            onClick={() => handleAddToCart(med)}
                            className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-1.5 px-3 rounded-full transition-all"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="bg-white border border-slate-200 text-slate-700 disabled:opacity-50 hover:bg-slate-50 font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition-colors"
                >
                  Previous
                </button>
                <span className="text-slate-500 text-xs font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-white border border-slate-200 text-slate-700 disabled:opacity-50 hover:bg-slate-50 font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition-colors"
                >
                  Next
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default function MedicinesCatalogPage() {
  return (
    <Suspense fallback={
      <div className="bg-slate-50 min-h-screen py-10 flex items-center justify-center">
        <div className="text-slate-500 font-semibold animate-pulse">Loading catalog...</div>
      </div>
    }>
      <MedicinesCatalogContent />
    </Suspense>
  );
}
