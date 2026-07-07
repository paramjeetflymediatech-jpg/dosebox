'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import api from '@/lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
}

const CATEGORY_GRADIENTS = [
  'linear-gradient(135deg, #4f87c5, #6fa3e0)',
  'linear-gradient(135deg, #0c888d, #29b5bb)',
  'linear-gradient(135deg, #e8783a, #f0974e)',
  'linear-gradient(135deg, #7c6fc4, #a494e0)',
  'linear-gradient(135deg, #3ea8b0, #5dc8d0)',
  'linear-gradient(135deg, #6b6b6b, #8c8c8c)'
];

export default function ConditionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get('/medicines/categories');
        if (res.data?.success) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    // <div className="bg-slate-50/50 min-h-screen py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">
          <Link href="/" className="hover:text-brand-600 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900">Conditions</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-[10px] text-brand-600 font-bold uppercase tracking-widest">Target Specific Ailments</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">Shop by Condition</h1>
            <p className="text-slate-500 mt-2 max-w-xl">Browse our complete list of health conditions and chronic categories to find the exact medicines you need.</p>
          </div>
          <div className="relative w-full md:w-72 flex-shrink-0">
            <input
              type="text"
              placeholder="Search conditions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-semibold rounded-xl p-3 pl-10 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 shadow-sm"
            />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 font-medium">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mx-auto mb-4" />
            Loading categories...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No conditions found</h3>
            <p className="text-slate-500">We couldn't find any condition matching "{search}".</p>
            <button onClick={() => setSearch('')} className="mt-4 text-brand-600 font-bold hover:underline">Clear search</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {filteredCategories.map((cat, idx) => {
              const gradient = CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length];
              const isImageFile = cat.image && cat.image.includes('.');
              const IconComp = !isImageFile ? ((LucideIcons as any)[cat.image] || LucideIcons.FileText) : null;

              return (
                <Link
                  key={cat.id}
                  href={`/medicines?category=${cat.slug}`}
                  className="group rounded-2xl border border-slate-200 p-5 hover:shadow-xl hover:border-brand-400 transition-all flex flex-col gap-4 bg-white"
                >
                  {isImageFile ? (
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 shadow-inner overflow-hidden">
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-contain p-2" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: gradient }}>
                      {IconComp && <IconComp className="w-6 h-6" />}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 text-base leading-tight group-hover:text-brand-600 transition-colors">{cat.name}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed line-clamp-2">
                      {cat.description || `View all products for ${cat.name}`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    // </div>
  );
}
