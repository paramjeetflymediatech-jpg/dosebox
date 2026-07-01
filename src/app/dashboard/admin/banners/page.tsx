'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Flag, Edit } from 'lucide-react';
import api from '../../../../lib/api';
import Link from 'next/link';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  type: string;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const loadBanners = async () => {
    try {
      const res = await api.get('/admin/banners');
      setBanners(res.data.data);
    } catch (err) {
      console.error('Failed to load banners', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleDeleteBanner = async (id: number) => {
    if(!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await api.delete(`/admin/banners/${id}`);
      loadBanners();
    } catch (err) {
      console.error('Failed to delete banner', err);
    }
  };

  if (loading) return <div className="p-6 text-slate-500 font-medium">Loading Banners...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Flag className="w-8 h-8 text-brand-600" /> Manage Banners
        </h1>
        <Link 
          href="/dashboard/admin/banners/new" 
          className="px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> New Banner
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(banner => (
          <div key={banner.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group">
            <div className="h-48 bg-slate-100 relative overflow-hidden">
              <img src={banner.image} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-2 right-2 flex gap-2">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-bold rounded-full shadow-sm text-slate-700">
                  {banner.type}
                </span>
                <Link 
                  href={`/dashboard/admin/banners/${banner.id}/edit`} 
                  className="p-1.5 bg-white/90 backdrop-blur-sm text-brand-600 hover:bg-brand-50 rounded-full shadow-sm transition-colors" 
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button 
                  onClick={() => handleDeleteBanner(banner.id)} 
                  className="p-1.5 bg-white/90 backdrop-blur-sm text-rose-500 hover:bg-rose-50 rounded-full shadow-sm transition-colors" 
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-slate-800 truncate">{banner.title}</h4>
              <p className="text-sm text-brand-600 font-medium mt-1 truncate">Link: {banner.link}</p>
            </div>
          </div>
        ))}
        
        {banners.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
            <Flag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            No banners found. Create your first banner!
          </div>
        )}
      </div>

      {Math.ceil(banners.length / itemsPerPage) > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 mt-6 border-t border-slate-100 gap-4">
          <span className="text-sm font-semibold text-slate-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, banners.length)} of {banners.length} banners
          </span>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm">Prev</button>
            <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(banners.length / itemsPerPage), p + 1))} disabled={currentPage === Math.ceil(banners.length / itemsPerPage)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
