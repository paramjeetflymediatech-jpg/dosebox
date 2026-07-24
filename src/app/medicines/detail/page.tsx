'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck, AlertTriangle, HelpCircle, Star, ShoppingBag, Truck, Info, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import Link from 'next/link';
import api from '../../../lib/api';
import { useCart } from '../../../context/CartContext';
import { toast } from 'react-hot-toast';
import { formatCurrency, calculateUnitPrice } from '@/lib/utils';

interface Review {
  id: number;
  rating: number;
  comment?: string;
  user?: { name: string };
  createdAt: string;
}

interface MedicineDetails {
  id: number;
  name: string;
  genericName: string;
  manufacturer: string;
  composition: string;
  dosage: string;
  description?: string;
  sideEffects?: string;
  storageInstructions?: string;
  papOffer?: string;
  packSize?: string;
  prescriptionRequired: boolean;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string;
  brand?: { name: string };
  categoryDetail?: { name: string };
  reviews?: Review[];
  contentStatus?: string;
  verifierName?: string;
  verifierRegNo?: string;
}

function MedicineDetailsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { addToCart } = useCart();

  const [medicine, setMedicine] = useState<MedicineDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'info' | 'sideEffects' | 'reviews'>('info');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function loadDetails() {
      try {
        const res = await api.get(`/medicines/${id}`);
        if (res.data?.success) {
          setMedicine(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load medicine details', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [id]);

  const handleAddToCart = () => {
    if (!medicine) return;
    let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
    try {
      if (medicine.images) imagesArr = JSON.parse(medicine.images);
    } catch (e) { }

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: medicine.id,
        name: medicine.name,
        price: Number(medicine.price),
        discountPrice: medicine.discountPrice ? Number(medicine.discountPrice) : undefined,
        prescriptionRequired: medicine.prescriptionRequired,
        image: imagesArr[0]
      });
    }
    toast.success(`${medicine.name} (${quantity} items) added to cart!`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-10 bg-slate-200 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="h-96 bg-slate-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded-lg w-3/4" />
            <div className="h-6 bg-slate-200 rounded-lg w-1/2" />
            <div className="h-24 bg-slate-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h3 className="text-xl font-bold text-slate-800">Medicine details not found.</h3>
        <p className="text-slate-400 mt-2">The medication item may have been deleted or doesn&apos;t exist.</p>
        <Link href="/medicines" className="mt-6 inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-6 rounded-full transition-all">
          Back to Store
        </Link>
      </div>
    );
  }

  let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
  try {
    if (medicine.images) imagesArr = JSON.parse(medicine.images);
  } catch (e) { }

  const price = Number(medicine.price);
  const discPrice = medicine.discountPrice ? Number(medicine.discountPrice) : null;
  const isOutOfStock = medicine.stock <= 0;

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Detail Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm">

          {/* Left: Product Images */}
          <div className="flex flex-col gap-4">
            <div className="relative bg-slate-50 rounded-2xl overflow-hidden min-h-[350px] group cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
              <img
                src={imagesArr[currentImageIndex]}
                alt={medicine.name}
                className="absolute inset-0 w-full h-full object-contain mix-blend-multiply transition-transform hover:scale-105 duration-300"
              />
              {medicine.prescriptionRequired && (
                <div className="absolute top-4 left-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold py-1 px-3 rounded-lg flex items-center gap-1.5 shadow-sm z-10">
                  <AlertTriangle className="w-4 h-4" />
                  Doctor Prescription Required (Rx)
                </div>
              )}

              {/* Slider Arrows */}
              {imagesArr.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === 0 ? imagesArr.length - 1 : prev - 1)); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === imagesArr.length - 1 ? 0 : prev + 1)); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {imagesArr.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {imagesArr.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-brand-600 shadow-md' : 'border-transparent bg-slate-100 hover:border-slate-300'}`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain mix-blend-multiply" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Meta & Adders */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-brand-600  tracking-widest bg-brand-50 py-1 px-3.5 rounded-full w-max inline-block">
                  {medicine.brand?.name || 'CIpla'}
                </span>
                {medicine.packSize && (
                  <span className="text-xs font-bold text-slate-500  tracking-widest bg-slate-100 py-1 px-3.5 rounded-full w-max inline-block border border-slate-200">
                    {medicine.packSize}
                  </span>
                )}
                {medicine.contentStatus === 'Approved' && (
                  <span className="text-xs font-bold text-emerald-700 tracking-widest bg-emerald-50 py-1 px-3.5 rounded-full inline-flex items-center gap-1.5 border border-emerald-200" title={`Medically Reviewed by ${medicine.verifierName || 'Professional'} (${medicine.verifierRegNo || 'Reg: N/A'})`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified by {medicine.verifierName || 'Doctor'}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">{medicine.name}</h1>
              <p className="text-sm font-semibold text-slate-500 italic mt-1">{medicine.genericName}</p>

              {/* Details Grid */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Manufacturer</h4>
                  <p className="text-sm font-semibold text-slate-800 line-clamp-2">{medicine.manufacturer || medicine.brand?.name || 'Unknown'}</p>
                </div>
                <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Storage</h4>
                  <p className="text-sm font-semibold text-slate-800">{medicine.storageInstructions || 'Store in dry condition.'}</p>
                </div>
              </div>

              {/* PAP Offer Banner */}
              {medicine.papOffer && (
                <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <span className="text-amber-500 mt-0.5 text-base">🎁</span>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 block mb-0.5">PAP Offer</span>
                    <p className="text-sm font-semibold text-amber-800 leading-snug">{medicine.papOffer}</p>
                  </div>
                </div>
              )}

              {/* Price & Savings */}
              <div className="mt-6">
                <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Pricing</span>
                <div className="flex items-baseline gap-3 mt-1">
                  {discPrice ? (
                    <>
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-950">₹{formatCurrency(discPrice)}</span>
                      <span className="text-slate-400 line-through text-sm">₹{formatCurrency(price)}</span>
                      <span className="text-emerald-600 text-xs font-bold bg-emerald-50 py-0.5 px-2 rounded-lg border border-emerald-100">
                        Save {Math.round(((price - discPrice) / price) * 100)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-950">₹{formatCurrency(price)}</span>
                  )}
                </div>
                {(() => {
                  const activePrice = discPrice || price;
                  const unitPriceObj = calculateUnitPrice(activePrice, medicine.packSize);
                  if (!unitPriceObj) return null;
                  return (
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      ₹{formatCurrency(unitPriceObj.price)} per {unitPriceObj.unit}
                    </p>
                  );
                })()}
                <p className="text-xxs text-slate-400 mt-1">Tax inclusive (GST included in prices)</p>
              </div>
            </div>

            {/* CTA & Quantity Selectors */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              {isOutOfStock ? (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 p-4 rounded-xl text-sm font-semibold">
                  This item is currently out of stock. We will restock shortly.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-slate-200 rounded-full py-1.5 px-3 bg-slate-50">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="text-slate-500 font-extrabold text-sm px-2.5 focus:outline-none"
                    >
                      -
                    </button>
                    <span className="text-slate-800 font-bold text-sm px-4">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(medicine.stock, q + 1))}
                      className="text-slate-500 font-extrabold text-sm px-2.5 focus:outline-none"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart button */}
                  <button
                    onClick={handleAddToCart}
                    className="w-full sm:flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-full shadow-lg shadow-brand-500/10 flex items-center justify-center gap-2 text-sm tracking-wide transition-all"
                  >
                    <ShoppingBag className="w-4.5 h-4.5" />
                    Add to Cart
                  </button>
                </div>
              )}

              {/* Delivery badge */}
              <div className="flex items-center gap-2 mt-4 text-xxs font-semibold text-slate-400 uppercase tracking-widest justify-center sm:justify-start">
                <Truck className="w-4 h-4 text-emerald-600" />
                Delivery to major cities within 24-48 hours
              </div>
            </div>

          </div>
        </div>

        {/* DoseBox-style Detail Breakdowns & Navigation */}
        <MedicineScrollspy medicine={medicine} />
        
        {/* Related Products Carousel */}
        <RelatedProducts currentMedicineId={medicine.id} />

      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={imagesArr[currentImageIndex]}
            alt="Fullscreen view"
            className="max-w-[90vw] max-h-[85vh] object-contain select-none"
          />

          {imagesArr.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === 0 ? imagesArr.length - 1 : prev - 1)); }}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === imagesArr.length - 1 ? 0 : prev + 1)); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {imagesArr.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${currentImageIndex === idx ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function MedicineScrollspy({ medicine }: { medicine: any }) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 100; // offset for sticky header if any
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  let sectionsList: { id: string; label: string; content: string }[] = [];
  
  const isApproved = !medicine.contentStatus || medicine.contentStatus === 'Approved';

  if (isApproved) {
    if (medicine.sections && medicine.sections.length > 0) {
      sectionsList = medicine.sections.map((s: any) => ({
        id: `section-${s.id}`,
        label: s.title,
        content: s.content
      }));
    } else {
      // Fallback for older medicines without dynamic sections
      if (medicine.description) sectionsList.push({ id: 'introduction', label: 'Introduction', content: medicine.description });
      if (medicine.dosage) sectionsList.push({ id: 'how-to-use', label: 'How to Use', content: medicine.dosage });
      if (medicine.storageInstructions) sectionsList.push({ id: 'storage', label: 'Storage Conditions', content: medicine.storageInstructions });
      if (medicine.sideEffects) sectionsList.push({ id: 'side-effects', label: 'Side Effects', content: medicine.sideEffects });
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 mt-12 items-start">
      {/* Sidebar Navigation */}
      <section className="hidden md:block w-1/4 p-4 bg-white sticky top-24 rounded-3xl border border-slate-200 shadow-sm">
        {sectionsList.map((item) => (
          <button key={item.id} onClick={() => scrollTo(item.id)} className="flex justify-between items-end mb-2 cursor-pointer w-full text-left group">
            <div className="w-full">
              <div className="flex items-center">
                <p className="text-sm text-slate-800 line-clamp-1 group-hover:text-brand-600 transition-colors font-medium">{item.label}</p>
              </div>
              <div className="w-full h-[0.5px] mt-2 bg-slate-100 rounded-full"></div>
            </div>
          </button>
        ))}
      </section>

      {/* Main Content Sections */}
      <section className="w-full md:w-3/4 border border-slate-200 rounded-3xl bg-white shadow-sm p-6 sm:p-8">
        {sectionsList.length === 0 ? (
           <div className="text-slate-500 text-center py-10 font-medium">
             {medicine.contentStatus && medicine.contentStatus !== 'Approved' 
               ? "Detailed medical information is currently under review by our medical team and will be published shortly."
               : "No detailed information available for this medicine yet."}
           </div>
        ) : (
          sectionsList.map((item) => (
            <div key={item.id} id={item.id} className="w-full pb-6 mb-6 border-b border-slate-100 last:border-b-0 last:mb-0 last:pb-0">
              <div className="flex justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">{item.label}</h2>
              </div>
              <div className="text-sm prose prose-slate max-w-none">
                <div dangerouslySetInnerHTML={{ __html: item.content }} />
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export function RelatedProducts({ currentMedicineId }: { currentMedicineId: number }) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    // Fetch generic list for related products
    api.get(`/medicines?limit=6`).then(res => {
      if (res.data?.success) {
        setProducts(res.data.data.filter((m: any) => m.id !== currentMedicineId).slice(0, 5));
      }
    }).catch(console.error);
  }, [currentMedicineId]);

  if (products.length === 0) return null;

  return (
    <div className="mt-16 w-full px-2 max-w-7xl mx-auto">
      <h5 className="text-xl font-bold text-slate-900 mb-6">Related Products</h5>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-6">
        {products.map(product => {
          let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
          try {
            if (product.images) imagesArr = JSON.parse(product.images);
          } catch(e) {}
          
          const price = Number(product.price);
          const discPrice = product.discountPrice ? Number(product.discountPrice) : null;
          
          return (
            <div key={product.id} className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow relative flex flex-col">
              <Link href={`/medicines/detail?id=${product.id}`}>
                <div className="relative aspect-square p-4 bg-slate-50 border-b border-slate-100">
                  <img src={imagesArr[0]} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                  
                  {discPrice && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md uppercase tracking-widest">
                      {Math.round(((price - discPrice) / price) * 100)}% Off
                    </div>
                  )}
                  
                  {product.prescriptionRequired && (
                    <div className="absolute top-2 right-2">
                      <img src="/product/prescription/rx_icon.svg" alt="Rx" className="w-6 h-6 drop-shadow-sm" />
                    </div>
                  )}
                </div>
              </Link>
              
              <div className="p-4 flex flex-col flex-1">
                <Link href={`/medicines/detail?id=${product.id}`}>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-brand-600 text-center">{product.name}</h3>
                </Link>
                <p className="text-xs text-slate-500 text-center mt-1 uppercase tracking-wider underline line-clamp-1 mb-2">{product.genericName || 'MEDICINE'}</p>
                
                <Link href={`/medicines/detail?id=${product.id}`} className="mt-auto">
                  <div className="flex justify-center items-baseline gap-2">
                    {discPrice ? (
                      <>
                        <h4 className="text-brand-600 text-lg font-black leading-none">₹{discPrice}</h4>
                        <p className="text-xs text-slate-400 line-through font-medium">₹{price}</p>
                      </>
                    ) : (
                      <h4 className="text-brand-600 text-lg font-black leading-none">₹{price}</h4>
                    )}
                  </div>
                  
                  {discPrice && (
                    <>
                      <div className="my-3 border-t border-dashed border-slate-200"></div>
                      <div className="flex justify-center items-center gap-1.5 text-xs">
                        <span className="text-slate-500 font-medium">You Save:</span>
                        <span className="text-emerald-600 font-bold">₹{(price - discPrice).toFixed(2)} ({Math.round(((price - discPrice) / price) * 100)}%)</span>
                      </div>
                    </>
                  )}
                </Link>
                
                <div className="mt-4">
                  <button 
                    onClick={() => {
                      // Note: We don't have access to addToCart here easily without props,
                      // so we'll just redirect to the product page on click or we can pass addToCart down
                      window.location.href = `/medicines/detail?id=${product.id}`;
                    }}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 rounded-xl text-sm flex justify-center items-center gap-2 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M4.69781 4.97613C4.83947 4.83447 5.0316 4.75488 5.23194 4.75488H5.60359C6.09573 4.75531 6.57435 4.91594 6.96712 5.21249C7.35988 5.50903 7.64543 5.92538 7.7806 6.39859L8.17491 7.77641H20.7354C20.9821 7.77656 21.2251 7.83716 21.443 7.95289C21.661 8.06863 21.8472 8.23598 21.9855 8.44033C22.1239 8.64467 22.21 8.87978 22.2365 9.12511C22.263 9.37044 22.2289 9.61852 22.1374 9.84766L19.9105 15.4163C19.7423 15.8369 19.4519 16.1975 19.0768 16.4514C18.7016 16.7054 18.259 16.8411 17.806 16.841H10.9033C10.4111 16.841 9.93232 16.6807 9.53928 16.3844C9.14624 16.0882 8.86035 15.672 8.72483 15.1988L6.32876 6.81405C6.28382 6.6563 6.18875 6.51747 6.05792 6.41853C5.92709 6.3196 5.76762 6.26593 5.60359 6.26565H5.23194C5.0316 6.26565 4.83947 6.18606 4.69781 6.0444C4.55615 5.90274 4.47656 5.7106 4.47656 5.51026C4.47656 5.30992 4.55615 5.11779 4.69781 4.97613ZM12.1422 22.7115C11.8673 22.8254 11.5726 22.884 11.275 22.884C10.674 22.884 10.0976 22.6453 9.67259 22.2203C9.2476 21.7953 9.00885 21.2189 9.00885 20.6179C9.00885 20.0169 9.2476 19.4405 9.67259 19.0155C10.0976 18.5905 10.674 18.3517 11.275 18.3517C11.5726 18.3517 11.8673 18.4104 12.1422 18.5242C12.4172 18.6381 12.667 18.8051 12.8774 19.0155C13.0878 19.2259 13.2548 19.4757 13.3686 19.7507C13.4825 20.0256 13.5411 20.3203 13.5411 20.6179C13.5411 20.9155 13.4825 21.2102 13.3686 21.4851C13.2548 21.76 13.0878 22.0099 12.8774 22.2203C12.667 22.4307 12.4172 22.5977 12.1422 22.7115ZM10.7409 21.152C10.8825 21.2937 11.0747 21.3733 11.275 21.3733C11.4753 21.3733 11.6675 21.2937 11.8091 21.152C11.9508 21.0104 12.0304 20.8182 12.0304 20.6179C12.0304 20.4176 11.9508 20.2254 11.8091 20.0838C11.6675 19.9421 11.4753 19.8625 11.275 19.8625C11.0747 19.8625 10.8825 19.9421 10.7409 20.0838C10.5992 20.2254 10.5196 20.4176 10.5196 20.6179C10.5196 20.8182 10.5992 21.0104 10.7409 21.152ZM18.1853 22.7115C17.9103 22.8254 17.6156 22.884 17.318 22.884C16.717 22.884 16.1406 22.6453 15.7156 22.2203C15.2907 21.7953 15.0519 21.2189 15.0519 20.6179C15.0519 20.0169 15.2907 19.4405 15.7156 19.0155C16.1406 18.5905 16.717 18.3517 17.318 18.3517C17.6156 18.3517 17.9103 18.4104 18.1853 18.5242C18.4602 18.6381 18.71 18.8051 18.9205 19.0155C19.1309 19.2259 19.2978 19.4757 19.4117 19.7507C19.5256 20.0256 19.5842 20.3203 19.5842 20.6179C19.5842 20.9155 19.5256 21.2102 19.4117 21.4851C19.2978 21.76 19.1309 22.0099 18.9205 22.2203C18.71 22.4307 18.4602 22.5977 18.1853 22.7115ZM16.7839 21.152C16.9256 21.2937 17.1177 21.3733 17.318 21.3733C17.5184 21.3733 17.7105 21.2937 17.8522 21.152C17.9938 21.0104 18.0734 20.8182 18.0734 20.6179C18.0734 20.4176 17.9938 20.2254 17.8522 20.0838C17.7105 19.9421 17.5184 19.8625 17.318 19.8625C17.1177 19.8625 16.9256 19.9421 16.7839 20.0838C16.6422 20.2254 16.5627 20.4176 16.5627 20.6179C16.5627 20.8182 16.6422 21.0104 16.7839 21.152Z" fill="#fff"/></svg>
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MedicineDetailsPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center animate-pulse">Loading medicine data...</div>}>
      <MedicineDetailsContent />
    </Suspense>
  );
}

