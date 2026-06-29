'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Edit, Globe } from 'lucide-react';
import api from '../../../../lib/api';
import Link from 'next/link';

interface PageMeta {
  id: number;
  routePath: string;
  title: string;
  description: string;
}

export default function AdminSEOPage() {
  const [pageMetas, setPageMetas] = useState<PageMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPageMetas = async () => {
    try {
      const res = await api.get('/admin/page-meta');
      setPageMetas(res.data.data);
    } catch (err) {
      console.error('Failed to load SEO rules', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageMetas();
  }, []);

  const handleDeletePageMeta = async (id: number) => {
    if(!confirm('Are you sure you want to delete this SEO rule?')) return;
    try {
      await api.delete(`/admin/page-meta/${id}`);
      loadPageMetas();
    } catch (err) {
      console.error('Failed to delete SEO rule', err);
    }
  };

  if (loading) return <div className="p-6 text-slate-500 font-medium">Loading SEO Rules...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-8 h-8 text-brand-600" /> Manage Global SEO
        </h1>
        <div className="flex gap-3">
          <Link 
            href="/dashboard/admin/global-seo" 
            className="px-6 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors shadow-sm flex items-center gap-2 border border-slate-200"
          >
            <Globe className="w-5 h-5" /> Global Scripts
          </Link>
          <Link 
            href="/dashboard/admin/seo/new" 
            className="px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New SEO Rule
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold">Route Path</th>
                <th className="py-4 px-6 font-semibold">Meta Title</th>
                <th className="py-4 px-6 font-semibold hidden md:table-cell">Meta Description</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageMetas.map(meta => (
                <tr key={meta.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-6 text-slate-800">
                    <span className="font-mono bg-slate-100 px-2 py-1 rounded text-sm text-brand-600 border border-slate-200">
                      {meta.routePath}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-700">{meta.title}</td>
                  <td className="py-4 px-6 text-slate-500 hidden md:table-cell text-sm max-w-xs truncate">
                    {meta.description}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link 
                        href={`/dashboard/admin/seo/${meta.id}/edit`} 
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" 
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button 
                        onClick={() => handleDeletePageMeta(meta.id)} 
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" 
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageMetas.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <Globe className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    No SEO rules configured. Click "New SEO Rule" to add one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
