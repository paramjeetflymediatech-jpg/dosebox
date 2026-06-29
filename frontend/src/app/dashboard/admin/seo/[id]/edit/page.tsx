'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../../../../../lib/api';
import Link from 'next/link';

export default function EditPageMetaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageMetaId, setPageMetaId] = useState<string | null>(null);
  
  const [pageMeta, setPageMeta] = useState({
    routePath: '',
    title: '',
    description: '',
    keywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: ''
  });

  useEffect(() => {
    params.then(p => {
      setPageMetaId(p.id);
      loadPageMeta(p.id);
    });
  }, [params]);

  const loadPageMeta = async (id: string) => {
    try {
      const res = await api.get(`/admin/page-meta/${id}`);
      if (res.data.success) {
        setPageMeta({
          routePath: res.data.data.routePath || '',
          title: res.data.data.title || '',
          description: res.data.data.description || '',
          keywords: res.data.data.keywords || '',
          ogTitle: res.data.data.ogTitle || '',
          ogDescription: res.data.data.ogDescription || '',
          ogImage: res.data.data.ogImage || ''
        });
      }
    } catch (err) {
      console.error('Failed to load SEO rule', err);
      alert('Failed to load SEO rule');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePageMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let formattedPath = pageMeta.routePath.trim();
      if (!formattedPath.startsWith('/')) {
        formattedPath = '/' + formattedPath;
      }
      
      await api.put(`/admin/page-meta/${pageMetaId}`, { ...pageMeta, routePath: formattedPath });
      router.push('/dashboard/admin/seo');
    } catch (err) {
      console.error('Failed to update SEO rule', err);
      alert('Failed to update SEO rule');
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-slate-500 font-medium">Loading SEO Rule...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin/seo" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Edit SEO Rule</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-3xl">
        <form onSubmit={handleUpdatePageMeta} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Route Path</label>
            <p className="text-xs text-slate-500 mb-2">The URL path where this SEO rule applies (e.g., <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">/contact</span>)</p>
            <input required type="text" placeholder="/your-route" value={pageMeta.routePath} onChange={e => setPageMeta({...pageMeta, routePath: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors font-mono" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Meta Title</label>
            <input required type="text" placeholder="Page Title" value={pageMeta.title} onChange={e => setPageMeta({...pageMeta, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Meta Description</label>
            <textarea required placeholder="Brief description for search engines..." value={pageMeta.description} onChange={e => setPageMeta({...pageMeta, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl h-24 resize-none focus:outline-none focus:border-brand-500 transition-colors"></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Meta Keywords</label>
            <p className="text-xs text-slate-500 mb-2">Comma separated keywords (e.g., pharmacy, medicines, online)</p>
            <input required type="text" placeholder="keyword1, keyword2" value={pageMeta.keywords} onChange={e => setPageMeta({...pageMeta, keywords: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
          </div>

          <hr className="border-slate-100 my-6" />
          
          <h3 className="text-lg font-bold text-slate-800">Open Graph (Social Media)</h3>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">OG Title</label>
            <input type="text" placeholder="Social Media Title" value={pageMeta.ogTitle} onChange={e => setPageMeta({...pageMeta, ogTitle: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">OG Description</label>
            <textarea placeholder="Social Media Description" value={pageMeta.ogDescription} onChange={e => setPageMeta({...pageMeta, ogDescription: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl h-24 resize-none focus:outline-none focus:border-brand-500 transition-colors"></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">OG Image URL</label>
            <input type="url" placeholder="https://example.com/image.jpg" value={pageMeta.ogImage} onChange={e => setPageMeta({...pageMeta, ogImage: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
          </div>
          
          <div className="pt-4 flex justify-end border-t border-slate-100">
            <button type="submit" disabled={saving} className="px-8 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
