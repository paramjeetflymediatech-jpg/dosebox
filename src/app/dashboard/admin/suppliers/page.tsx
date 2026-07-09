'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import Pagination from '@/components/admin/Pagination';
import Swal from 'sweetalert2';

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  createdAt: string;
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      if (res.data?.success) {
        setSuppliers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load suppliers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/suppliers/${formData.id}`, formData);
        toast.success('Supplier updated successfully');
      } else {
        await api.post('/suppliers', formData);
        toast.success('Supplier added successfully');
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving supplier');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this supplier?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Supplier deleted successfully');
      loadSuppliers();
    } catch (err: any) {
      toast.error('Failed to delete supplier');
    }
  };

  const openModal = (supplier?: Supplier) => {
    if (supplier) {
      setFormData({
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address || ''
      });
    } else {
      setFormData({ id: 0, name: '', email: '', phone: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const currentItems = filteredSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Truck className="w-8 h-8 text-brand-600" /> Suppliers
        </h1>
        <button 
          onClick={() => openModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm whitespace-nowrap w-max"
        >
          <Plus className="w-4 h-4" /> Add New Supplier
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors text-sm"
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 font-semibold animate-pulse">Loading suppliers...</div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Truck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">No suppliers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="py-4 px-4 font-bold text-slate-800">{supplier.name}</td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-semibold text-slate-700">{supplier.email}</div>
                      <div className="text-xs text-slate-500">{supplier.phone}</div>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 max-w-xs truncate">
                      {supplier.address || '-'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openModal(supplier)}
                          className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(supplier.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
        
        <div className="-mx-6 -mb-6 mt-6">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSuppliers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">
                {formData.id ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address (Optional)</label>
                <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500" />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors">
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
