'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, ShieldCheck, ArrowDownRight, ArrowUpRight, 
  ShoppingBag, Check, ChevronLeft, ChevronRight, AlertCircle, ArrowRight
} from 'lucide-react';
import api from '../../lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface SubstituteProduct {
  id: number;
  name: string;
  genericName: string;
  composition: string;
  manufacturer: string;
  dosage: string;
  packSize?: string;
  strength?: string;
  dosageForm?: string;
  prescriptionRequired: boolean;
  price: number;
  discountPrice?: number | null;
  effectivePrice: number;
  stock: number;
  images: string;
  brand?: { name: string };
  categoryDetail?: { name: string };
  comparison: {
    diff: number;
    absDiff: number;
    percentage: number;
    isCheaper: boolean;
    isExpensive: boolean;
    isSamePrice: boolean;
    savingsText: string;
    badgeColor: 'green' | 'red' | 'gray';
  };
}

interface TargetInfo {
  id: number;
  name: string;
  genericName: string;
  composition: string;
  strength?: string;
  dosageForm?: string;
  price: number;
  discountPrice?: number | null;
  effectivePrice: number;
}

interface ProductSubstitutesProps {
  currentMedicineId: number;
  onAddToCart?: (product: {
    id: number;
    name: string;
    price: number;
    discountPrice?: number;
    prescriptionRequired: boolean;
    image: string;
  }) => void;
}

