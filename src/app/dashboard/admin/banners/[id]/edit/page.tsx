'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../../../../../lib/api';
import Link from 'next/link';

export default function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bannerId, setBannerId] = useState<string | null>(null);
  const [banner, setBanner] = useState({
    title: '',
    subtitle: '',
    image: '',
    link: '',
    type: 'Hero'
  });

  useEffect(() => {
    params.then(p => {
      setBannerId(p.id);
      loadBanner(p.id);
    });
  }, [params]);

  const loadBanner = async (id: string) => {
    try {
      const res = await api.get(`/admin/banners/${id}`);
      if (res.data.success) {
        setBanner({
          title: res.data.data.title || '',
          subtitle: res.data.data.subtitle || '',
          image: res.data.data.image || '',
          link: res.data.data.link || '',
          type: res.data.data.type || 'Hero'
        });
      }
    } catch (err) {
      console.error('Failed to load banner', err);
      alert('Failed to load banner');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/banners/${bannerId}`, banner);
      router.push('/dashboard/admin/banners');
    } catch (err) {
      console.error('Failed to update banner', err);
      alert('Failed to update banner');
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-slate-500 font-medium">Loading Banner Data...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin/banners" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Edit Banner</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <form onSubmit={handleUpdateBanner} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required type="text" placeholder="Banner Title" value={banner.title} onChange={e => setBanner({...banner, title: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
          
          <select value={banner.type} onChange={e => setBanner({...banner, type: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors">
            <option>Hero</option>
            <option>Promo</option>
          </select>
          
          <input type="text" placeholder="Subtitle (optional)" value={banner.subtitle} onChange={e => setBanner({...banner, subtitle: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl md:col-span-2 focus:outline-none focus:border-brand-500 transition-colors" />
          <input required type="url" placeholder="Image URL" value={banner.image} onChange={e => setBanner({...banner, image: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl md:col-span-2 focus:outline-none focus:border-brand-500 transition-colors" />
          <input required type="text" placeholder="Destination Link (e.g. /medicines)" value={banner.link} onChange={e => setBanner({...banner, link: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl md:col-span-2 focus:outline-none focus:border-brand-500 transition-colors" />
          
          <div className="md:col-span-2 mt-4 flex justify-end">
            <button type="submit" disabled={saving} className="px-8 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
