'use client';

import React, { useState, useEffect } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, ShieldCheck, ArrowRight, ShoppingBag, PlusCircle, Check
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../lib/api';

interface Prescription {
  id: number;
  fileUrl: string;
  fileType: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export default function UploadPrescriptionPage() {
  const { user } = useAuth();
  const { cartItems, addToCart } = useCart();

  // States
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [prescriptionId, setPrescriptionId] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [showScanResults, setShowScanResults] = useState(false);
  const [history, setHistory] = useState<Prescription[]>([]);

  // Load history if logged in
  useEffect(() => {
    if (user) {
      async function loadHistory() {
        try {
          const res = await api.get('/prescriptions/customer');
          if (res.data?.success) {
            setHistory(res.data.data);
          }
        } catch (err) {
          console.warn('Could not load prescriptions history:', err);
        }
      }
      loadHistory();
    }
  }, [user, uploadSuccess]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPrescriptionFile(e.target.files[0]);
      setUploadSuccess(false);
      setPrescriptionId(null);
      setScanResults([]);
      setShowScanResults(false);
    }
  };

  const handleUploadAndScan = async () => {
    if (!prescriptionFile) {
      alert('Please select a file to upload first.');
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
    try {
      const formData = new FormData();
      formData.append('file', prescriptionFile);

      const res = await api.post('/prescriptions', formData, {
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
        alert('Scan failed: ' + res.data?.message);
      }
    } catch (err: any) {
      alert('Scan error: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      setIsScanning(false);
    }
  };

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
    toast.success(`${med.name} added to cart!`);
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
    toast.success('All scanned medicines added to cart!');
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-6 uppercase tracking-wider">
          <Link href="/" className="hover:text-brand-600 transition-colors">Home</Link>
          <ArrowRight className="w-3.5 h-3.5" />
          <span className="text-slate-600">Upload Prescription</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: SCANNING DROPZONE & RESULTS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* UPLOADER CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-6">
              <div>
                <span className="text-xxs font-extrabold text-brand-600 uppercase tracking-widest bg-brand-50 py-1 px-3 rounded-full">
                  AI Prescription Scanner
                </span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-3">Upload & Match Medicines</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Upload a photo or PDF of your doctor prescription. Our system will scan and match ingredients with active catalog drugs.
                </p>
              </div>

              {/* Fake dropzone container */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-50/50 transition-all flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xs border border-slate-100 text-slate-400">
                  <Upload className="w-6 h-6" />
                </div>
                
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 block">
                    {prescriptionFile ? prescriptionFile.name : 'Select Doctor Prescription File'}
                  </span>
                  <span className="text-xxs text-slate-400 block">
                    Accepts PNG, JPG, or PDF (Max 5MB)
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-xs">
                    Choose File
                  </button>
                </div>
              </div>

              {/* Upload Button */}
              {prescriptionFile && (
                <button
                  onClick={handleUploadAndScan}
                  disabled={uploading || uploadSuccess}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-500/10"
                >
                  {uploading ? 'Processing File...' : uploadSuccess ? 'Successfully Scanned' : 'Scan & Extract Medicines'}
                  {uploadSuccess ? <CheckCircle2 className="w-5 h-5 text-emerald-300" /> : <ArrowRight className="w-5 h-5" />}
                </button>
              )}

              {/* Login Requirement Banner */}
              {!user && (
                <div className="bg-amber-50 border border-amber-100 text-amber-800 text-xs p-4 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Sign In Required</span>
                    <p className="mt-0.5 leading-relaxed text-slate-600">
                      You must be signed in to submit prescription documents for pharmacist verification. Log in to start scanning.
                    </p>
                    <button 
                      onClick={() => {
                        const btn = document.querySelector('button[class*="bg-brand-600"]');
                        if (btn) (btn as HTMLButtonElement).click();
                      }}
                      className="mt-2 text-brand-700 font-extrabold hover:underline block"
                    >
                      Login Now &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Success Notification */}
              {uploadSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-4 rounded-2xl flex items-start gap-3 animate-fadeIn">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block">Prescription Scanned & Uploaded!</span>
                    <p className="mt-0.5 text-slate-600">
                      Prescription ID: <strong>#{prescriptionId}</strong> has been successfully linked. Our pharmacist will review it to verify any Rx required items at checkout.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SCANNING PROGRESS ANIMATION */}
            {isScanning && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col items-center justify-center space-y-3 relative overflow-hidden animate-pulse shadow-sm">
                <div className="w-8 h-8 rounded-full border-3 border-brand-600 border-t-transparent animate-spin" />
                <span className="text-xs font-extrabold text-slate-700 animate-pulse">🤖 MrMed AI Scanner is parsing document ingredients...</span>
                <p className="text-xxs text-slate-400 text-center max-w-md leading-relaxed">
                  Extracting active pharmaceutical ingredients (APIs), matching names, and resolving dosages with index products.
                </p>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-secondary animate-bounce" />
              </div>
            )}

            {/* SCAN RESULTS PANEL */}
            {showScanResults && scanResults.length > 0 && (
              <div className="bg-white rounded-3xl border border-brand-100 p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      Matched Medicines ({scanResults.length})
                    </h3>
                    <p className="text-xxs text-slate-400 mt-1">We matched the following items in our catalog database:</p>
                  </div>
                  <button 
                    onClick={addAllScannedToCart}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs py-2 px-5 rounded-full transition-all shadow-sm flex items-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add All to Cart
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {scanResults.map((med) => {
                    let img = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250';
                    try {
                      if (med.images) img = JSON.parse(med.images)[0];
                    } catch (e) {}

                    const isAlreadyInCart = cartItems.some(item => item.id === med.id);

                    return (
                      <div key={med.id} className="border border-slate-100 p-4 rounded-xl flex items-center justify-between gap-3 shadow-xs hover:border-brand-100 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 flex-shrink-0">
                            <img src={img} className="object-contain max-h-8 mix-blend-multiply" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-slate-800 text-xs truncate hover:underline">
                              <Link href={`/medicines/detail?id=${med.id}`}>{med.name}</Link>
                            </h5>
                            <span className="text-slate-400 text-xxs block mt-0.5 truncate">Comp: {med.composition}</span>
                            <span className="text-brand-600 text-xxs font-bold block mt-1">₹{Number(med.price).toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => addScannedToCart(med)}
                          disabled={isAlreadyInCart}
                          className={`font-extrabold text-xxs py-1.5 px-3 rounded-full transition-all border ${
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

          {/* RIGHT: HISTORY AUDIT PANEL */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                Uploaded Documents
              </h3>

              {!user ? (
                <div className="text-center py-6 text-slate-400 italic text-xs leading-relaxed">
                  Please sign in to view your past uploaded prescriptions.
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-6 text-slate-400 italic text-xs leading-relaxed">
                  No documents uploaded yet in this account.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((presc) => (
                    <div 
                      key={presc.id} 
                      className="border border-slate-100 p-3 rounded-xl flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 text-xxs block">Prescription #{presc.id}</span>
                        <span className="text-slate-400 text-xxs block mt-0.5">{new Date(presc.createdAt).toLocaleDateString()}</span>
                        {presc.notes && (
                          <span className="text-slate-500 italic text-xxs block truncate mt-1">{presc.notes}</span>
                        )}
                      </div>
                      
                      <span className={`text-xxs font-bold py-0.5 px-2.5 rounded-full flex-shrink-0 ${
                        presc.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                        presc.status === 'Rejected' ? 'bg-rose-50 text-rose-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {presc.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QUICK LINK TO CATALOG */}
            <div className="bg-brand-600 text-white rounded-3xl p-6 shadow-md shadow-brand-500/10 space-y-4">
              <h4 className="font-extrabold text-sm sm:text-base leading-tight">Need to search manually?</h4>
              <p className="text-xs text-brand-100 leading-relaxed">
                Explore our directory of catalog medicines including chronic care, vitamins, and over-the-counter options.
              </p>
              <Link 
                href="/medicines" 
                className="inline-flex items-center gap-1.5 bg-white text-brand-700 hover:bg-brand-50 font-bold text-xs py-2.5 px-6 rounded-full transition-all shadow-sm"
              >
                Browse Catalog
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
