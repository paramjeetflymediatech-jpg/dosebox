'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Clipboard, MapPin, Eye, FileText, CheckCircle2, AlertCircle, XCircle, ArrowRight, Download, Calendar, HelpCircle, Upload, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import api from '../../../lib/api';
import { toast } from 'react-hot-toast';

interface OrderItem {
  id: number;
  quantity: number;
  price: string;
  medicine?: { name: string; images: string };
}

interface Order {
  id: number;
  status: string;
  totalAmount: string;
  discountAmount: string;
  finalAmount: string;
  paymentStatus: string;
  paymentMethod: string;
  trackingTimeline: string;
  createdAt: string;
  items?: OrderItem[];
}

interface Prescription {
  id: number;
  fileUrl: string;
  fileType: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export default function CustomerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { addToCart } = useCart();
  
  // States
  const [orders, setOrders] = useState<Order[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'prescriptions'>('orders');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Scan states
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [prescriptionId, setPrescriptionId] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [showScanResults, setShowScanResults] = useState(false);

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
        
        // Refresh prescriptions list
        const prescRes = await api.get('/prescriptions/my');
        if (prescRes.data?.success) {
          setPrescriptions(prescRes.data.data);
        }

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
    toast.success(`${med.name} added to cart! You can view it in the cart page.`);
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
    toast.success('All scanned medicines added to cart! Proceed to cart page to checkout.');
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = '/';
      return;
    }

