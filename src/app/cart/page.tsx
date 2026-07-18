'use client';

import React, { useState } from 'react';
import { 
  Trash2, AlertCircle, FileText, CheckCircle, Upload, ArrowRight, ArrowLeft, Percent, ShieldCheck, Sparkles, ChevronDown, ChevronUp, X
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';

export default function CartPage() {
  const { 
    cartItems, addToCart, removeFromCart, updateQuantity, subtotal, savings, gstAmount, totalAmount, 
    requiresPrescription, couponCode, applyCoupon, removeCoupon, couponDiscount
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
  const [showAdditionalCharges, setShowAdditionalCharges] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const addScannedToCart = (medObj: any) => {
    const med = medObj.product || medObj;
    if (!med) return;
    
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
      quantity: medObj.extracted?.quantity || 1
    });
    toast.success(`${med.name} added to cart!`);
  };

  const addAllScannedToCart = () => {
    let count = 0;
    scanResults.forEach((medObj) => {
      const med = medObj.product || medObj;
      if (!med) return;
      
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
        quantity: medObj.extracted?.quantity || 1
      });
      count++;
    });
    if (count > 0) toast.success(`All ${count} scanned medicines added to cart!`);
  };

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    if (!promoInput.trim()) return;
    const code = promoInput.trim().toUpperCase();
    
    try {
      // Calculate cart total without shipping
      const taxableAmount = cartItems.reduce((acc, item) => {
        const p = item.discountPrice || item.price;
        return acc + (p * item.quantity);
      }, 0);

      const res = await api.post('/coupons/verify', { code, cartTotal: taxableAmount });
      if (res.data?.success) {
        applyCoupon(code, res.data.data);
        setPromoInput('');
        toast.success(`${code} applied!`);
      } else {
        setPromoError(res.data?.message || 'Invalid coupon code.');
      }
    } catch (err: any) {
      setPromoError(err.response?.data?.message || 'Failed to apply coupon.');
    }
  };

  const handleFileSelection = (file: File) => {
    setPrescriptionFile(file);
    setUploadSuccess(false);
    setPrescriptionId(null);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setPrescriptionFile(null);
    setPreviewUrl(null);
    setUploadSuccess(false);
    setPrescriptionId(null);
  };

  const handlePrescriptionUpload = async () => {
    if (!prescriptionFile) {
      toast.error('Please choose a file to upload first.');
      return;
    }

    if (!user) {
      toast.error('Please sign in to upload prescriptions.');
      return;
    }

    setUploading(true);
    setIsScanning(true);
    setScanResults([]);
    setShowScanResults(false);
    try {
      const formData = new FormData();
      formData.append('file', prescriptionFile);

      const res = await api.post('/prescriptions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        const resultData = res.data.data || {};
        const prescId = resultData.prescription?.id || resultData.id;
        const prescStatus = resultData.status || resultData.prescription?.status;

        if (prescId) {
          setPrescriptionId(prescId);
          setUploadSuccess(true);
          sessionStorage.setItem('attachedPrescriptionId', prescId.toString());
          if (prescStatus) {
             sessionStorage.setItem('attachedPrescriptionStatus', prescStatus);
          }
        } else {
          toast.error('Upload succeeded but no prescription ID was returned.');
        }
        
        const extracted = resultData.medicines || res.data.extractedMedicines;
        if (extracted && extracted.length > 0) {
          setScanResults(extracted);
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
                          <img src={item.image} alt={item.name} className="object-cover  mix-blend-multiply " />
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-slate-900 text-base leading-tight hover:text-brand-600 transition-colors">
                            <Link href={`/medicines/detail?id=${item.id}`}>{item.name}</Link>
                          </h4>
                          
                          <div className="flex items-center gap-3 mt-2">
                            {item.prescriptionRequired && (
                              <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-rose-100/50">
                                <AlertCircle className="w-3 h-3" />
                                Rx Req
                              </span>
                            )}
                            <span className="text-xs font-semibold text-slate-400">
                              Unit: ₹{formatCurrency((discPrice || price))}
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
                            ₹{formatCurrency(((discPrice || price) * item.quantity))}
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

                <div className="flex flex-col space-y-4">
                  {!prescriptionFile ? (
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isDragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                    >
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center gap-3">
                        <Upload className={`w-8 h-8 ${isDragging ? 'text-brand-500' : 'text-slate-400'}`} />
                        <p className="text-sm font-semibold text-slate-700">
                          Drag & drop your prescription here or <span className="text-brand-600">click to browse</span>
                        </p>
                        <p className="text-xs font-medium text-slate-500">
                          Supported formats: JPG, PNG, PDF (Max 5MB)<br/>
                          Make sure the Doctor's name and Patient's name are clearly visible.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <p className="text-sm font-bold text-slate-800 truncate">{prescriptionFile.name}</p>
                        <p className="text-xs font-medium text-slate-500">{(prescriptionFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                        <button
                          onClick={clearFile}
                          className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          Change
                        </button>
                        <button
                          onClick={handlePrescriptionUpload}
                          disabled={uploading || uploadSuccess}
                          className="flex-1 sm:flex-none bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-2 px-6 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                        >
                          {uploading ? 'Processing...' : uploadSuccess ? 'Verified' : 'Upload'}
                          {uploadSuccess ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Upload className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {uploadSuccess && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 text-emerald-800 text-xs font-bold p-4 rounded-2xl flex items-center gap-2 border border-emerald-100">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Prescription uploaded. Awaiting pharmacist approval.
                  </motion.div>
                )}

                {/* AI Scanner Loading State */}
                {isScanning && (
                  <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 relative overflow-hidden border border-brand-100">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-100/0 via-brand-200/30 to-brand-100/0 w-[200%] animate-[shimmer_2s_infinite]" style={{ transform: 'translateX(-50%)' }} />
                    <Sparkles className="w-6 h-6 text-brand-500 animate-pulse relative z-10" />
                    <span className="text-sm font-bold text-slate-700 relative z-10 animate-pulse">DoseBox AI is extracting medicines...</span>
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
                      {scanResults.map((medObj, idx) => {
                        const med = medObj.product || medObj;
                        if (!med) return null;
                        
                        let img = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250';
                        try { 
                          if (med.images) {
                            const parsed = JSON.parse(med.images);
                            if (parsed && parsed.length > 0) img = parsed[0];
                          } 
                        } catch (e) {}
                        
                        const isAlreadyInCart = cartItems.some(item => item.id === med.id);

                        return (
                          <div key={`scanned-${med.id || idx}`} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-100 flex-shrink-0 overflow-hidden">
                                <img src={img} className="object-contain max-h-8 p-1 mix-blend-multiply" />
                              </div>
                              <div className="min-w-0 flex flex-col justify-center">
                                {medObj.extracted?.medicineName && (
                                  <span className="text-[9px] uppercase font-bold text-brand-600 block mb-0.5 truncate bg-brand-50 px-1.5 py-0.5 rounded-sm w-fit border border-brand-100">
                                    Rx: {medObj.extracted.medicineName} {medObj.extracted.strength || ''}
                                  </span>
                                )}
                                <h5 className="font-bold text-slate-900 text-xs truncate leading-tight mt-0.5">{med.name}</h5>
                                <span className="text-slate-500 text-[11px] font-semibold block mt-0.5">₹{formatCurrency(Number(med.discountPrice || med.price))}</span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => addScannedToCart(medObj)}
                              disabled={isAlreadyInCart}
                              className={`font-bold text-xs py-1.5 px-4 rounded-full transition-all shrink-0 ${
                                isAlreadyInCart 
                                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                  : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-500/20'
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
                    <span>Total MRP</span>
                    <span className="text-slate-900">₹{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Dosebox Discount</span>
                    <span>- ₹{formatCurrency(savings)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-indigo-600 font-bold">
                      <span>Promo Discount ({couponCode})</span>
                      <span>- ₹{formatCurrency(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Cart Total</span>
                    <span className="text-slate-900">₹{formatCurrency(subtotal - savings)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 mt-2 space-y-3">
                    <div className="flex justify-between">
                      <span>GST (18%)</span>
                      <span className="text-slate-900">₹{formatCurrency(gstAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charges</span>
                      <span className="text-slate-900">{(subtotal - savings) > 500 ? 'Free' : '₹50.00'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="font-extrabold text-slate-900 text-lg">Order Total</span>
                  <span className="font-black text-slate-900 text-2xl tracking-tight">₹{formatCurrency(totalAmount)}</span>
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
              ) : requiresPrescription && prescriptionId && sessionStorage.getItem('attachedPrescriptionStatus') !== 'Approved' && sessionStorage.getItem('attachedPrescriptionStatus') !== 'Verified' ? (
                <button
                  disabled
                  className="w-full bg-amber-100 text-amber-700 font-bold py-4 rounded-full flex items-center justify-center gap-2 text-sm cursor-not-allowed border border-amber-200"
                >
                  Awaiting Admin Approval
                </button>
              ) : (
                <Link
                  href={user ? "/checkout" : "#"}
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      toast.error('Please sign in to proceed with checkout.');
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

