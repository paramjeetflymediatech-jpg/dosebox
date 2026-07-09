'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pill, Plus, Search, Edit2, Trash2, ShieldAlert, Download } from 'lucide-react';
import api from '@/lib/api';
import Swal from 'sweetalert2';

interface Medicine {
  id: number;
  name: string;
  genericName: string;
  price: number;
  stock: number;
  prescriptionRequired: boolean;
  categoryDetail?: { name: string };
  brand?: { name: string };
}

export default function AdminMedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const res = await api.get('/medicines?limit=10000&sortBy=nameAsc'); // Load all for admin to enable full client search & sort alphabetically
      if (res.data?.success) {
        setMedicines(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load medicines', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Are you sure you want to delete ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/medicines/${id}`);
      setMedicines(medicines.filter(m => m.id !== id));
    } catch (err) {
      console.error('Failed to delete medicine', err);
      alert('Failed to delete medicine. Please try again.');
    }
  };

  const filteredMedicines = medicines.filter(m =>
    (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.genericName || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('file', file);

    setUploadingCsv(true);
    try {
      const res = await api.post('/medicines/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        alert(res.data.message);
        setIsCsvModalOpen(false);
        loadMedicines();
      }
    } catch (err: any) {
      console.error('Failed to upload CSV', err);
      alert(err.response?.data?.message || 'Failed to process CSV file.');
    } finally {
      setUploadingCsv(false);
      e.target.value = ''; // reset input
    }
  };

  const handleExportCsv = () => {
    if (filteredMedicines.length === 0) {
      alert('No data to export.');
      return;
    }
    
    const headers = ['ID', 'Name', 'Generic Name', 'Brand', 'Category', 'Price', 'Stock', 'Prescription Required'];
    const rows = filteredMedicines.map(m => [
      m.id,
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${(m.genericName || '').replace(/"/g, '""')}"`,
      `"${(m.brand?.name || '').replace(/"/g, '""')}"`,
      `"${(m.categoryDetail?.name || '').replace(/"/g, '""')}"`,
      m.price,
      m.stock,
      m.prescriptionRequired ? 'Yes' : 'No'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `medicines_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteAll = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you absolutely sure you want to delete ALL medicines? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    try {
      setLoading(true);
      const res = await api.delete('/medicines');
      if (res.data?.success) {
        setMedicines([]);
        alert('All medicines deleted successfully.');
      } else {
        alert(res.data?.message || 'Failed to delete all medicines.');
      }
    } catch (err: any) {
      console.error('Failed to delete all medicines', err);
      alert(err.response?.data?.message || 'Failed to delete all medicines. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Pill className="w-8 h-8 text-brand-600" /> Medicines Catalog
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDeleteAll}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" /> Delete All
          </button>
          <button
            onClick={handleExportCsv}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Export (CSV)
          </button>
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm whitespace-nowrap"
          >
            Bulk Import (CSV / Excel)
          </button>
          <Link
            href="/dashboard/admin/medicines/new"
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add New Medicine
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or generic name..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors text-sm"
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 font-semibold animate-pulse">Loading catalog...</div>
        ) : filteredMedicines.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Pill className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">No medicines found</p>
            <p className="text-sm mt-1">Try a different search or add a new medicine.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Brand / Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredMedicines.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((med) => (
                  <tr key={med.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{med.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{med.genericName}</div>
                      {med.prescriptionRequired && (
                        <div className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded mt-1">
                          <ShieldAlert className="w-3 h-3" /> Rx Required
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-700">{med.brand?.name || '-'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{med.categoryDetail?.name || '-'}</div>
                    </td>
                    <td className="py-4 px-4 font-extrabold text-slate-900">
                      ₹{med.price}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${med.stock > 20 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                        {med.stock} units
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/admin/medicines/${med.id}`}
                          className="p-2 text-slate-400 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(med.id, med.name)}
                          className="p-2 text-slate-400 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {Math.ceil(filteredMedicines.length / itemsPerPage) > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100 mt-6 gap-4">
            <span className="text-sm font-semibold text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredMedicines.length)} of {filteredMedicines.length} entries
            </span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all disabled:opacity-50">Prev</button>
              <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredMedicines.length / itemsPerPage), p + 1))} disabled={currentPage === Math.ceil(filteredMedicines.length / itemsPerPage)} className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* CSV Upload Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Bulk Import (CSV / Excel)</h3>
              <button onClick={() => setIsCsvModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800">
                <p className="font-bold mb-2">Supported Formats: CSV &amp; Excel (.xlsx/.xls)</p>
                <p className="mb-2">Your file must include either our standard headers or the Client format headers.</p>
                <code className="block bg-white p-2 rounded border border-blue-200 font-mono text-xs mb-2">
                  Client Format: BRAND NAME, COMPOSITION/SALT NAME, MARKETED BY, DOSEBOX RATE, MRP, PACK SIZE, PAP OFFER, STORAGE REQUIREMENT
                </code>
                <code className="block bg-white p-2 rounded border border-blue-200 font-mono text-xs mb-2">
                  Standard Format: name, genericName, price, packSize, papOffer, stock, categoryId, brandId, supplierId, images
                </code>
                <p className="text-xs opacity-80">* For Client format, missing required fields like stock, categoryId, and brandId will be assigned defaults automatically.</p>
                <p className="text-xs opacity-80 mt-1">For Excel: use the column headers in row 1. The first sheet will be imported.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-semibold text-slate-700 text-sm">Select CSV or Excel File</label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleCsvUpload}
                  disabled={uploadingCsv}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 w-full border border-slate-200 rounded-xl p-2"
                />
                {uploadingCsv && <p className="text-xs text-brand-600 font-semibold mt-2 animate-pulse">Processing file, please wait...</p>}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCsvModalOpen(false)} className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