    async function loadDashboardData() {
      setLoadingData(true);
      try {
        const [ordersRes, prescRes] = await Promise.all([
          api.get('/orders/my'),
          api.get('/prescriptions/my')
        ]);
        if (ordersRes.data?.success) setOrders(ordersRes.data.data);
        if (prescRes.data?.success) setPrescriptions(prescRes.data.data);
      } catch (err) {
        console.error('Failed to load customer profile details', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadDashboardData();
  }, [user, authLoading]);

  const downloadInvoice = async (orderId: number) => {
    try {
      const res = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_Order_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download invoice PDF.');
    }
  };

  if (authLoading || loadingData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mx-auto" />
        <p className="text-slate-400 text-sm font-semibold">Loading Customer Portal...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* User Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <span className="text-xxs font-bold text-brand-600 uppercase tracking-widest bg-brand-50 py-1 px-3 rounded-full">Customer</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">{user?.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email} • {user?.phone || 'No phone added'}</p>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('orders')} 
              className={`py-2 px-5 rounded-full font-bold text-xs sm:text-sm transition-all border ${activeTab === 'orders' ? 'bg-brand-600 border-brand-600 text-white shadow' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              My Orders ({orders.length})
            </button>
            <button 
              onClick={() => setActiveTab('prescriptions')} 
              className={`py-2 px-5 rounded-full font-bold text-xs sm:text-sm transition-all border ${activeTab === 'prescriptions' ? 'bg-brand-600 border-brand-600 text-white shadow' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Prescriptions ({prescriptions.length})
            </button>
          </div>
        </div>

        {/* TAB 1: ORDERS LIST */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm">
                <p className="text-slate-400 text-sm font-semibold mb-4">You have not placed any orders yet.</p>
                <Link href="/medicines" className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2 px-6 rounded-full transition-all">
                  Shop Medicines
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                let timeline = [];
                try {
                  timeline = JSON.parse(order.trackingTimeline || '[]');
                } catch(e){}

                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm transition-all">
                    
                    {/* Compact Header summary */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-slate-900 text-sm">Order #OD-{order.id}</span>
                          <span className={`text-xxs font-bold px-2.5 py-0.5 rounded-full ${
                            order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                            'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xxs text-slate-400 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-xxs text-slate-400 font-semibold uppercase tracking-wider block">Final Amount</span>
                          <span className="font-extrabold text-slate-900 text-sm sm:text-base">₹{Number(order.finalAmount).toFixed(2)}</span>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="p-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg transition-all"
                            title="Expand order details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {order.paymentStatus === 'Paid' && (
                            <button 
                              onClick={() => downloadInvoice(order.id)}
                              className="p-1.5 bg-brand-50 border border-brand-100 text-brand-600 hover:bg-brand-100 rounded-lg transition-all"
                              title="Download Invoice PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded item details and timelines */}
                    {isExpanded && (
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100">
                        {/* Items */}
                        <div className="space-y-4">
                          <h4 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Ordered Medications</h4>
                          <div className="space-y-3">
                            {order.items?.map((item) => {
                              let imgUrl = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250';
                              try {
                                if (item.medicine?.images) {
                                  imgUrl = JSON.parse(item.medicine.images)[0];
                                }
                              } catch(e){}

                              return (
                                <div key={item.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 flex-shrink-0">
                                      <img src={imgUrl} className="object-contain max-h-8 mix-blend-multiply" />
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-slate-800 text-xs line-clamp-1">{item.medicine?.name || 'Unknown medicine'}</h5>
                                      <span className="text-xxs text-slate-400 block mt-0.5">Qty: {item.quantity} • Unit: ₹{Number(item.price).toFixed(2)}</span>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold text-slate-800">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Timeline */}
                        <div>
                          <h4 className="font-bold text-slate-950 text-xs uppercase tracking-wider mb-4">Shipping Status Timeline</h4>
                          <div className="relative border-l-2 border-slate-100 ml-3 pl-6 space-y-5">
                            {timeline.map((step: any, sIdx: number) => (
                              <div key={sIdx} className="relative">
                                <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-sm">
                                  <CheckCircle2 className="w-3 h-3" />
                                </div>
                                <span className="font-bold text-slate-800 text-xs block">{step.status}</span>
                                <span className="text-xxs text-slate-400 block">{new Date(step.time).toLocaleString('en-IN')}</span>
                                <span className="text-xxs text-slate-500 mt-1 block">{step.desc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: PRESCRIPTION HISTORY */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-6 border-b border-slate-100 pb-3">My Uploaded Doctor Prescriptions</h3>
              
              {/* UPLOAD & SCAN WIDGET */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-brand-600" />
                    Upload & Scan New Prescription
                  </h4>
                  <p className="text-xxs text-slate-400 mt-1">
                    Upload a prescription sheet. Our AI system will scan the document and instantly extract matchable medicines for your cart.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-between border-t border-slate-200/50 pt-4">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="text-xs text-slate-500 border border-slate-200 rounded-xl p-2 bg-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:font-bold hover:file:bg-brand-100 w-full sm:w-auto"
                  />

                  {prescriptionFile && (
                    <button
                      onClick={handlePrescriptionUpload}
                      disabled={uploading || uploadSuccess}
                      className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2 px-5 rounded-full flex items-center gap-1.5 transition-all shadow-sm w-full sm:w-auto justify-center"
                    >
                      {uploading ? 'Uploading...' : uploadSuccess ? 'Scanned' : 'Upload & Scan'}
                      {uploadSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Upload className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {uploadSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Prescription scanned successfully (ID: {prescriptionId}). Pharmacists will verify it shortly.
                  </div>
                )}

                {isScanning && (
                  <div className="bg-white border border-slate-200/60 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 relative overflow-hidden animate-pulse">
                    <div className="w-6 h-6 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
                    <span className="text-xxs font-extrabold text-slate-700 animate-pulse">🤖 MrMed AI Scanner is reading your prescription...</span>
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
                              className="font-extrabold text-xxs py-0.5 px-2 rounded-full transition-all border bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100"
                            >
                              Add
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {prescriptions.length === 0 ? (
                <p className="text-slate-400 italic text-sm text-center py-6">No prescription files uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prescriptions.map((presc) => (
                    <div 
                      key={presc.id} 
                      className="border border-slate-100 p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm hover:bg-slate-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">Prescription ID: #{presc.id}</span>
                          <span className="text-xxs text-slate-400 block mt-0.5">Uploaded {new Date(presc.createdAt).toLocaleDateString()}</span>
                          {presc.notes && (
                            <span className="text-xxs text-slate-500 italic block mt-1">Note: {presc.notes}</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className={`text-xxs font-bold py-1 px-3 rounded-full flex items-center gap-1.5 ${
                          presc.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          presc.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {presc.status === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {presc.status === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                          {presc.status === 'Pending' && <AlertCircle className="w-3.5 h-3.5" />}
                          {presc.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
