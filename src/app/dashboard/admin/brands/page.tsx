'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Edit2, Search } from 'lucide-react';
import api from '@/lib/api';
import Pagination from '@/components/admin/Pagination';

interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/brands');
      if (res.data?.success) {
        setBrands(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load brands', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setIsEditing(true);
      setCurrentId(brand.id);
      setName(brand.name);
      setSlug(brand.slug);
      setDescription(brand.description || '');
      setLogo(brand.logo || '');
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setName('');
      setSlug('');
      setDescription('');
      setLogo('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { name, slug, description, logo };
      if (isEditing && currentId) {
        await api.put(`/admin/brands/${currentId}`, payload);
      } else {
        await api.post('/admin/brands', payload);
      }
      setIsModalOpen(false);
      loadBrands();
    } catch (err) {
      console.error('Failed to save brand', err);
      alert('Failed to save brand');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete brand "${name}"?`)) return;
    try {
      await api.delete(`/admin/brands/${id}`);
      setBrands(brands.filter(b => b.id !== id));
    } catch (err) {
      console.error('Failed to delete brand', err);
      alert('Failed to delete brand');
    }
  };

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
  const currentItems = filteredBrands.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Shield className="w-8 h-8 text-brand-600" /> Medicine Brands
        </h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-brand-500/30 flex items-center gap-2 text-sm whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> Add Brand
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Slug</th>
                <th className="p-4 hidden md:table-cell">Description</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">Loading brands...</td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">No brands found.</td>
                </tr>
              ) : (
                currentItems.map((brand) => (
                  <tr key={brand.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-medium text-slate-900">{brand.name}</td>
                    <td className="p-4 text-slate-600">{brand.slug}</td>
                    <td className="p-4 hidden md:table-cell text-slate-500 truncate max-w-[200px]">{brand.description || '-'}</td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenModal(brand)}
                        className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(brand.id, brand.name)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBrands.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{isEditing ? 'Edit Brand' : 'Add Brand'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!isEditing) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-500 min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Logo URL (Optional)</label>
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-brand-500/30 transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