export default function ProductSubstitutes({ currentMedicineId, onAddToCart }: ProductSubstitutesProps) {
  const [pageSize, setPageSize] = useState(4);
  const [substitutes, setSubstitutes] = useState<SubstituteProduct[]>([]);
  const [targetInfo, setTargetInfo] = useState<TargetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingPage, setFetchingPage] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [addedId, setAddedId] = useState<number | null>(null);

  // Fast in-memory cache to guarantee 0ms instant page flips
  const cacheRef = React.useRef<Record<string, { substitutes: SubstituteProduct[]; targetMedicine: TargetInfo; totalPages: number; totalItems: number }>>({});

  const fetchSubstitutes = async (pageNum: number, size: number = pageSize) => {
    const cacheKey = `${currentMedicineId}_p${pageNum}_s${size}`;
    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      setSubstitutes(cached.substitutes);
      setTargetInfo(cached.targetMedicine);
      setTotalPages(cached.totalPages);
      setTotalItems(cached.totalItems);
      setPage(pageNum);
      setLoading(false);
      setFetchingPage(false);
      return;
    }

    if (substitutes.length > 0) {
      setFetchingPage(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get(`/medicines/${currentMedicineId}/substitutes?page=${pageNum}&limit=${size}`);
      if (res.data?.success && res.data.data) {
        const subs = res.data.data.substitutes || [];
        const target = res.data.data.targetMedicine || null;
        const pTotal = res.data.data.pagination?.totalPages || 1;
        const iTotal = res.data.data.pagination?.totalItems || 0;

        setSubstitutes(subs);
        setTargetInfo(target);
        setTotalPages(pTotal);
        setTotalItems(iTotal);
        setPage(pageNum);

        // Store in cache
        cacheRef.current[cacheKey] = {
          substitutes: subs,
          targetMedicine: target,
          totalPages: pTotal,
          totalItems: iTotal
        };
      }
    } catch (err) {
      console.error('Failed to load medicine substitutes:', err);
    } finally {
      setLoading(false);
      setFetchingPage(false);
    }
  };

  useEffect(() => {
    if (currentMedicineId) {
      cacheRef.current = {};
      setPage(1);
      fetchSubstitutes(1, pageSize);
    }
  }, [currentMedicineId]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      fetchSubstitutes(newPage, pageSize);
      // Smooth scroll back to section top if scrolled down
      const el = document.getElementById('equivalent-substitutes');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (newSize !== pageSize) {
      setPageSize(newSize);
      fetchSubstitutes(1, newSize);
    }
  };

  const handleQuickAdd = (sub: SubstituteProduct) => {
    let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
    try {
      if (sub.images) imagesArr = JSON.parse(sub.images);
    } catch (e) {}

    if (onAddToCart) {
      onAddToCart({
        id: sub.id,
        name: sub.name,
        price: Number(sub.price),
        discountPrice: sub.discountPrice ? Number(sub.discountPrice) : undefined,
        prescriptionRequired: sub.prescriptionRequired,
        image: imagesArr[0]
      });
    }

    setAddedId(sub.id);
    toast.success(`${sub.name} added to cart!`);
    setTimeout(() => {
      setAddedId((curr) => (curr === sub.id ? null : curr));
    }, 2000);
  };

  // If loading for the first time with no data
  if (loading && substitutes.length === 0 && !targetInfo) {
    return (
      <div id="equivalent-substitutes" className="mt-12 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-slate-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If no substitutes exist for this molecule and strength
  if (!loading && substitutes.length === 0) {
    return (
      <div id="equivalent-substitutes" className="mt-12 bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Equivalent Substitutes Check</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Molecule: <span className="font-semibold text-slate-700">{targetInfo?.genericName || targetInfo?.composition || 'Active Salt'}</span>
                {targetInfo?.strength && (
                  <span className="ml-1.5 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">
                    {targetInfo.strength}
                  </span>
                )}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <Check className="w-3.5 h-3.5" /> Best Option Selected
          </span>
        </div>
        <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            No other brands with the exact same strength ({targetInfo?.strength || 'standard'}) are currently stocked. The selected medicine is verified and optimal.
          </span>
        </div>
      </div>
    );
  }

  const startNum = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endNum = Math.min(page * pageSize, totalItems);

  const getPaginationItems = (current: number, total: number): (number | string)[] => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  return (
    <section 
      id="equivalent-substitutes" 
      className="mt-12 scroll-mt-28 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm transition-all relative"
    >
      {/* ── HEADER WITH MOLECULE & STRENGTH CONFIRMATION ── */}
      <div className="pb-6 border-b border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/90 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Bioequivalent Product Substitutes
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                100% Salt &amp; Strength Match
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Available Substitutes &amp; Price Comparison
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Verified bioequivalent alternative brands sharing the identical chemical formulation, ranked from lowest price to maximize your savings.
            </p>
          </div>

          {/* Quick Stat / Available Brands Banner */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 px-4 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black shadow-xs text-sm">
                %
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Available Substitutes
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  {totalItems} <span className="font-semibold text-slate-500 text-xs">Verified Brands</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated Molecule & Strength Match Banner (MrMed Style) */}
        <div className="mt-5 bg-gradient-to-r from-slate-50 via-teal-50/30 to-emerald-50/30 border border-slate-200 rounded-2xl p-3.5 sm:px-5 sm:py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Active Molecule:</span>
              <span className="font-extrabold text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                {targetInfo?.genericName || targetInfo?.composition || 'Active Salt'}
              </span>
            </div>

            {targetInfo?.strength && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Required Strength:</span>
                <span className="font-extrabold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg shadow-2xs">
                  {targetInfo.strength} (Exact Match)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-700 font-semibold text-xs">Sorted: Lowest Price First</span>
            {totalPages > 1 && (
              <span className="text-slate-400 text-xs font-semibold">
                (Page {page} of {totalPages})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Substitutes Cards Grid with Loading State */}
      <div className={`relative transition-opacity duration-200 ${fetchingPage ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
          {substitutes.map((sub) => {
            let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
            try {
              if (sub.images) imagesArr = JSON.parse(sub.images);
            } catch (e) {}

            const { comparison } = sub;
            const isCheaper = comparison.isCheaper;
            const isExpensive = comparison.isExpensive;
            const formattedDiff = Math.round(comparison.absDiff).toLocaleString('en-IN');

            return (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:-translate-y-0.5 h-full"
              >
                {/* Top Image & Savings Banner (Standardized Square Aspect Ratio like Related Products) */}
                <div className="relative aspect-square p-5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                  <Link href={`/medicines/detail?id=${sub.id}`} className="w-full h-full flex items-center justify-center">
                    <img
                      src={imagesArr[0]}
                      alt={sub.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250';
                      }}
                      className="w-full h-full max-h-36 max-w-[90%] object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Savings / Price Comparison Badge (Point 2: Green for cheaper, Red for expensive) */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    {isCheaper ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 text-white shadow-xs tracking-tight">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        Save ₹{formattedDiff} ({comparison.percentage}%)
                      </span>
                    ) : isExpensive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-xs tracking-tight">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +₹{formattedDiff} ({comparison.percentage}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200 text-slate-700">
                        Same Price
                      </span>
                    )}

                    {sub.prescriptionRequired && (
                      <span className="px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black rounded-md">
                        Rx
                      </span>
                    )}
                  </div>

                  {/* Strength match pill on image */}
                  {sub.strength && (
                    <span className="absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 bg-white/95 text-slate-700 rounded-md border border-slate-200 shadow-2xs">
                      {sub.strength}
                    </span>
                  )}
                </div>

                {/* Medicine Info (Standardized Equal Heights for Perfect Sequence) */}
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 line-clamp-1 block h-4">
                      {sub.brand?.name || sub.manufacturer || 'Certified Brand'}
                    </span>
                    <Link href={`/medicines/detail?id=${sub.id}`} className="group-hover:text-brand-600 transition-colors block">
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2 mt-1 h-10 leading-snug" title={sub.name}>
                        {sub.name}
                      </h4>
                    </Link>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 h-4">
                      {sub.packSize || (sub.dosageForm ? `${sub.dosageForm}` : 'Standard Pack')}
                    </p>
                  </div>

                  {/* Pricing Box */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-lg font-black text-slate-950">
                          ₹{formatCurrency(sub.effectivePrice)}
                        </span>
                        {sub.discountPrice && (
                          <span className="text-xs text-slate-600 line-through ml-1.5">
                            ₹{formatCurrency(sub.price)}
                          </span>
                        )}
                      </div>

                      {/* Comparison Pill */}
                      <div className="text-right">
                        {isCheaper ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {comparison.percentage}% cheaper
                          </span>
                        ) : isExpensive ? (
                          <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            {comparison.percentage}% higher
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-600">
                            Equal price
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-3.5">
                      <button
                        onClick={() => handleQuickAdd(sub)}
                        disabled={sub.stock <= 0}
                        className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                          addedId === sub.id
                            ? 'bg-emerald-600 text-white'
                            : isCheaper
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-brand-600 hover:bg-brand-700 text-white'
                        }`}
                      >
                        {addedId === sub.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Added
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            {isCheaper ? 'Switch' : 'Add'}
                          </>
                        )}
                      </button>

                      <Link
                        href={`/medicines/detail?id=${sub.id}`}
                        className="w-full py-2 px-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PAGINATION & DENSITY BAR (CLEAN BOTTOM LAYOUT) ── */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-5 border-t border-slate-200/80">
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-600">
              Showing <span className="font-bold text-slate-800">{startNum}–{endNum}</span> of{' '}
              <span className="font-bold text-slate-800">{totalItems}</span> matching substitutes
            </p>

            {/* Density Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-600 px-1.5 uppercase">Show:</span>
              {[4, 8, 12].map((size) => (
                <button
                  key={size}
                  onClick={() => handlePageSizeChange(size)}
                  className={`px-2 py-0.5 rounded-md font-bold text-xs transition-colors ${
                    pageSize === size
                      ? 'bg-white text-brand-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {/* Prev Button */}
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors flex items-center gap-1 shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>

            {/* Smart Numbered Buttons */}
            {getPaginationItems(page, totalPages).map((item, idx) => {
              if (item === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="w-7 text-center text-xs text-slate-400 font-bold select-none">
                    ...
                  </span>
                );
              }
              const pageNum = Number(item);
              const isActive = page === pageNum;
              return (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => handlePageChange(pageNum)}
                  className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-xs scale-105'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors flex items-center gap-1 shadow-2xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
