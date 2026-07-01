'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../../../../../lib/api';
import Link from 'next/link';

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blogId, setBlogId] = useState<string | null>(null);
  const [blog, setBlog] = useState({
    title: '',
    slug: '',
    content: '',
    category: 'Nutrition & Wellness',
    readTime: '5 mins',
    coverImage: '',
    seoTitle: '',
    seoDescription: ''
  });

  useEffect(() => {
    // Next.js 15+ dynamic routes pass params as Promise
    params.then(p => {
      setBlogId(p.id);
      loadBlog(p.id);
    });
  }, [params]);

  const loadBlog = async (id: string) => {
    try {
      const res = await api.get(`/admin/blogs/id/${id}`);
      if (res.data.success) {
        setBlog({
          title: res.data.data.title || '',
          slug: res.data.data.slug || '',
          content: res.data.data.content || '',
          category: res.data.data.category || 'Nutrition & Wellness',
          readTime: res.data.data.readTime || '',
          coverImage: res.data.data.coverImage || '',
          seoTitle: res.data.data.seoTitle || '',
          seoDescription: res.data.data.seoDescription || ''
        });
      }
    } catch (err) {
      console.error('Failed to load blog', err);
      alert('Failed to load blog');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/blogs/${blogId}`, blog);
      router.push('/dashboard/admin/blogs');
    } catch (err) {
      console.error('Failed to update blog', err);
      alert('Failed to update blog');
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-slate-500 font-medium">Loading Blog Data...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin/blogs" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Edit Blog</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <form onSubmit={handleUpdateBlog} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required type="text" placeholder="Title" value={blog.title} onChange={e => setBlog({ ...blog, title: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
          <input required type="text" placeholder="Slug (e.g. healthy-eating)" value={blog.slug} onChange={e => setBlog({ ...blog, slug: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />

          <select value={blog.category} onChange={e => setBlog({ ...blog, category: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors">
            <option>Nutrition & Wellness</option>
            <option>Disease Management</option>
            <option>Vitamins & Supplements</option>
            <option>Mental Health</option>
          </select>

          <input required type="text" placeholder="Read Time (e.g. 5 mins)" value={blog.readTime} onChange={e => setBlog({ ...blog, readTime: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />

          <input required type="url" placeholder="Cover Image URL" value={blog.coverImage} onChange={e => setBlog({ ...blog, coverImage: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl md:col-span-2 focus:outline-none focus:border-brand-500 transition-colors" />

          <textarea required placeholder="Content (HTML/Text)" value={blog.content} onChange={e => setBlog({ ...blog, content: e.target.value })} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl md:col-span-2 h-64 resize-none focus:outline-none focus:border-brand-500 transition-colors"></textarea>

          <div className="md:col-span-2 mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="text-md font-semibold text-slate-700 mb-4">SEO Settings</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">SEO Title</label>
                <input type="text" placeholder="SEO Title" value={blog.seoTitle} onChange={e => setBlog({ ...blog, seoTitle: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">SEO Description</label>
                <textarea placeholder="SEO Description" value={blog.seoDescription} onChange={e => setBlog({ ...blog, seoDescription: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl h-24 resize-none focus:outline-none focus:border-brand-500 transition-colors"></textarea>
              </div>
            </div>
          </div>

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
