'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../../../../lib/api';
import Link from 'next/link';

export default function NewBannerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newBanner, setNewBanner] = useState({
    title: '',
    subtitle: '',
    image: '',
    link: '',
    type: 'Hero'
  });

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/banners', newBanner);
      router.push('/dashboard/admin/banners');
    } catch (err) {
      console.error('Failed to create banner', err);
      alert('Failed to create banner');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin/banners" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Create New Banner</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <form onSubmit={handleCreateBanner} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required type="text" placeholder="Banner Title" value={newBanner.title} onChange={e => setNewBanner({...newBanner, title: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
          
          <select value={newBanner.type} onChange={e => setNewBanner({...newBanner, type: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors">
            <option>Hero</option>
            <option>Promo</option>
          </select>
          
          <input type="text" placeholder="Subtitle (optional)" value={newBanner.subtitle} onChange={e => setNewBanner({...newBanner, subtitle: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl md:col-span-2 focus:outline-none focus:border-brand-500 transition-colors" />
          <input required type="url" placeholder="Image URL" value={newBanner.image} onChange={e => setNewBanner({...newBanner, image: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl md:col-span-2 focus:outline-none focus:border-brand-500 transition-colors" />
          <input required type="text" placeholder="Destination Link (e.g. /medicines)" value={newBanner.link} onChange={e => setNewBanner({...newBanner, link: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl md:col-span-2 focus:outline-none focus:border-brand-500 transition-colors" />
          
          <div className="md:col-span-2 mt-4 flex justify-end">
            <button type="submit" disabled={loading} className="px-8 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> {loading ? 'Publishing...' : 'Publish Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
