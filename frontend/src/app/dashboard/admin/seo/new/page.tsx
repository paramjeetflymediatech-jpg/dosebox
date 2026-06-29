'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../../../../lib/api';
import Link from 'next/link';

export default function NewPageMetaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newPageMeta, setNewPageMeta] = useState({
    routePath: '',
    title: '',
    description: '',
    keywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: ''
  });

  const handleCreatePageMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // routePath should ideally start with a slash
      let formattedPath = newPageMeta.routePath.trim();
      if (!formattedPath.startsWith('/')) {
        formattedPath = '/' + formattedPath;
      }
      
      await api.post('/admin/page-meta', { ...newPageMeta, routePath: formattedPath });
      router.push('/dashboard/admin/seo');
    } catch (err) {
      console.error('Failed to create SEO rule', err);
      alert('Failed to create SEO rule');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin/seo" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Create New SEO Rule</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-3xl">
        <form onSubmit={handleCreatePageMeta} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Route Path</label>
            <p className="text-xs text-slate-500 mb-2">The URL path where this SEO rule applies (e.g., <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">/contact</span> or <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">/</span> for home)</p>
            <input required type="text" placeholder="/your-route" value={newPageMeta.routePath} onChange={e => setNewPageMeta({...newPageMeta, routePath: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors font-mono" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Meta Title</label>
            <input required type="text" placeholder="Page Title" value={newPageMeta.title} onChange={e => setNewPageMeta({...newPageMeta, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Meta Description</label>
            <textarea required placeholder="Brief description for search engines..." value={newPageMeta.description} onChange={e => setNewPageMeta({...newPageMeta, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl h-24 resize-none focus:outline-none focus:border-brand-500 transition-colors"></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Meta Keywords</label>
            <p className="text-xs text-slate-500 mb-2">Comma separated keywords (e.g., pharmacy, medicines, online)</p>
            <input required type="text" placeholder="keyword1, keyword2" value={newPageMeta.keywords} onChange={e => setNewPageMeta({...newPageMeta, keywords: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
          </div>
          
          <hr className="border-slate-100 my-6" />
          
          <h3 className="text-lg font-bold text-slate-800">Open Graph (Social Media)</h3>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">OG Title</label>
            <input type="text" placeholder="Social Media Title" value={newPageMeta.ogTitle} onChange={e => setNewPageMeta({...newPageMeta, ogTitle: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">OG Description</label>
            <textarea placeholder="Social Media Description" value={newPageMeta.ogDescription} onChange={e => setNewPageMeta({...newPageMeta, ogDescription: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl h-24 resize-none focus:outline-none focus:border-brand-500 transition-colors"></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">OG Image URL</label>
            <input type="url" placeholder="https://example.com/image.jpg" value={newPageMeta.ogImage} onChange={e => setNewPageMeta({...newPageMeta, ogImage: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
          </div>
          
          <div className="pt-4 flex justify-end border-t border-slate-100">
            <button type="submit" disabled={loading} className="px-8 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Add SEO Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
