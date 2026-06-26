'use client';

import React, { useState } from 'react';
import { 
  Trash2, AlertCircle, FileText, CheckCircle, Upload, ArrowRight, ArrowLeft, Percent, ShieldCheck, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function CartPage() {
  const { 
    cartItems, addToCart, removeFromCart, updateQuantity, subtotal, savings, gstAmount, totalAmount, 
    requiresPrescription, couponCode, applyCoupon, removeCoupon 
  } = useCart();
  const { user } = useAuth();
  
  // States
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionId, setPrescriptionId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [showScanResults, setShowScanResults] = useState(false);

  const addScannedToCart = (med: any) => {
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

  const addAllScannedToCart = () => {
    scanResults.forEach((med) => {
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
    });
    alert('All scanned medicines added to cart!');
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = promoInput.trim().toUpperCase();
    
    if (['WELCOME10', 'HEALTH20', 'FLAT50'].includes(code)) {
      applyCoupon(code);
      setPromoInput('');
    } else {
      setPromoError('Invalid coupon code. Try WELCOME10.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPrescriptionFile(e.target.files[0]);
      setUploadSuccess(false);
      setPrescriptionId(null);
    }
  };

  const handlePrescriptionUpload = async () => {
    if (!prescriptionFile) {
      alert('Please choose a file to upload first.');
      return;
    }

    if (!user) {
      alert('Authentication Required: Please sign in to upload prescriptions.');
      return;
    }

    setUploading(true);
    setIsScanning(true);
    setScanResults([]);
    setShowScanResults(false);
    try {
      const formData = new FormData();
      formData.append('prescription', prescriptionFile);

      const res = await api.post('/prescriptions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setPrescriptionId(res.data.data.id);
        setUploadSuccess(true);
        sessionStorage.setItem('attachedPrescriptionId', res.data.data.id.toString());
        
        if (res.data.extractedMedicines && res.data.extractedMedicines.length > 0) {
          setScanResults(res.data.extractedMedicines);
          setShowScanResults(true);
        }
      } else {
        alert('Upload failed: ' + res.data?.message);
      }
    } catch (err: any) {
      alert('Upload error: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      setIsScanning(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32 text-center flex flex-col items-center">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-8 text-slate-300">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your bag is empty.</h3>
        <p className="text-slate-500 mt-4 font-medium max-w-sm">
          Let's find some genuine healthcare products to fill it up.
        </p>
        <Link href="/medicines" className="mt-10 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-full transition-all flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Review Bag</h1>
          <span className="text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            {cartItems.length} items
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: CART ITEMS & PRESCRIPTION */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Cart Items List */}
            <div className="bg-white rounded-[2rem] border border-slate-100/50 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
              <AnimatePresence>
                {cartItems.map((item) => {
                  const discPrice = item.discountPrice ? Number(item.discountPrice) : null;
                  const price = Number(item.price);

                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={item.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-50 last:border-0 last:pb-0 gap-4"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-slate-50 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100/50">
                          <img src={item.image} alt={item.name} className="object-contain max-h-16 mix-blend-multiply p-2" />
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-slate-900 text-base leading-tight hover:text-brand-600 transition-colors">
                            <Link href={`/medicines/${item.id}`}>{item.name}</Link>
                          </h4>
                          
                          <div className="flex items-center gap-3 mt-2">
                            {item.prescriptionRequired && (
                              <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-rose-100/50">
                                <AlertCircle className="w-3 h-3" />
                                Rx Req
                              </span>
                            )}
                            <span className="text-xs font-semibold text-slate-400">
                              Unit: ₹{(discPrice || price).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        {/* Quantity Selector Minimal */}
                        <div className="flex items-center bg-slate-50 rounded-full py-1.5 px-3 border border-slate-100">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-slate-400 hover:text-slate-900 font-bold px-2 text-lg leading-none">-</button>
                          <span className="px-3 font-bold text-slate-900 text-sm w-8 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-slate-400 hover:text-slate-900 font-bold px-2 text-lg leading-none">+</button>
                        </div>

                        {/* Total */}
                        <div className="text-right min-w-[70px]">
                          <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                            ₹{((discPrice || price) * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        {/* Delete */}
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* PRESCRIPTION ATTACHMENT */}
            {(requiresPrescription || !user) && (
              <div className="bg-brand-50/50 rounded-[2rem] border border-brand-100/50 p-8 space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      {requiresPrescription ? 'Upload Prescription (Required)' : 'AI Prescription Scanner'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium leading-relaxed max-w-md">
                      {requiresPrescription 
                        ? 'Your bag contains Rx-required medicines. Please upload a valid doctor prescription to proceed.'
                        : 'Upload a prescription and our AI will instantly extract and match the medicines to our catalog.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 w-full relative">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                      className="w-full text-sm text-slate-500 bg-white border border-brand-200 rounded-full py-2 px-4 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:bg-brand-100 file:text-brand-700 file:font-bold hover:file:bg-brand-200 transition-all outline-none"
                    />
                  </div>
                  {prescriptionFile && (
                    <button
                      onClick={handlePrescriptionUpload}
                      disabled={uploading || uploadSuccess}
                      className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-3 px-8 rounded-full flex items-center gap-2 transition-all shadow-sm w-full sm:w-auto justify-center disabled:opacity-50"
                    >
                      {uploading ? 'Processing...' : uploadSuccess ? 'Verified' : 'Upload'}
                      {uploadSuccess ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Upload className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {uploadSuccess && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 text-emerald-800 text-xs font-bold p-4 rounded-2xl flex items-center gap-2 border border-emerald-100">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Prescription attached successfully (ID: {prescriptionId}). Valid for checkout.
                  </motion.div>
                )}

                {/* AI Scanner Loading State */}
                {isScanning && (
                  <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 relative overflow-hidden border border-brand-100">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-100/0 via-brand-200/30 to-brand-100/0 w-[200%] animate-[shimmer_2s_infinite]" style={{ transform: 'translateX(-50%)' }} />
                    <Sparkles className="w-6 h-6 text-brand-500 animate-pulse relative z-10" />
                    <span className="text-sm font-bold text-slate-700 relative z-10 animate-pulse">MrMed AI is extracting medicines...</span>
                  </div>
                )}

                {/* AI Scan Results */}
                {showScanResults && scanResults.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 border border-brand-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
                        </span>
                        AI Extracted Matches
                      </h4>
                      <button 
                        onClick={addAllScannedToCart}
                        className="text-brand-600 hover:text-brand-700 font-bold text-xs bg-brand-50 py-1.5 px-4 rounded-full"
                      >
                        Add All to Bag
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {scanResults.map((med) => {
                        let img = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250';
                        try { if (med.images) img = JSON.parse(med.images)[0]; } catch (e) {}
                        const isAlreadyInCart = cartItems.some(item => item.id === med.id);

                        return (
                          <div key={med.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-100 flex-shrink-0 overflow-hidden">
                                <img src={img} className="object-contain max-h-8 p-1 mix-blend-multiply" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-bold text-slate-900 text-xs truncate">{med.name}</h5>
                                <span className="text-slate-500 text-xs font-semibold block">₹{Number(med.price).toFixed(2)}</span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => addScannedToCart(med)}
                              disabled={isAlreadyInCart}
                              className={`font-bold text-xs py-1.5 px-3 rounded-full transition-all ${
                                isAlreadyInCart 
                                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                  : 'bg-slate-900 text-white hover:scale-105'
                              }`}
                            >
                              {isAlreadyInCart ? 'Added' : 'Add'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: INVOICE & PROMOS */}
          <div className="space-y-6">
            
            <div className="bg-white rounded-[2rem] border border-slate-100/50 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
              
              {/* Coupon Widget */}
              <div>
                <h3 className="font-extrabold text-slate-900 text-base mb-4 tracking-tight">Promo Code</h3>
                {couponCode ? (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm p-4 rounded-2xl flex items-center justify-between font-bold">
                    <span className="flex items-center gap-2">
                      <Percent className="w-5 h-5 text-emerald-600" />
                      {couponCode} Applied
                    </span>
                    <button onClick={removeCoupon} className="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded">Remove</button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm font-bold rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-500/20 uppercase placeholder:normal-case placeholder:font-medium placeholder:text-slate-400"
                    />
                    <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 px-6 rounded-full transition-all">
                      Apply
                    </button>
                  </form>
                )}
                {promoError && <p className="text-rose-500 text-xs mt-2 font-bold px-2">{promoError}</p>}
              </div>

              <hr className="border-slate-100" />

              {/* Price Breakdown */}
              <div>
                <h3 className="font-extrabold text-slate-900 text-base mb-4 tracking-tight">Order Summary</h3>
                
                <div className="space-y-3 text-sm font-semibold text-slate-500">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-slate-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>- ₹{savings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated GST (18%)</span>
                    <span className="text-slate-900">₹{gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-slate-900">{(subtotal - savings) > 500 ? 'Free' : '₹50.00'}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="font-extrabold text-slate-900 text-lg">Total</span>
                  <span className="font-black text-slate-900 text-2xl tracking-tight">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              {requiresPrescription && !prescriptionId ? (
                <button
                  disabled
                  className="w-full bg-slate-100 text-slate-400 font-bold py-4 rounded-full flex items-center justify-center gap-2 text-sm cursor-not-allowed border border-slate-200"
                >
                  Upload Rx to Checkout
                </button>
              ) : (
                <Link
                  href={user ? "/checkout" : "#"}
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      alert('Please sign in to proceed with checkout.');
                      const signInBtn = document.querySelector('button[class*="bg-slate-900"]');
                      if (signInBtn) (signInBtn as HTMLButtonElement).click();
                    }
                  }}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 text-sm transition-all text-center shadow-lg shadow-brand-500/20"
                >
                  Secure Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
