'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Sparkles, X, RotateCcw, ChevronRight, ShieldCheck, Info, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

export default function UploadPrescriptionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<number, any>>({});
  const { addToCart } = useCart();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fake progress effect during upload
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isUploading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.floor(Math.random() * 10) + 5;
        });
      }, 500);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [isUploading]);

  const handleFileSelection = (file: File) => {
    setFile(file);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const startTime = Date.now();
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Please login to upload your prescription');
        setIsUploading(false);
        return;
      }

      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.status === 401) {
        toast.error('Your session has expired. Please log out and log back in.');
        localStorage.removeItem('accessToken');
        setIsUploading(false);
        return;
      }

      const data = await res.json();

      // Enforce a minimum of 4 seconds loading time for UI purposes
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 4000;
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      }

      if (data.success) {
        console.log('Upload result:', data);
        setResult(data.data);
        toast.success(data.message || 'Prescription uploaded!');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload prescription. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddVerifiedToCart = () => {
    if (!result || !result.medicines) return;
    let addedCount = 0;

    result.medicines.forEach((medItem: any, idx: number) => {
      // Auto add exact matches
      if (medItem.match?.matchType === 'Exact' && medItem.product) {
        addToCart({
          id: medItem.product.id,
          name: medItem.product.name,
          price: medItem.product.price,
          discountPrice: medItem.product.discountPrice,
          image: medItem.product.images?.[0] || '',
          quantity: medItem.extracted?.quantity || 1,
          prescriptionRequired: medItem.product.requiresPrescription || false
        });
        addedCount++;
      }
      // Add similar matches if variant selected
      else if (medItem.match?.matchType === 'Similar' && selectedVariants[idx]) {
        const product = selectedVariants[idx];
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          discountPrice: product.discountPrice,
          image: product.images?.[0] || '',
          quantity: medItem.extracted?.quantity || 1,
          prescriptionRequired: product.requiresPrescription || false
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} medicines to cart!`);
      router.push('/cart');
    } else {
      toast.error('No verified matches found or variants selected.');
    }
  };

  // Savings Logic
  const calculateTotalSavings = () => {
    if (!result || !result.medicines) return { totalMarket: 0, totalDosebox: 0, percentage: 0, savedAmount: 0 };
    let totalMarket = 0;
    let totalDosebox = 0;

    result.medicines.forEach((medItem: any, idx: number) => {
      let product = medItem.product;
      if (medItem.match?.matchType === 'Similar' && selectedVariants[idx]) {
        product = selectedVariants[idx];
      }
      if (product) {
        // Assume product.price is market price and discountPrice is dosebox price. 
        // If discountPrice is not set, fallback to price.
        const marketPrice = product.price || 0;
        const doseboxPrice = product.discountPrice || marketPrice;

        totalMarket += marketPrice * (medItem.extracted?.quantity || 1);
        totalDosebox += doseboxPrice * (medItem.extracted?.quantity || 1);
      }
    });

    const percentage = totalMarket > 0 ? Math.round(((totalMarket - totalDosebox) / totalMarket) * 100) : 0;
    return { totalMarket, totalDosebox, percentage, savedAmount: totalMarket - totalDosebox };
  };

  const savings = calculateTotalSavings();

  return (
    <div className="min-h-screen bg-brand-950/45 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-100" />
            <h2 className="text-lg font-semibold">Smart Prescription Analyzer</h2>
          </div>
          <Link href="/" className="text-brand-100 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </Link>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-6 md:p-8 flex-1">
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-16 h-16 text-brand-600 animate-spin mb-6" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Processing Document...</h3>
              <div className="bg-brand-50 text-brand-600 px-6 py-2 rounded-full text-sm font-medium border border-brand-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-full bg-brand-100/50 animate-pulse"></div>
                <span className="relative">Cross-matching chemical components in Dosebox Generic Database...</span>
              </div>

              {/* Progress Bar */}
              <div className="w-64 h-2 bg-slate-100 rounded-full mt-6 overflow-hidden relative">
                <div
                  className="absolute top-0 left-0 h-full bg-brand-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ) : result && result.medicines && result.medicines.length > 0 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Prescription Parsed Successfully</h3>
                  {(() => {
                    const pName = result.metadata?.patientName;
                    const dName = result.metadata?.doctorName;
                    const hasPatient = pName && !pName.includes('Unknown') && !pName.includes('Scanned');

                    const isDoctorUnknown = !dName || dName.includes('Unknown') || dName.includes('Scanned');
                    const displayDoctorName = isDoctorUnknown ? 'Not Given' : dName;
                    const displayDoctorSpecialty = isDoctorUnknown ? '' : (result.metadata?.doctorSpecialty ? `(${result.metadata.doctorSpecialty})` : '');

                    return (
                      <p className="text-sm text-slate-500 mt-1">
                        {hasPatient && (
                          <>Patient: <span className="font-semibold text-slate-700">{pName} {result.metadata?.patientAge && `(${result.metadata.patientAge})`}</span></>
                        )}
                        {hasPatient && <span className="mx-2">•</span>}
                        <>Prescribed by: <span className="font-semibold text-slate-700">{displayDoctorName} {displayDoctorSpecialty}</span></>
                      </p>
                    );
                  })()}
                </div>
                <button onClick={() => { setResult(null); setFile(null); }} className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm hover:bg-slate-50 transition-colors shrink-0">
                  <RotateCcw className="w-4 h-4" />
                  Scan Another
                </button>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase">Medicine Formula Matches & Generic Saving</p>
                <div className="space-y-4">
                  {(result.medicines || []).map((med: any, idx: number) => {
                    let product = med.product;
                    if (med.match?.matchType === 'Similar' && selectedVariants[idx]) {
                      product = selectedVariants[idx];
                    }
                    const marketPrice = Number(product?.price || 0);
                    const doseboxPrice = Number(product?.discountPrice || marketPrice);
                    const savedPct = marketPrice > 0 ? Math.round(((marketPrice - doseboxPrice) / marketPrice) * 100) : 0;

                    return (
                      <div key={idx} className="border border-slate-200 rounded-xl p-4 hover:border-brand-300 transition-colors bg-white flex flex-col md:flex-row gap-6 justify-between items-start">
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-[10px] uppercase font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Handwritten Brand</span>
                            <span className="text-sm font-medium text-slate-600 italic">"{med.extracted?.medicineName || 'Unknown'} {med.extracted?.strength || ''}"</span>
                            {med.extracted?.dosage && (
                              <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{med.extracted.dosage}</span>
                            )}
                            {med.extracted?.quantity && (
                              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Qty: {med.extracted.quantity} Units (AI Calc)</span>
                            )}
                          </div>

                          {product ? (
                            <>
                              <div className="flex items-start gap-2">
                                <ChevronRight className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
                                <div>
                                  <h4 className="text-lg font-bold text-brand-700"> {product.name}</h4>
                                  <p className="text-xs text-slate-500 mt-1 font-mono">Active: {product.name.replace(/[^a-zA-Z\s]/g, '')} Trihydrate {med.extracted?.strength || '500mg'}</p>
                                </div>
                              </div>
                              {med.match?.matchType === 'Similar' && (
                                <div className="mt-4 ml-7 bg-blue-50 border border-blue-100 p-3 rounded-lg">
                                  <p className="text-xs text-blue-800 font-semibold mb-2">Action Required: Multiple dosages found. Select Variant:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {med.variants?.map((v: any) => (
                                      <button
                                        key={v.id}
                                        onClick={() => setSelectedVariants({ ...selectedVariants, [idx]: v })}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${selectedVariants[idx]?.id === v.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'}`}
                                      >
                                        {v.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="mt-2 ml-7 p-3 bg-amber-50 text-amber-800 text-sm rounded-lg border border-amber-200">
                              No generic match found. A pharmacist will review this item.
                            </div>
                          )}
                        </div>

                        {product && (
                          <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-8 bg-slate-50 px-4 sm:px-6 py-4 rounded-xl border border-slate-100 w-full md:w-auto overflow-hidden">
                            <div className="text-right flex-1 sm:flex-none">
                              <p className="text-[10px] uppercase font-bold text-slate-400">DoseBox Price</p>
                              <p className="text-lg font-bold text-slate-800">₹{formatCurrency(doseboxPrice)} <span className="text-xs font-normal text-slate-500">/ Tablet</span></p>
                              <p className="text-xs font-bold text-brand-600 mt-1">₹{formatCurrency((doseboxPrice * 10))} <span className="text-slate-400 font-normal">(10 Units)</span></p>
                            </div>
                            <div className="w-px h-12 bg-slate-200 hidden sm:block"></div>
                            <div className="text-right flex-1 sm:flex-none">
                              <p className="text-[10px] uppercase font-bold text-slate-400">Market Brand Price</p>
                              <p className="text-sm font-medium text-slate-400 line-through mt-0.5">₹{formatCurrency(marketPrice)}</p>
                              <p className="text-xs font-bold text-rose-500 mt-2 tracking-wide bg-rose-50 px-2 py-0.5 rounded-full inline-block">Save {savedPct}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Overall Savings Box */}
              {savings.savedAmount > 0 && (
                <div className="border border-brand-200 bg-brand-50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-500 text-white rounded-full flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-brand-800 font-bold">Overall Generic Savings: {savings.percentage}%</h4>
                      <p className="text-sm text-brand-600 mt-0.5">By swapping to DoseBox specialty generics, you save ₹{formatCurrency(savings.savedAmount)} on this order!</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0 sm:ml-4">
                    <p className="text-sm text-slate-400 line-through">₹{formatCurrency(savings.totalMarket)}</p>
                    <p className="text-2xl font-black text-brand-600">₹{formatCurrency(savings.totalDosebox)}</p>
                  </div>
                </div>
              )}

              {/* Recommended Alternatives Section */}
              {result.medicines?.some((m: any) => m.variants && m.variants.length > 0) && (
                <div className="mt-8 border-t border-slate-100 pt-8">
                  <p className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase">Recommended Alternatives (Same Formula)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.medicines.map((med: any, mIdx: number) => {
                      if (!med.variants || med.variants.length === 0) return null;
                      return med.variants.map((variant: any, vIdx: number) => {
                        let img = 'https://images.unsplash.com/photo-1584308666744-24d5e478ac6d?w=800&q=80';
                        try {
                          const parsed = typeof variant.images === 'string' ? JSON.parse(variant.images) : variant.images;
                          if (parsed && parsed.length > 0) img = parsed[0];
                        } catch (e) {}

                        const isSelected = selectedVariants[mIdx]?.id === variant.id;

                        return (
                          <div key={`${mIdx}-${vIdx}`} className={`border rounded-xl p-4 flex items-start gap-4 transition-all cursor-pointer ${isSelected ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200' : 'border-slate-200 hover:border-brand-300 bg-white'}`} onClick={() => setSelectedVariants({ ...selectedVariants, [mIdx]: variant })}>
                            <img src={img} alt={variant.name} className="w-12 h-12 rounded-lg object-cover border border-slate-100 shrink-0" />
                            <div className="flex-1">
                              <h5 className="font-bold text-slate-800 text-sm">{variant.name}</h5>
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{variant.manufacturer || 'Generic Brand'}</p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-sm font-bold text-brand-600">₹{formatCurrency(Number(variant.discountPrice || variant.price))}</p>
                                <button className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${isSelected ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-brand-600 border-brand-200 hover:bg-brand-50'}`}>
                                  {isSelected ? 'Selected' : 'Select'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })}
                  </div>
                </div>
              )}

              {/* Rx Validation Check */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-800">
                  <span className="font-semibold">Rx Validation Check:</span> A designated, licensed pharmacist under DoseBox.in will carry out manual stamp cross-checking on our end within 15 minutes before the shipment is packed.
                </p>
              </div>

            </div>
          ) : result ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in">
              <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6 border border-amber-100">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Awaiting Pharmacist Review</h3>
              <p className="text-slate-600 max-w-md text-base leading-relaxed">
                Your prescription has been securely uploaded! <br /><br />
                <span className="font-semibold text-slate-700">What's Next?</span> A certified DoseBox pharmacist is carefully reviewing your uploaded document to map your medicines to high-quality generics. You will receive a notification when your Draft Cart is ready for checkout!
              </p>
              <div className="mt-8 flex items-center justify-center gap-4 w-full">
                <button
                  onClick={() => { setResult(null); setFile(null); setPreviewUrl(null); }}
                  className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Upload Another
                </button>
                <Link
                  href="/dashboard/customer/prescriptions"
                  className="px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-md flex items-center gap-2"
                >
                  View My Prescriptions <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              <p className="text-slate-600 text-center mb-6 sm:mb-8 w-full sm:max-w-7xl mx-auto text-sm sm:text-base px-2">
                Upload your prescription. DoseBox's medical OCR matches the active pharmaceutical ingredients (APIs) and maps them directly to high-quality generic alternatives, passing the savings to you.
              </p>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-300 max-w-xl mx-auto ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-brand-300 hover:border-brand-400 hover:bg-brand-50/50'
                  }`}
              >
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={onFileChange}
                  accept=".jpg,.jpeg,.png,.webp,.heic,.pdf"
                />

                {file ? (
                  <div className="space-y-4">
                    {previewUrl ? (
                      <div className="w-24 h-24 bg-slate-100 rounded-xl mx-auto mb-4 border border-slate-200 overflow-hidden flex items-center justify-center">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-brand-600" />
                      </div>
                    )}
                    <p className="text-lg font-semibold text-brand-800">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                      className="mt-6 w-full sm:w-auto px-8 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
                    >
                      Process Prescription
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}
                      className="mt-4 block mx-auto text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-100">
                      <UploadCloud className="w-8 h-8 text-brand-600" />
                    </div>
                    <p className="text-lg font-medium text-slate-800 mb-2">
                      Drag & Drop prescription or <span className="text-brand-600 underline">browse computer</span>
                    </p>
                    <p className="text-sm text-slate-400 font-mono">
                      Supports JPG, PNG, PDF (Max 10MB)
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 sm:mt-8 bg-slate-50 rounded-xl p-4 flex items-start justify-center gap-3 w-full sm:max-w-7xl mx-auto border border-slate-100 text-left">
                <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-700">100% Privacy Ensured:</span> Encrypted end-to-end data transfer. Your medical information is only read to match medications and is monitored by a Govt-certified digital pharmacist.
                </p>
              </div>

              {/* VALID PRESCRIPTION GUIDELINES & DIRECT SUPPORT */}
              <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                
                {/* What is a Valid Prescription? */}
                <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">What is a Valid Prescription?</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    To process your order, government regulations require a prescription with the following clear details:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5"></span>
                      <span><strong>Doctor's Info:</strong> Must include name, registration number, signature, and stamp.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5"></span>
                      <span><strong>Patient Info:</strong> Must list patient's name, age, and gender.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5"></span>
                      <span><strong>Medication Info:</strong> Name of medicine, dosage form, strength, and duration.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5"></span>
                      <span><strong>Date of Issue:</strong> Must be dated within the last 6 months.</span>
                    </li>
                  </ul>
                </div>

                {/* Need Support? (Direct Contact) */}
                <div className="bg-brand-50/30 rounded-2xl p-5 border border-brand-100/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center">
                        <Info className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm">Need Support?</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Have questions or facing issues uploading? Connect directly with our team for human assistance.
                    </p>
                    
                    <div className="space-y-3">
                      <a 
                        href="tel:+919876543210" 
                        className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-100 hover:border-brand-300 hover:shadow-sm transition-all"
                      >
                        <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Call Support</p>
                          <p className="text-xs font-bold text-slate-800">+91 98765 43210</p>
                        </div>
                      </a>

                      <a 
                        href="https://wa.me/919876543210" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-100 hover:border-brand-300 hover:shadow-sm transition-all"
                      >
                        <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">WhatsApp Support</p>
                          <p className="text-xs font-bold text-slate-800">Chat with Support Desk</p>
                        </div>
                      </a>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100/50 flex items-center justify-between text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                    <span>Mon - Sat: 9 AM - 8 PM</span>
                    <span className="text-brand-600">Direct Support</span>
                  </div>
                </div>

              </div>

              {/* <div className="mt-8 pt-6 sm:pt-8 border-t border-slate-100 w-full mx-auto">
                <p className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  DON'T HAVE A PRESCRIPTION? SCAN A SAMPLE SCENARIO:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { tag: 'Scenario A', title: 'Common Allergy & Chest...', doc: 'Dr. Sameer Verma, MD...' },
                    { tag: 'Scenario B', title: 'Diabetes & High Cholesterol...', doc: 'Dr. Anita Shastry, DM (Endocrinology)' },
                    { tag: 'Scenario C', title: 'Geriatric Ortho & Daily Tonic...', doc: 'Dr. Rameshwar Rao, MS...' }
                  ].map((scenario, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-4 bg-white cursor-pointer hover:border-brand-300 hover:shadow-md transition-all">
                      <span className="inline-block px-3 py-1 bg-brand-50 text-brand-700 font-semibold text-xs rounded-full mb-3">{scenario.tag}</span>
                      <h4 className="text-sm font-bold text-slate-800 mb-1 truncate">{scenario.title}</h4>
                      <p className="text-xs text-slate-500 truncate">{scenario.doc}</p>
                    </div>
                  ))}
                </div>
              </div> */}
            </div>
          )}
        </div>

        {/* Footer actions for High Confidence results */}
        {result && result.medicines && result.medicines.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4 shrink-0">
            <button
              onClick={() => { setResult(null); setFile(null); }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 border border-transparent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddVerifiedToCart}
              className="w-full sm:w-auto justify-center px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors flex items-center gap-2 shadow-lg shadow-brand-200"
            >
              Add Verified Generics to Cart
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
