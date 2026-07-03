'use client';

import React, { useEffect, useState } from 'react';
import { useCart } from '../../../../context/CartContext';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, CheckCircle2, Clock, AlertCircle, ArrowRight, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

export default function CustomerPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    const fetchRx = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/customer/prescriptions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setPrescriptions(data.data);
        }
      } catch (error) {
        toast.error('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };
    fetchRx();
  }, []);

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'Approved':
        return { label: 'Ready for Checkout', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
      case 'Rejected':
        return { label: 'Rejected', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      case 'Pending':
      default:
        return { label: 'In Review', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    }
  };

  const handleCheckoutDraft = (draftCart: any) => {
    if (!draftCart || !draftCart.items) return;
    draftCart.items.forEach((item: any) => {
      if (item.medicine) {
        addToCart({ ...item.medicine, quantity: item.quantity });
      }
    });
    toast.success('Items added to cart!');
    router.push('/cart');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Prescriptions</h1>
        <p className="text-slate-600">Track your uploaded prescriptions and check out verified medicine carts.</p>
      </div>

      <div className="space-y-6">
        {prescriptions.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">No prescriptions yet</h3>
            <p className="text-slate-500 mb-6">Upload your first prescription to get started.</p>
            <Link href="/upload-prescription" className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-brand-700 transition-colors">
              Upload Prescription <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          prescriptions.map(rx => {
            const statusInfo = getStatusDisplay(rx.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div key={rx.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Prescription #{rx.id}</h3>
                    <p className="text-sm text-slate-500">Uploaded on {new Date(rx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${statusInfo.bg} ${statusInfo.border} ${statusInfo.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm font-bold">{statusInfo.label}</span>
                  </div>
                </div>

                <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-6">
                  {/* Image Thumb */}
                  <div className="w-full md:w-48 h-48 sm:h-auto bg-slate-100 rounded-xl overflow-hidden relative shrink-0 border border-slate-200">
                    {rx.fileUrl.endsWith('.pdf') ? (
                       <iframe src={rx.fileUrl} className="w-full h-full pointer-events-none" />
                    ) : (
                      <Image src={rx.fileUrl} alt="Prescription" fill className="object-cover" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    {rx.status === 'Pending' && (
                      <div className="h-full flex flex-col justify-center text-center sm:text-left py-4">
                        <p className="text-slate-600 mb-2">Your prescription is currently being reviewed by a certified DoseBox pharmacist.</p>
                        <p className="text-sm text-slate-500">We will notify you once your custom generic cart is ready.</p>
                      </div>
                    )}

                    {rx.status === 'Rejected' && (
                      <div className="h-full flex flex-col justify-center text-center sm:text-left py-4">
                        <p className="text-slate-600 font-semibold mb-2">We could not process this prescription.</p>
                        {rx.pharmacistNotes && (
                          <div className="bg-red-50 p-3 rounded-lg border border-red-100 mt-2">
                            <span className="text-xs font-bold text-red-800 uppercase block mb-1">Pharmacist Note:</span>
                            <span className="text-sm text-red-700">{rx.pharmacistNotes}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {rx.status === 'Approved' && rx.draftCart && (
                      <div>
                        <h4 className="font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">Your Verified Draft Cart</h4>
                        <div className="space-y-3 mb-6">
                          {rx.draftCart.items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <div>
                                <h5 className="font-semibold text-slate-800 text-sm">{item.medicine?.name}</h5>
                                <p className="text-xs text-slate-500">{item.medicine?.genericName}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-brand-600">₹{Number(item.price).toFixed(2)} x {item.quantity}</div>
                                {item.type === 'alternative' && (
                                  <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full inline-block mt-1">Generic Alternative</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {rx.pharmacistNotes && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-6">
                            <span className="text-xs font-bold text-blue-800 uppercase block mb-1">Pharmacist Note:</span>
                            <span className="text-sm text-blue-700">{rx.pharmacistNotes}</span>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4">
                          <div className="text-slate-500 text-sm">
                            Total Items: <span className="font-bold text-slate-800">{rx.draftCart.items?.length || 0}</span>
                          </div>
                          <button 
                            onClick={() => handleCheckoutDraft(rx.draftCart)}
                            className="w-full sm:w-auto px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-brand-200"
                          >
                            <ShoppingCart className="w-5 h-5" /> Proceed to Checkout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
