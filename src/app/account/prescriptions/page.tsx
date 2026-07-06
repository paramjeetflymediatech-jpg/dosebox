'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Upload, ShieldCheck, Eye, History, ArrowRight } from 'lucide-react';
import api from '../../../lib/api';
import { toast } from 'react-hot-toast';
import { useCart } from '../../../context/CartContext';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface Prescription {
  id: number;
  fileUrl: string;
  status: string;
  pharmacistNotes?: string;
  createdAt: string;
}

export default function PrescriptionsPage() {
  const { addToCart } = useCart();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [showScanResults, setShowScanResults] = useState(false);

  useEffect(() => {
    loadPrescriptions(currentPage);
  }, [currentPage]);

  async function loadPrescriptions(page: number) {
    try {
      const res = await api.get(`/prescriptions/customer?page=${page}&limit=5`);
      if (res.data?.success) {
        setPrescriptions(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error('Failed to load prescriptions', err);
    } finally {
      setLoading(false);
    }
  }

  const handlePrescriptionUpload = async () => {
    if (!prescriptionFile) {
      toast.error('Please choose a file to upload first.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', prescriptionFile);
      const res = await api.post('/prescriptions', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      if (res.data?.success) {
        toast.success('Prescription scanned successfully');
        loadPrescriptions(1);

        if (res.data.extractedMedicines?.length > 0) {
          setScanResults(res.data.extractedMedicines);
          setShowScanResults(true);
        }
      } else {
        toast.error('Upload failed');
      }
    } catch (err: any) {
      toast.error('Upload error: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      setPrescriptionFile(null);
    }
  };

  const addAllScannedToCart = () => {
    scanResults.forEach((med) => {
      let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
      try { if (med.images) imagesArr = JSON.parse(med.images); } catch (e) {}
      addToCart({ id: med.id, name: med.name, price: Number(med.price), prescriptionRequired: med.prescriptionRequired, image: imagesArr[0] });
    });
    toast.success('All scanned medicines added to cart!');
    setShowScanResults(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-brand-600" /> Prescriptions
        </h3>
        
        <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 mb-1">
              <Upload className="w-4 h-4 text-brand-600" /> Upload New Prescription
            </h4>
            <p className="text-xs text-slate-500">Upload a prescription image or PDF. Our AI will scan it and match medicines instantly.</p>
          </div>
          <Link
            href="/upload-prescription"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-2.5 px-5 rounded-lg transition-all shrink-0 shadow-sm shadow-brand-500/30"
          >
            Upload & Scan <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {showScanResults && scanResults.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h4 className="font-extrabold text-emerald-900 text-sm flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600" /> AI Matched Medicines</h4>
              <button onClick={addAllScannedToCart} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-4 rounded-lg transition-all">Add All to Cart</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scanResults.map(med => (
                <div key={med.id} className="bg-white border border-emerald-100 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="font-bold text-sm text-slate-800">{med.name} <span className="text-xs text-slate-400 block font-normal">₹{formatCurrency(Number(med.price))}</span></span>
                  <button onClick={() => addToCart({ id: med.id, name: med.name, price: Number(med.price), prescriptionRequired: med.prescriptionRequired, image: '' })} className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100">Add</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-brand-600" />
            Prescription History
          </h3>
          
          {prescriptions.length > 0 ? (
            <>
              <div className="overflow-x-auto bg-white rounded-xl border border-slate-100 shadow-sm">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">ID & Date</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Notes</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescriptions.map((presc) => (
                    <tr key={presc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-800 block">#{presc.id}</span>
                        <span className="text-xs text-slate-500">{new Date(presc.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          presc.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                          presc.status === 'Rejected' ? 'bg-rose-50 text-rose-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {presc.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600 font-medium whitespace-normal min-w-[200px]">
                        {presc.pharmacistNotes ? presc.pharmacistNotes : <span className="text-slate-400 italic">No notes</span>}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <a 
                          href={presc.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm font-semibold text-slate-600 px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
            </>
        ) : (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No prescriptions uploaded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
