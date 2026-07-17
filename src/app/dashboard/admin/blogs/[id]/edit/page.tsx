'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, FileText, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const CustomEditor = dynamic(() => import('@/components/CustomEditor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 font-medium">Loading Editor...</div>
});

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
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    // Next.js 15+ dynamic routes pass params as Promise
    params.then(p => {
      setBlogId(p.id);
      loadBlog(p.id);
    });
  }, [params]);

  const loadBlog = async (id: string) => {
    try {
      const res = await api.get(`/admin/blogs/${id}`);
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

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingCover(true);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setBlog({ ...blog, coverImage: 'http://localhost:5000' + res.data.fileUrl });
      }
    } catch (err) {
      console.error('Failed to upload', err);
      alert('Failed to upload image');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleUpdateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blog.title || !blog.slug || !blog.content) {
      return alert('Please fill in all required fields (Title, Slug, Content).');
    }

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

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setBlog({ ...blog, title, slug });
  };

  if (loading) return <div className="p-6 text-slate-500 font-medium">Loading Blog Data...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin/blogs" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <FileText className="w-8 h-8 text-brand-600" /> Edit Blog
        </h1>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
        <div className="space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Basic Info */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Article Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Blog Title *</label>
                  <input required type="text" placeholder="e.g. Benefits of Vitamin C" value={blog.title} onChange={handleTitleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">URL Slug *</label>
                  <input required type="text" placeholder="e.g. benefits-of-vitamin-c" value={blog.slug} onChange={e => setBlog({ ...blog, slug: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
              </div>
            </div>

            {/* Categorization */}
            <div className="space-y-4 md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category *</label>
                  <select value={blog.category} onChange={e => setBlog({ ...blog, category: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors">
                    <option>Nutrition & Wellness</option>
                    <option>Disease Management</option>
                    <option>Vitamins & Supplements</option>
                    <option>Mental Health</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Read Time *</label>
                  <input required type="text" placeholder="e.g. 5 mins" value={blog.readTime} onChange={e => setBlog({ ...blog, readTime: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Cover Image URL *</label>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input required type="url" placeholder="https://..." value={blog.coverImage} onChange={e => setBlog({ ...blog, coverImage: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-bold uppercase">OR</span>
                      <label className={`cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200 ${uploadingCover ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingCover ? 'Uploading...' : 'Upload Local Image'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1 border-b border-slate-100 pb-2 text-lg mt-2">Article Content *</label>
              <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-brand-500 transition-colors bg-white">
                <style jsx global>{`
                  .ck-editor__editable {
                    min-height: 400px;
                    border: none !important;
                    box-shadow: none !important;
                  }
                  .ck-toolbar {
                    border: none !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    background-color: #f8fafc !important;
                  }
                `}</style>
                <CustomEditor value={blog.content} onChange={(val) => setBlog({ ...blog, content: val })} />
              </div>
            </div>

            {/* SEO Settings */}
            <div className="space-y-4 md:col-span-2 mt-4">
              <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200/60">
                <h4 className="text-md font-extrabold text-slate-800 mb-4">SEO Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Meta Title</label>
                    <input type="text" placeholder="SEO Title" value={blog.seoTitle} onChange={e => setBlog({ ...blog, seoTitle: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors shadow-sm" />
                    <p className="text-xs text-slate-400 mt-1.5">Optimal length: 50-60 characters</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Meta Description</label>
                    <textarea placeholder="SEO Description" value={blog.seoDescription} onChange={e => setBlog({ ...blog, seoDescription: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl h-24 resize-none focus:outline-none focus:border-brand-500 transition-colors shadow-sm"></textarea>
                    <p className="text-xs text-slate-400 mt-1.5">Optimal length: 150-160 characters</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button onClick={handleUpdateBlog} type="button" disabled={saving} className="px-8 py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> {saving ? 'Updating...' : 'Update Article'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
