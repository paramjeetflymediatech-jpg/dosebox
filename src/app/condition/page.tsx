'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';
import api from '@/lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

function getCategoryPhoto(cat: { name: string; slug?: string; image?: string | null }): string {
  const slug = (cat.slug || '').toLowerCase();
  const name = (cat.name || '').toLowerCase();

  if (cat.image && (cat.image.startsWith('/api/file/categories/') || cat.image.startsWith('/categories/'))) {
    return cat.image;
  }

  if (slug === 'allergy-medication' || name.includes('allergy')) return '/categories/allergy-medication.jpg';
  if (slug === 'alzheimers' || name.includes('alzheimer') || name.includes('dementia')) return '/categories/alzheimers.jpg';
  if (slug === 'anaesthetics' || name.includes('anaesthetic') || name.includes('anesthetic')) return '/categories/anaesthetics.jpg';
  if (slug === 'anemia' || name.includes('anemia')) return '/categories/anemia.jpg';
  if (slug === 'anti-cancer' || name.includes('cancer') || name.includes('oncology')) return '/categories/anti-cancer.jpg';
  if (slug === 'antibacterials' || name.includes('antibacterial') || name.includes('bacterial')) return '/categories/antibacterials.jpg';
  if (slug === 'anticoagulants' || name.includes('anticoagulant') || name.includes('coagulant')) return '/categories/anticoagulants.jpg';

  if (cat.image && (cat.image.startsWith('http://') || cat.image.startsWith('https://') || cat.image.startsWith('/'))) {
    return cat.image;
  }

  return '/categories/allergy-medication.jpg';
}

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
          <p className="text-slate-500 mt-2 max-w-xl text-sm sm:text-base">
            Browse our complete list of health conditions and specialty categories to find the exact medicines and verified generics you need.
          </p>
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
          Loading conditions...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No conditions found</h3>
          <p className="text-slate-500 text-sm">We couldn't find any condition matching &quot;{search}&quot;.</p>
          <button onClick={() => setSearch('')} className="mt-4 text-brand-600 font-bold hover:underline cursor-pointer">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {filteredCategories.map((cat) => {
            const photoUrl = getCategoryPhoto(cat);

            return (
              <Link
                key={cat.id}
                href={`/medicines?category=${cat.slug}`}
                className="group relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200/60 block"
              >
                {/* Background Photographic Image */}
                <img
                  src={photoUrl}
                  alt={cat.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=500';
                  }}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                />

                {/* Dark Gradient Overlay at Bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

                {/* Centered White Category Title at Bottom */}
                <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 text-center z-10">
                  <h4 className="font-bold text-white text-xs sm:text-sm md:text-base leading-snug drop-shadow-md">
                    {cat.name}
                  </h4>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
