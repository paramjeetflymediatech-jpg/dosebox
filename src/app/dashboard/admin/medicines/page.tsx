'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pill, Plus, Search, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import api from '@/lib/api';

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
  const itemsPerPage = 10;

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const res = await api.get('/medicines?limit=100'); // Load top 100 for admin
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
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.delete(`/medicines/${id}`);
      setMedicines(medicines.filter(m => m.id !== id));
    } catch (err) {
      console.error('Failed to delete medicine', err);
      alert('Failed to delete medicine. Please try again.');
    }
  };

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.genericName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Pill className="w-8 h-8 text-brand-600" /> Medicines Catalog
        </h1>
        <Link 
          href="/dashboard/admin/medicines/new"
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Add New Medicine
        </Link>
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
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        med.stock > 20 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
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
    </div>
  );
}
