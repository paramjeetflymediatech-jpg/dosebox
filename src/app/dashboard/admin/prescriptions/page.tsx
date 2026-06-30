'use client';

import React, { useState, useEffect } from 'react';
import { Clipboard, Eye, Edit2, Search, XCircle, FileText, CheckCircle } from 'lucide-react';
import api from '../../../../lib/api';
import { toast } from 'react-hot-toast';

export default function AdminPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/prescriptions');
      if (res.data?.success) {
        setPrescriptions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch prescriptions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrescription) return;
    
    setIsUpdating(true);
    try {
      const res = await api.put(`/prescriptions/${selectedPrescription.id}`, {
        status: updateStatus,
        adminNotes: adminNotes.trim()
      });
      if (res.data?.success) {
        toast.success('Prescription updated successfully!');
        fetchPrescriptions();
        setSelectedPrescription(null);
      }
    } catch (err) {
      toast.error('Failed to update prescription.');
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const openUpdateModal = (rx: any) => {
    setSelectedPrescription(rx);
    setUpdateStatus(rx.status);
    setAdminNotes(rx.notes || '');
  };

  const filteredPrescriptions = prescriptions.filter(rx => 
    `RX-${rx.id}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rx.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Clipboard className="w-8 h-8 text-brand-600" /> Prescriptions
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Review and approve customer uploaded prescriptions.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by ID or Name..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4">RX ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Format</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">Loading prescriptions...</td>
                </tr>
              ) : filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No prescriptions found.</td>
                </tr>
              ) : (
                filteredPrescriptions.map((rx) => (
                  <tr key={rx.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">#RX-{rx.id}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800 text-sm">{rx.user?.name}</p>
                      <p className="text-xs text-slate-500">{rx.user?.phone || rx.user?.email}</p>
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">{new Date(rx.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className="uppercase text-xs font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded bg-slate-50">
                        {rx.fileType}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xxs font-bold px-2.5 py-1 rounded-full ${
                        rx.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : rx.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {rx.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => openUpdateModal(rx)} className="p-2 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-bold">
                        <Edit2 className="w-3 h-3" /> Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row h-[80vh]">
            
            {/* Left side: Image Viewer */}
            <div className="w-full md:w-3/5 bg-slate-100 border-r border-slate-200 flex flex-col">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Document Viewer
                </h4>
                <a href={selectedPrescription.fileUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 text-xs font-bold hover:underline">
                  Open Original
                </a>
              </div>
              <div className="flex-1 p-4 overflow-auto flex items-center justify-center">
                {['jpg', 'jpeg', 'png', 'webp'].includes(selectedPrescription.fileType.toLowerCase()) ? (
                  <img src={selectedPrescription.fileUrl} alt="Prescription" className="max-w-full max-h-full object-contain rounded border border-slate-200 shadow-sm" />
                ) : (
                  <iframe src={selectedPrescription.fileUrl} className="w-full h-full rounded border border-slate-200" title="PDF Viewer" />
                )}
              </div>
            </div>

            {/* Right side: Actions */}
            <div className="w-full md:w-2/5 flex flex-col bg-white">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-extrabold text-slate-900">Review #RX-{selectedPrescription.id}</h3>
                <button onClick={() => setSelectedPrescription(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdate} className="p-6 flex-1 flex flex-col space-y-6 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Prescription Status</label>
                  <select 
                    value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm font-medium"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Admin / Pharmacist Notes</label>
                  <textarea 
                    value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Approved. Valid for 3 months."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm min-h-[120px] resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">These notes will be visible to the customer.</p>
                </div>

                <div className="mt-auto pt-6 flex gap-3">
                  <button type="button" onClick={() => setSelectedPrescription(null)} className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button disabled={isUpdating} type="submit" className="flex-1 px-6 py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50">
                    {isUpdating ? 'Saving...' : 'Save Updates'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
