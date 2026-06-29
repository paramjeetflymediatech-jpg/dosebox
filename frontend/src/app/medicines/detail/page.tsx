'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, AlertTriangle, HelpCircle, Star, ShoppingBag, Truck, Info, Calendar
} from 'lucide-react';
import Link from 'next/link';
import api from '../../../lib/api';
import { useCart } from '../../../context/CartContext';
import { toast } from 'react-hot-toast';

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
  prescriptionRequired: boolean;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string;
  brand?: { name: string };
  categoryDetail?: { name: string };
  reviews?: Review[];
}

function MedicineDetailsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { addToCart } = useCart();
  
  const [medicine, setMedicine] = useState<MedicineDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'info' | 'sideEffects' | 'reviews'>('info');

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
    } catch (e) {}

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
        <p className="text-slate-400 mt-2">The medication item may have been deleted or doesn\'t exist.</p>
        <Link href="/medicines" className="mt-6 inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-6 rounded-full transition-all">
          Back to Store
        </Link>
      </div>
    );
  }

  let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
  try {
    if (medicine.images) imagesArr = JSON.parse(medicine.images);
  } catch (e) {}

  const price = Number(medicine.price);
  const discPrice = medicine.discountPrice ? Number(medicine.discountPrice) : null;
  const isOutOfStock = medicine.stock <= 0;

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Detail Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm">
          
          {/* Left: Product Images */}
          <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-6 relative min-h-[350px]">
            <img 
              src={imagesArr[0]} 
              alt={medicine.name} 
              className="object-contain max-h-[300px] mix-blend-multiply transition-transform hover:scale-105 duration-300"
            />
            {medicine.prescriptionRequired && (
              <div className="absolute top-4 left-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold py-1 px-3 rounded-lg flex items-center gap-1.5 shadow-sm">
                <AlertTriangle className="w-4 h-4" />
                Doctor Prescription Required (Rx)
              </div>
            )}
          </div>

          {/* Right: Product Meta & Adders */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-50 py-1 px-3.5 rounded-full w-max inline-block">
                {medicine.brand?.name || 'CIpla'}
              </span>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">{medicine.name}</h1>
              <p className="text-sm font-semibold text-slate-500 italic mt-1">{medicine.genericName}</p>
              
              <div className="flex items-center gap-6 mt-4 pb-4 border-b border-slate-100">
                <div className="text-xs text-slate-400">
                  Manufacturer: <strong className="text-slate-700">{medicine.manufacturer}</strong>
                </div>
                <div className="text-xs text-slate-400">
                  Category: <strong className="text-slate-700">{medicine.categoryDetail?.name || 'Otc'}</strong>
                </div>
              </div>

              {/* Composition */}
              <div className="mt-5 space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Composition</h4>
                <p className="text-sm font-semibold text-slate-800">{medicine.composition}</p>
              </div>

              {/* Price & Savings */}
              <div className="mt-6">
                <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Pricing</span>
                <div className="flex items-baseline gap-3 mt-1">
                  {discPrice ? (
                    <>
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-950">₹{discPrice.toFixed(2)}</span>
                      <span className="text-slate-400 line-through text-sm">₹{price.toFixed(2)}</span>
                      <span className="text-emerald-600 text-xs font-bold bg-emerald-50 py-0.5 px-2 rounded-lg border border-emerald-100">
                        Save {Math.round(((price - discPrice) / price) * 100)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-950">₹{price.toFixed(2)}</span>
                  )}
                </div>
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

        {/* Tab-based detail breakdowns */}
        <div className="mt-12 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm">
          <div className="flex border-b border-slate-100 pb-2 mb-6 gap-6 text-sm font-semibold text-slate-400">
            <button 
              onClick={() => setActiveTab('info')} 
              className={`pb-3 border-b-2 transition-all ${activeTab === 'info' ? 'border-brand-600 text-slate-900 font-bold' : 'border-transparent'}`}
            >
              Dosage & Warnings
            </button>
            <button 
              onClick={() => setActiveTab('sideEffects')} 
              className={`pb-3 border-b-2 transition-all ${activeTab === 'sideEffects' ? 'border-brand-600 text-slate-900 font-bold' : 'border-transparent'}`}
            >
              Side Effects
            </button>
            <button 
              onClick={() => setActiveTab('reviews')} 
              className={`pb-3 border-b-2 transition-all ${activeTab === 'reviews' ? 'border-brand-600 text-slate-900 font-bold' : 'border-transparent'}`}
            >
              Customer Reviews ({medicine.reviews?.length || 0})
            </button>
          </div>

          <div className="text-sm text-slate-500 leading-relaxed">
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5"><Info className="w-4 h-4 text-brand-600" /> Usage Directions</h4>
                  <p className="mt-1.5 pl-6">{medicine.dosage || 'Please take as recommended by medical professional.'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-600" /> Storage Directives</h4>
                  <p className="mt-1.5 pl-6">{medicine.storageInstructions || 'Store in dry condition away from sunlight.'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5"><HelpCircle className="w-4 h-4 text-brand-600" /> General Description</h4>
                  <p className="mt-1.5 pl-6">{medicine.description || 'Clinical formula targeted for chronic/OTC diagnostics.'}</p>
                </div>
              </div>
            )}

            {activeTab === 'sideEffects' && (
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 text-rose-600"><AlertTriangle className="w-4 h-4 text-rose-500" /> Precautions & Possible Side Effects</h4>
                <p className="mt-2 pl-6">{medicine.sideEffects || 'Mild nausea, sleepiness, or stomach aches. Consult your physician if issues persist.'}</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {!medicine.reviews || medicine.reviews.length === 0 ? (
                  <p className="text-slate-400 italic">No reviews written for this product yet.</p>
                ) : (
                  medicine.reviews.map((rev) => (
                    <div key={rev.id} className="pb-5 border-b border-slate-50 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 font-extrabold text-xs flex items-center justify-center uppercase">
                        {rev.user?.name ? rev.user.name[0] : 'C'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-slate-900 text-sm">{rev.user?.name || 'Anonymous Patient'}</h5>
                          <div className="flex items-center text-amber-500 gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 fill-current ${i < rev.rating ? 'opacity-100' : 'opacity-20'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">{rev.comment}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

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
