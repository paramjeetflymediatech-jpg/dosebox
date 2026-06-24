'use client';

import React, { useState } from 'react';
import { 
  Trash2, AlertCircle, FileText, CheckCircle, Upload, ArrowRight, ArrowLeft, Percent, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
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
    
    // WELCOME10, HEALTH20, FLAT50
    if (['WELCOME10', 'HEALTH20', 'FLAT50'].includes(code)) {
      applyCoupon(code);
      setPromoInput('');
    } else {
      setPromoError('Invalid coupon code. Try WELCOME10 or HEALTH20.');
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
      alert('Authentication Required: Please sign in or register to upload and scan your doctor prescription.');
      const signInBtn = document.querySelector('button[class*="bg-brand-600"]');
      if (signInBtn) (signInBtn as HTMLButtonElement).click();
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
        // Save attached prescription in session storage for checkout retrieve
        sessionStorage.setItem('attachedPrescriptionId', res.data.data.id.toString());
        
        // Handle scan results
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
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
          <ShoppingBagIcon className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Your Shopping Cart is Empty</h3>
        <p className="text-slate-400 mt-2">Explore our extensive range of medicines and daily healthcare wellness items.</p>
        <Link href="/medicines" className="mt-8 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-8 rounded-full transition-all inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: CART ITEMS & PRESCRIPTION ATTACHMENT */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Cart list card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
              {cartItems.map((item) => {
                const discPrice = item.discountPrice ? Number(item.discountPrice) : null;
                const price = Number(item.price);

                return (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 last:border-0 last:pb-0 gap-4">
                    <div className="flex items-center gap-4">
                      {/* Image frame */}
                      <div className="w-16 h-16 rounded-xl bg-slate-50 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100">
                        <img src={item.image} alt={item.name} className="object-contain max-h-12 mix-blend-multiply" />
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight hover:underline">
                          <Link href={`/medicines/${item.id}`}>{item.name}</Link>
                        </h4>
                        
                        <div className="flex items-center gap-3 mt-1.5">
                          {item.prescriptionRequired && (
                            <span className="bg-rose-50 border border-rose-100 text-rose-600 text-xxs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Rx Required
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            Unit Price: <strong>₹{(discPrice || price).toFixed(2)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-slate-200 rounded-full py-1 px-2.5 bg-slate-50 text-xs font-bold text-slate-800">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-1.5 text-slate-500 hover:text-slate-900">-</button>
                        <span className="px-3.5">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-1.5 text-slate-500 hover:text-slate-900">+</button>
                      </div>

                      {/* Total */}
                      <div className="text-right flex-shrink-0 min-w-[70px]">
                        <span className="font-extrabold text-slate-900 text-sm">
                          ₹{((discPrice || price) * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {/* Delete */}
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PRESCRIPTION ATTACHMENT CARD */}
            {(requiresPrescription || !user) && (
              <div className="bg-white rounded-2xl border border-rose-150 p-6 shadow-sm space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      {requiresPrescription ? 'Prescription Required' : 'Have a Doctor Prescription?'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {requiresPrescription 
                        ? 'Your order contains medicines that legally require a doctor prescription. Please choose and upload a prescription file (.jpg, .png, .pdf) before placing order.'
                        : 'Upload and scan your doctor prescription here. Our AI will automatically extract matched medicines so you can add them to your cart instantly.'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="text-xs text-slate-500 border border-slate-200 rounded-xl p-2 bg-slate-50 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:font-bold hover:file:bg-brand-100 w-full sm:w-auto"
                  />

                  {prescriptionFile && (
                    <button
                      onClick={handlePrescriptionUpload}
                      disabled={uploading || uploadSuccess}
                      className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2 px-5 rounded-full flex items-center gap-1.5 transition-all shadow-sm w-full sm:w-auto justify-center"
                    >
                      {uploading ? 'Uploading...' : uploadSuccess ? 'Verified' : 'Upload File'}
                      {uploadSuccess ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Upload className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {uploadSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Prescription uploaded successfully (ID: {prescriptionId}). This will be sent to our pharmacist for review.
                  </div>
                )}

                {isScanning && (
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 relative overflow-hidden animate-pulse">
                    <div className="w-6 h-6 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
                    <span className="text-xxs font-extrabold text-slate-700 animate-pulse">🤖 MrMed AI Scanner is reading your prescription...</span>
                    {/* Scanning light animation bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-secondary animate-bounce" />
                  </div>
                )}

                {showScanResults && scanResults.length > 0 && (
                  <div className="bg-brand-50/20 border border-brand-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-brand-100/50 pb-2">
                      <div>
                        <h4 className="font-extrabold text-brand-900 text-xxs sm:text-xs flex items-center gap-1.5">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          AI Prescription Scan Results
                        </h4>
                        <p className="text-xxs text-slate-400 mt-0.5">We detected the following medicines in your prescription:</p>
                      </div>
                      <button 
                        onClick={addAllScannedToCart}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xxs py-1 px-3 rounded-full transition-all shadow"
                      >
                        Add All
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {scanResults.map((med) => {
                        let img = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250';
                        try {
                          if (med.images) img = JSON.parse(med.images)[0];
                        } catch (e) {}

                        const isAlreadyInCart = cartItems.some(item => item.id === med.id);

                        return (
                          <div key={med.id} className="bg-white border border-brand-100/50 p-2.5 rounded-lg flex items-center justify-between gap-2 shadow-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 flex-shrink-0">
                                <img src={img} className="object-contain max-h-6 mix-blend-multiply" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-bold text-slate-800 text-xxs truncate">{med.name}</h5>
                                <span className="text-slate-400 text-xxs block">₹{Number(med.price).toFixed(2)}</span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => addScannedToCart(med)}
                              disabled={isAlreadyInCart}
                              className={`font-extrabold text-xxs py-0.5 px-2 rounded-full transition-all border ${
                                isAlreadyInCart 
                                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                  : 'bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100'
                              }`}
                            >
                              {isAlreadyInCart ? 'Added' : 'Add'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: BILL BREAKDOWN & COUPONS */}
          <div className="space-y-6">
            
            {/* Coupon widget */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Apply Coupon Code</h3>
              
              {couponCode ? (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <Percent className="w-4.5 h-4.5 text-emerald-600" />
                    Code '{couponCode}' Applied!
                  </span>
                  <button onClick={removeCoupon} className="text-rose-600 hover:underline">Remove</button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. WELCOME10, HEALTH20"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:border-brand-500 focus:bg-white uppercase font-bold"
                  />
                  <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all">
                    Apply
                  </button>
                </form>
              )}
              {promoError && <p className="text-rose-600 text-xxs mt-2 font-bold">{promoError}</p>}
            </div>

            {/* Price breakdown card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base border-b border-slate-100 pb-3">Billing Invoice Summary</h3>
              
              <div className="space-y-2 text-xs sm:text-sm text-slate-500">
                <div className="flex justify-between">
                  <span>Cart Items Subtotal:</span>
                  <span className="font-semibold text-slate-700">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Medicine Discounts:</span>
                  <span>- ₹{savings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18% inclusive):</span>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges:</span>
                  <span>{(subtotal - savings) > 500 ? 'FREE' : '₹50.00'}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-between items-baseline">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">Grand Total:</span>
                <span className="font-black text-brand-700 text-lg sm:text-xl">₹{totalAmount.toFixed(2)}</span>
              </div>

              {/* Checkout link */}
              {requiresPrescription && !prescriptionId ? (
                <button
                  disabled
                  className="w-full bg-slate-300 text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-1.5 text-xs sm:text-sm shadow-inner cursor-not-allowed"
                >
                  Attach Prescription to Checkout
                </button>
              ) : (
                <Link
                  href={user ? "/checkout" : "#"}
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      alert('Please sign in to proceed with checkout.');
                      // Automatically show the auth modal event
                      const signInBtn = document.querySelector('button[class*="bg-brand-600"]');
                      if (signInBtn) (signInBtn as HTMLButtonElement).click();
                    }
                  }}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg shadow-brand-500/10 transition-all text-center"
                >
                  Proceed to Checkout
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

// Icon helper
function ShoppingBagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}
