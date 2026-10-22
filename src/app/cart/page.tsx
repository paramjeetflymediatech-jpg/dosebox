'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trash2, AlertCircle, FileText, CheckCircle, Upload, ArrowRight, ArrowLeft, Percent, ShieldCheck, Sparkles, ChevronDown, ChevronUp, ChevronRight, X,
  Tag, Ticket, Gift, Check, Copy, Loader2, CheckCircle2, ShoppingCart, CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { showSignInRequired, showAddedToCart, showSuccess } from '@/lib/sweetalert';

export default function CartPage() {
  const { 
    cartItems, addToCart, removeFromCart, updateQuantity, subtotal, savings, gstAmount, totalAmount, 
    requiresPrescription, couponCode, applyCoupon, removeCoupon, couponDiscount
  } = useCart();
  const { user } = useAuth();
  
  // States
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showOffersDrawer, setShowOffersDrawer] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [isSavingsExpanded, setIsSavingsExpanded] = useState(false);

  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionId, setPrescriptionId] = useState<number | null>(null);
  const [prescriptionStatus, setPrescriptionStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [showScanResults, setShowScanResults] = useState(false);
  const [showAdditionalCharges, setShowAdditionalCharges] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  // Force scroll to top on mount
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Immediate scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Fallbacks to handle hydration and dynamic height layout renders
    const timer1 = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 50);

    const timer2 = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 150);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const savedId = localStorage.getItem('attachedPrescriptionId');
    const savedStatus = localStorage.getItem('attachedPrescriptionStatus');
    if (savedId) {
      setPrescriptionId(parseInt(savedId, 10));
      setUploadSuccess(true);
      if (savedStatus) setPrescriptionStatus(savedStatus);
      
      // Fetch latest status
      api.get(`/prescriptions/${savedId}`).then(res => {
        if (res.data?.success && res.data.data?.status) {
           const newStatus = res.data.data.status;
           setPrescriptionStatus(newStatus);
           localStorage.setItem('attachedPrescriptionStatus', newStatus);
        }
      }).catch(err => console.error("Error fetching prescription status:", err));
    }

    const handleUnlink = () => {
      setPrescriptionId(null);
      setPrescriptionStatus(null);
      setUploadSuccess(false);
      setPrescriptionFile(null);
      setPreviewUrl(null);
    };
    window.addEventListener('prescription_unlinked', handleUnlink);
    return () => window.removeEventListener('prescription_unlinked', handleUnlink);
  }, []);

  // Fetch active promotional coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await api.get('/coupons');
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setAvailableCoupons(res.data.data);
        } else {
          throw new Error('No coupons');
        }
      } catch (e) {
        setAvailableCoupons([
          {
            id: 1,
            code: 'DOSEBOX10',
            discountType: 'Percentage',
            discountValue: 10,
            minOrderValue: 499,
            maxDiscount: 150,
            description: 'Flat 10% OFF up to ₹150 on essential & chronic medicines'
          },
          {
            id: 2,
            code: 'FLAT100',
            discountType: 'Fixed',
            discountValue: 100,
            minOrderValue: 999,
            maxDiscount: 100,
            description: 'Flat ₹100 instant cash discount on orders above ₹999'
          },
          {
            id: 3,
            code: 'HEALTHCARE15',
            discountType: 'Percentage',
            discountValue: 15,
            minOrderValue: 1499,
            maxDiscount: 300,
            description: '15% savings on all verified prescription medications'
          }
        ]);
      }
    };
    fetchCoupons();
  }, []);

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
    showAddedToCart(med.name);
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
    if (count > 0) showSuccess('Added to Cart!', `All ${count} scanned medicines added to cart!`);
  };

  const applyCouponByCode = async (codeToApply: string) => {
    setPromoError('');
    if (!codeToApply.trim()) return;
    const code = codeToApply.trim().toUpperCase();
    setIsApplyingPromo(true);

    try {
      const taxableAmount = cartItems.reduce((acc, item) => {
        const p = item.discountPrice || item.price;
        return acc + (p * item.quantity);
      }, 0);

      const res = await api.post('/coupons/verify', { code, cartTotal: taxableAmount });
      if (res.data?.success) {
        applyCoupon(code, res.data.data);
        setPromoInput('');
        setShowOffersDrawer(false);
        toast.success(`Coupon ${code} applied successfully! `);
      } else {
        setPromoError(res.data?.message || 'Invalid coupon code.');
      }
    } catch (err: any) {
      setPromoError(err.response?.data?.message || 'Failed to apply coupon.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    await applyCouponByCode(promoInput);
  };

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard?.writeText(code);
      setCopiedCode(code);
      toast.success(`Code ${code} copied!`);
      setTimeout(() => setCopiedCode(null), 2500);
    } catch (e) {
      toast.success(`Code: ${code}`);
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
          localStorage.setItem('attachedPrescriptionId', prescId.toString());
          if (prescStatus) {
             localStorage.setItem('attachedPrescriptionStatus', prescStatus);
             setPrescriptionStatus(prescStatus);
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

  if (!isMounted) return null;

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

  const prescriptionItemCount = cartItems.filter(i => i.prescriptionRequired).length;

  return (
    <div className="bg-[#F7F8FA] min-h-screen py-8">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-5">
          <Link href="/" className="hover:text-slate-800 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-700 font-medium">Cart</span>
        </div>

        {/* Header Row — matches reference */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
            </h1>
          </div>
          <Link
            href="/medicines"
            className="flex items-center gap-1.5 text-sm font-bold text-[#1F5C52] bg-[#EAF4F2] hover:bg-[#D4ECE7] px-4 py-2 rounded-full transition-colors"
          >
            Add more items
            <span className="w-5 h-5 bg-[#1F5C52] text-white rounded-full flex items-center justify-center text-xs font-black">+</span>
          </Link>
        </div>

        {/* Prescription items notice — matches reference */}
        {prescriptionItemCount > 0 && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-6">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-blue-800">
              <span className="font-extrabold">{prescriptionItemCount} Prescription</span> {prescriptionItemCount === 1 ? 'Item' : 'Items'} in your cart
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT: CART ITEMS & PRESCRIPTION */}
          <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-[156px] self-start">
            
            {/* Cart Items — one card per item like reference */}
            <AnimatePresence>
              {cartItems.map((item) => {
                const discPrice = item.discountPrice ? Number(item.discountPrice) : null;
                const price = Number(item.price);
                const effectivePrice = discPrice || price;
                const hasDiscount = discPrice && discPrice < price;
                const discountPct = hasDiscount ? Math.round(((price - discPrice) / price) * 100) : 0;

                const manufacturerName = item.manufacturer || item.brandName || "GENUINE PHARMA";
                const packDetails = item.packSize || "1 UNIT / PACK";
                const saltComposition = item.composition || item.genericName;

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 transition-all hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* LEFT: Image Column + Badges + Middle Info */}
                      <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
                        {/* Image Column with Badges — Matches Reference Exactly */}
                        <div className="flex flex-col items-center shrink-0 w-20 sm:w-22">
                          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-center p-2 overflow-hidden shadow-2xs">
                            <img
                              src={item.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'}
                              alt={item.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250';
                              }}
                              className="object-contain mix-blend-multiply w-full h-full"
                            />
                          </div>

                          {/* Green Discount Pill (Like Reference: 60% Off in light green) */}
                          {hasDiscount && discountPct > 0 && (
                            <span className="w-full text-center mt-1.5 bg-[#E8F8F0] border border-emerald-200 text-[#16A34A] text-[10px] sm:text-[11px] font-black py-0.5 rounded-md leading-tight">
                              {discountPct}% Off
                            </span>
                          )}

                          {/* Prescription & Schedule/Cold Badges below image (Like Reference: purple R and blue H) */}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {item.prescriptionRequired && (
                              <span
                                className="w-5 h-5 rounded-full bg-[#5B21B6] text-white text-[9px] font-black flex items-center justify-center shadow-2xs"
                                title="Prescription Required"
                              >
                                R
                              </span>
                            )}
                            <span
                              className="w-5 h-5 rounded-full bg-[#0284C7] text-white text-[9px] font-black flex items-center justify-center shadow-2xs"
                              title={item.isColdChain ? "Cold Chain 2°C - 8°C" : "Schedule H Prescription Drug"}
                            >
                              {item.isColdChain ? "❄" : "H"}
                            </span>
                          </div>
                        </div>

                        {/* Middle: Title, By Manufacturer, Pack Size, Molecule */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug hover:text-[#1F5C52] transition-colors">
                            <Link href={`/medicines/detail?id=${item.id}`}>{item.name}</Link>
                          </h4>

                          {/* By Manufacturer */}
                          <p className="text-[11px] sm:text-xs text-slate-400 font-semibold uppercase mt-1 tracking-wide truncate">
                            By {manufacturerName.toUpperCase()}
                          </p>

                          {/* Pack Size */}
                          <p className="text-[11px] sm:text-xs text-slate-500 font-medium uppercase mt-0.5 truncate">
                            {packDetails.toUpperCase()}
                          </p>

                          {/* Molecule / Salt Composition */}
                          {saltComposition && (
                            <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase mt-1 tracking-wider truncate">
                              {saltComposition.toUpperCase()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* RIGHT (Desktop) / BOTTOM (Mobile): Quantity Stepper, Delete, and Price Block */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 shrink-0">
                        {/* Quantity Stepper */}
                        <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold text-base hover:bg-white rounded-lg transition-colors cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-7 text-center font-black text-slate-900 text-xs sm:text-sm">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-[#1F5C52] hover:bg-[#174a42] text-white rounded-lg font-bold text-sm shadow-2xs transition-colors cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Delete Button (Soft reddish container like reference) */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          title="Remove item"
                          className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Price Column (Bold price on top, strikethrough MRP underneath) */}
                        <div className="text-right min-w-[90px]">
                          <p className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                            ₹{formatCurrency(effectivePrice * item.quantity)}
                          </p>
                          {hasDiscount && (
                            <p className="text-xs text-slate-400 line-through font-medium">
                              MRP: ₹{formatCurrency(price * item.quantity)}
                            </p>
                          )}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* PRESCRIPTION ATTACHMENT */}
            {requiresPrescription && (
              <div className="bg-brand-50/50 rounded-[2rem] border border-brand-100/50 p-8 space-y-6">
                {uploadSuccess ? (
                  <div className="flex flex-col space-y-4">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        prescriptionStatus === 'Approved' || prescriptionStatus === 'Verified' ? 'bg-emerald-100 text-emerald-600' : 
                        prescriptionStatus === 'Rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {prescriptionStatus === 'Rejected' ? <AlertCircle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-lg">Prescription Status</h3>
                        <p className={`text-sm mt-1 font-bold ${
                          prescriptionStatus === 'Approved' || prescriptionStatus === 'Verified' ? 'text-emerald-600' : 
                          prescriptionStatus === 'Rejected' ? 'text-rose-600' : 'text-amber-600'
                        }`}>
                          {prescriptionStatus === 'Approved' || prescriptionStatus === 'Verified' 
                            ? 'Approved - You can proceed to checkout.'
                            : prescriptionStatus === 'Rejected' 
                            ? 'Rejected - Please upload a valid prescription.'
                            : 'Awaiting Admin Approval'}
                        </p>
                        {prescriptionFile && (
                          <p className="text-xs text-slate-500 mt-2 font-medium">Uploaded: {prescriptionFile.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-start pl-16">
                      <button 
                        onClick={() => { 
                          clearFile(); 
                          localStorage.removeItem('attachedPrescriptionId'); 
                          localStorage.removeItem('attachedPrescriptionStatus'); 
                        }} 
                        className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 bg-white border border-slate-200 py-1.5 px-3 rounded-lg shadow-sm"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove & Upload New
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                              disabled={uploading}
                              className="flex-1 sm:flex-none bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-2 px-6 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                            >
                              {uploading ? 'Processing...' : 'Upload'}
                              <Upload className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
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
                                  <span className="text-[9px] uppercase font-bold text-brand-600 inline-block max-w-full mb-0.5 truncate bg-brand-50 px-1.5 py-0.5 rounded-sm border border-brand-100">
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

          {/* RIGHT: PRICE SUMMARY — Matches Reference */}
          <div className="space-y-4 lg:sticky lg:top-[156px] self-start">

            {/* 3-Step Checkout Stepper — Matches Reference */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1F5C52] text-white flex items-center justify-center shadow-xs font-bold text-xs">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-[#1F5C52]">Cart</span>
              </div>
              <div className="flex-1 h-0.5 bg-slate-200 mx-2 sm:mx-3"></div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">
                  ℞
                </div>
                <span className="text-xs font-medium text-slate-400 hidden sm:inline">Prescription</span>
              </div>
              <div className="flex-1 h-0.5 bg-slate-200 mx-2 sm:mx-3"></div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-slate-400 hidden sm:inline">Payment</span>
              </div>
            </div>

            {/* Need Support — matches reference top icons */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">Need Support?</span>
              <div className="flex items-center gap-3">
                <a href="tel:+919876543210" className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#1F5C52] hover:bg-[#EAF4F2] transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
                </a>
                <a href="https://wa.me/919876543210" target="_blank" className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-green-500 hover:bg-green-50 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.054 23.25a.75.75 0 00.917.917l5.532-1.476A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 01-5.175-1.448l-.372-.22-3.852 1.028 1.037-3.75-.242-.386A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                </a>
                <a href="mailto:support@dosebox.in" className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                </a>
              </div>
            </div>

            {/* Price Summary Card — dashed border like reference */}
            <div className="bg-white rounded-2xl border-2 border-dashed border-[#1F5C52]/30 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <svg className="w-4 h-4 text-[#1F5C52]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <h3 className="font-extrabold text-slate-900 text-sm">Price Details</h3>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between font-medium text-slate-500">
                  <span>Total MRP</span>
                  <span className="text-slate-800">₹{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>DoseBox Discount</span>
                  <span>-₹{formatCurrency(savings)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between font-bold text-indigo-600">
                    <span>Promo ({couponCode})</span>
                    <span>-₹{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Cart Total</span>
                  <span>₹{formatCurrency(subtotal - savings)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST (5%)</span>
                  <span className="text-slate-800">₹{formatCurrency(gstAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Charges</span>
                  <span className={(subtotal - savings) > 500 ? 'text-emerald-600 font-bold' : 'text-slate-800'}>
                    {(subtotal - savings) > 500 ? 'FREE' : '₹50.00'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="font-extrabold text-slate-900 text-base">Order Total</span>
                <span className="font-black text-[#1F5C52] text-xl tracking-tight">₹{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Savings Celebration Banner — Modern Interactive Card */}
            {(savings > 0 || couponDiscount > 0) && (
              <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-emerald-100/40 border border-emerald-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs transition-all overflow-hidden">
                <div 
                  onClick={() => setIsSavingsExpanded(!isSavingsExpanded)}
                  className="flex items-center justify-between cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-[#1F5C52] text-white flex items-center justify-center shadow-sm shadow-emerald-700/20 shrink-0 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-emerald-950 tracking-tight">
                          ₹{formatCurrency(savings + couponDiscount + ((subtotal - savings) > 500 ? 50 : 0))} Total Savings
                        </p>
                        {subtotal > 0 && (
                          <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            {Math.round(((savings + couponDiscount) / subtotal) * 100)}% OFF
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                        <span>Great! You unlocked huge pharmacy savings</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-white/70 hover:bg-white border border-emerald-200/70 px-2.5 py-1 rounded-xl shrink-0 transition-all ml-2">
                    <span className="hidden sm:inline">{isSavingsExpanded ? "Hide" : "Details"}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-emerald-700 transition-transform duration-200 ${isSavingsExpanded ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {/* Expandable Breakdown Drawer */}
                <AnimatePresence>
                  {isSavingsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 mt-3 border-t border-emerald-200/70 space-y-2 text-xs font-semibold text-emerald-900">
                        {savings > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-emerald-800 flex items-center gap-1.5 font-medium">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              DoseBox Direct Discount
                            </span>
                            <span className="font-extrabold text-emerald-700">
                              - ₹{formatCurrency(savings)}
                            </span>
                          </div>
                        )}

                        {couponDiscount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-emerald-800 flex items-center gap-1.5 font-medium">
                              <Tag className="w-3.5 h-3.5 text-emerald-600" />
                              Coupon Applied ({couponCode})
                            </span>
                            <span className="font-extrabold text-emerald-700">
                              - ₹{formatCurrency(couponDiscount)}
                            </span>
                          </div>
                        )}

                        {(subtotal - savings) > 500 && (
                          <div className="flex justify-between items-center">
                            <span className="text-emerald-800 flex items-center gap-1.5 font-medium">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Free Standard Delivery
                            </span>
                            <span className="font-extrabold text-emerald-700">
                              - ₹50.00
                            </span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-emerald-200/60 flex justify-between items-center text-emerald-950 font-black">
                          <span>Net Savings Breakdown</span>
                          <span className="text-sm text-emerald-800">
                            ₹{formatCurrency(savings + couponDiscount + ((subtotal - savings) > 500 ? 50 : 0))}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Offers Available Banner — Interactive trigger */}
            <div 
              onClick={() => setShowOffersDrawer(true)}
              className="group bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/60 border border-emerald-200/80 hover:border-emerald-300 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-sm hover:shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-emerald-700/20 group-hover:scale-105 transition-transform">
                  <Percent className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">
                      Offers & Coupons
                    </span>
                    <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      {availableCoupons.length} Available
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Tap to explore extra savings</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                <span>View All</span>
                <ChevronRight className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            {/* Promo Code Box — Dropdown Open/Close Tab */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-200">
              {/* Dropdown Header Tab */}
              <button
                type="button"
                onClick={() => setIsPromoOpen(!isPromoOpen)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left cursor-pointer"
                aria-expanded={isPromoOpen}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    couponCode ? 'bg-emerald-100 text-emerald-700' : 'bg-[#1F5C52]/10 text-[#1F5C52]'
                  }`}>
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-sm">Have a promo code?</h3>
                      {couponCode && (
                        <span className="font-mono text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded uppercase">
                          {couponCode} Applied
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      {couponCode ? `Saving ₹${formatCurrency(couponDiscount)} with this code` : 'Apply coupon code for extra discount'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* {!couponCode && (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOffersDrawer(true);
                      }}
                      className="hidden sm:inline-block text-xs font-bold text-[#1F5C52] hover:underline mr-1"
                    >
                      Browse Offers
                    </span>
                  )} */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 text-slate-500 transition-transform duration-200 ${
                    isPromoOpen ? 'rotate-180 bg-slate-200 text-slate-800' : ''
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Dropdown Content */}
              <AnimatePresence initial={false}>
                {isPromoOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="overflow-hidden border-t border-slate-100 bg-slate-50/50 p-4 space-y-3"
                  >
                    {couponCode ? (
                      /* Applied State - Ticket celebration badge */
                      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 border-2 border-dashed border-emerald-300 text-emerald-900 p-3.5 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sm tracking-wider uppercase text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                                {couponCode}
                              </span>
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                Applied
                              </span>
                            </div>
                            <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              You saved ₹{formatCurrency(couponDiscount)} on this order
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={removeCoupon} 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      /* Input Form */
                      <div className="space-y-3">
                        <form onSubmit={handleApplyPromo} className="relative flex items-center">
                          <div className="relative flex-1">
                            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="ENTER PROMO CODE"
                              value={promoInput}
                              onChange={(e) => {
                                setPromoInput(e.target.value);
                                if (promoError) setPromoError('');
                              }}
                              className="w-full bg-white border border-slate-200 hover:border-slate-300 text-slate-900 text-sm font-bold font-mono tracking-wider rounded-xl py-2.5 pl-10 pr-9 focus:outline-none focus:ring-2 focus:ring-[#1F5C52]/20 focus:border-[#1F5C52] uppercase placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400 transition-all"
                            />
                            {promoInput && (
                              <button
                                type="button"
                                onClick={() => setPromoInput('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <button 
                            type="submit" 
                            disabled={!promoInput.trim() || isApplyingPromo}
                            className="ml-2 bg-[#1F5C52] hover:bg-[#174a42] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm py-2.5 px-5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
                          >
                            {isApplyingPromo ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Checking</span>
                              </>
                            ) : (
                              'Apply'
                            )}
                          </button>
                        </form>

                        {/* Promo Error Message */}
                        {promoError && (
                          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2 rounded-xl">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                            <span>{promoError}</span>
                          </div>
                        )}

                        {/* Quick-Apply Popular Coupons */}
                        {availableCoupons.length > 0 && (
                          <div className="pt-2 border-t border-slate-200">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                              Recommended for you:
                            </p>
                            <div className="space-y-2">
                              {availableCoupons.slice(0, 2).map((coupon) => {
                                const orderVal = subtotal - savings;
                                const isEligible = orderVal >= Number(coupon.minOrderValue);
                                return (
                                  <div 
                                    key={coupon.code}
                                    className="bg-white hover:bg-emerald-50/50 border border-dashed border-slate-200 hover:border-emerald-300 rounded-xl p-2.5 flex items-center justify-between transition-colors text-left shadow-2xs"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-extrabold text-xs text-[#1F5C52] bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100 shadow-2xs">
                                          {coupon.code}
                                        </span>
                                        <span className="text-[11px] font-bold text-slate-700 truncate">
                                          {coupon.discountType === 'Percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                                        {coupon.description || `Min. order ₹${coupon.minOrderValue}`}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => applyCouponByCode(coupon.code)}
                                      disabled={isApplyingPromo}
                                      className="shrink-0 bg-white hover:bg-[#1F5C52] hover:text-white border border-[#1F5C52]/30 hover:border-[#1F5C52] text-[#1F5C52] font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-2xs active:scale-95 cursor-pointer"
                                    >
                                      Apply
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Checkout CTA — matches reference "Add Address" button */}
            {requiresPrescription && !prescriptionId ? (
              <button disabled className="w-full bg-slate-100 text-slate-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm cursor-not-allowed border border-slate-200">
                Upload Rx to Checkout
              </button>
            ) : requiresPrescription && prescriptionId && prescriptionStatus !== 'Approved' && prescriptionStatus !== 'Verified' ? (
              <button disabled className="w-full bg-amber-100 text-amber-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm cursor-not-allowed border border-amber-200">
                Awaiting Admin Approval
              </button>
            ) : (
              <Link
                href={user ? "/checkout" : "#"}
                onClick={(e) => {
                  if (!user) {
                    e.preventDefault();
                    showSignInRequired('Please sign in to proceed with checkout.', () => {
                      const signInBtn = document.querySelector('button[class*="bg-slate-900"]');
                      if (signInBtn) (signInBtn as HTMLButtonElement).click();
                    });
                  }
                }}
                className="w-full bg-[#1F5C52] hover:bg-[#174a42] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm transition-all shadow-lg shadow-[#1F5C52]/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Add Address
              </Link>
            )}
          </div>
        </div>

        {/* Slide-over Offers & Coupons Drawer */}
        <AnimatePresence>
          {showOffersDrawer && (
            <div className="fixed inset-0 z-50 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowOffersDrawer(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              />

              <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <motion.div 
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
                >
                  {/* Drawer Header */}
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Percent className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">Coupons & Offers</h3>
                        <p className="text-xs text-slate-500 font-medium">Available discounts for your order</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowOffersDrawer(false)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Drawer Body */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Enter Code Manual Input */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-xs font-bold text-slate-700 mb-2">Have another coupon code?</p>
                      <form 
                        onSubmit={(e) => {
                          handleApplyPromo(e);
                          setShowOffersDrawer(false);
                        }} 
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          placeholder="ENTER COUPON CODE"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#1F5C52]"
                        />
                        <button 
                          type="submit"
                          disabled={!promoInput.trim() || isApplyingPromo}
                          className="bg-[#1F5C52] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#174a42] disabled:opacity-50"
                        >
                          Apply
                        </button>
                      </form>
                    </div>

                    {/* List of active coupons */}
                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase text-slate-400 tracking-wider">
                        Available Offers ({availableCoupons.length})
                      </p>
                      {availableCoupons.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">No coupons available at the moment.</p>
                      ) : (
                        availableCoupons.map((coupon) => {
                          const isApplied = couponCode === coupon.code;
                          return (
                            <div 
                              key={coupon.code}
                              className={`p-4 rounded-2xl border transition-all ${
                                isApplied 
                                  ? 'bg-emerald-50/60 border-emerald-300' 
                                  : 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <span className="font-mono font-black text-sm text-[#1F5C52] bg-[#EAF4F2] px-2.5 py-1 rounded-md border border-emerald-200">
                                    {coupon.code}
                                  </span>
                                  <p className="text-xs font-bold text-emerald-700 mt-2">
                                    {coupon.discountType === 'Percentage' ? `${coupon.discountValue}% DISCOUNT` : `FLAT ₹${coupon.discountValue} OFF`}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {coupon.description || `Applicable on orders above ₹${coupon.minOrderValue}`}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    if (isApplied) {
                                      removeCoupon();
                                    } else {
                                      applyCouponByCode(coupon.code);
                                      setShowOffersDrawer(false);
                                    }
                                  }}
                                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors ${
                                    isApplied 
                                      ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                                      : 'bg-[#1F5C52] text-white hover:bg-[#174a42]'
                                  }`}
                                >
                                  {isApplied ? 'Remove' : 'Apply'}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

