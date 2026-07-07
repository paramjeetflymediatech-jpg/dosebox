'use client';

import React, { useEffect, useState } from 'react';
import { Eye, Check, X, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import PrescriptionReviewModal from '../../../../components/admin/PrescriptionReviewModal';
import Pagination from '../../../../components/admin/Pagination';

export default function AdminPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch('/api/admin/prescriptions');
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

  const updateStatus = async (id: number, status: string) => {
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/prescriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, pharmacistNotes: notes })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Prescription ${status}`);
        setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status, pharmacistNotes: notes } : p));
        setSelectedRx(null);
        setNotes('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      case 'Processing': return 'bg-blue-100 text-blue-700';
      case 'Pending': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const totalPages = Math.ceil(prescriptions.length / itemsPerPage);
  const currentItems = prescriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Prescription Reviews</h1>
        <p className="text-slate-500">Review AI extractions and approve customer prescriptions.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">ID / Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Customer</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">AI Results</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.map((rx) => (
                <tr key={rx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">#{rx.id}</div>
                    <div className="text-xs text-slate-500">{new Date(rx.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{rx.user?.name}</div>
                    <div className="text-sm text-slate-500">{rx.user?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">
                      {rx.extractedMedicines?.length} medicines found
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(rx.status)}`}>
                      {rx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedRx(rx);
                        setNotes(rx.pharmacistNotes || '');
                      }}
                      className="inline-flex items-center justify-center p-2 text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {prescriptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No prescriptions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={prescriptions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Review Modal */}
      {selectedRx && (
        <PrescriptionReviewModal 
          rx={selectedRx} 
          onClose={() => setSelectedRx(null)} 
          onSuccess={() => {
            setSelectedRx(null);
            fetchPrescriptions();
          }}
        />
      )}
    </div>
  );
}
