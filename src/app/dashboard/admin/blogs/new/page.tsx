'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, FileText, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const CustomEditor = dynamic(() => import('@/components/CustomEditor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 font-medium">Loading Editor...</div>
});

export default function NewBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newBlog, setNewBlog] = useState({
    title: '',
    slug: '',
    content: '',
    category: 'Nutrition & Wellness',
    coverImage: '',
    seoTitle: '',
    seoDescription: ''
  });
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingCover(true);
    try {
      // You must send multipart/form-data for files
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setNewBlog({ ...newBlog, coverImage: 'http://localhost:5000' + res.data.fileUrl });
      }
    } catch (err) {
      console.error('Failed to upload', err);
      alert('Failed to upload image');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlog.title || !newBlog.slug || !newBlog.content) {
      return alert('Please fill in all required fields (Title, Slug, Content).');
    }

    setLoading(true);
    try {
      await api.post('/admin/blogs', newBlog);
      router.push('/dashboard/admin/blogs');
    } catch (err) {
      console.error('Failed to create blog', err);
      alert('Failed to create blog');
      setLoading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setNewBlog({ ...newBlog, title, slug });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin/blogs" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <FileText className="w-8 h-8 text-brand-600" /> Create New Blog
        </h1>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
        <form onSubmit={handleCreateBlog} className="space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Basic Info */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Article Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Blog Title *</label>
                  <input required type="text" placeholder="e.g. Benefits of Vitamin C" value={newBlog.title} onChange={handleTitleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">URL Slug *</label>
                  <input required type="text" placeholder="e.g. benefits-of-vitamin-c" value={newBlog.slug} onChange={e => setNewBlog({ ...newBlog, slug: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
              </div>
            </div>

            {/* Categorization */}
            <div className="space-y-4 md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category *</label>
                  <select value={newBlog.category} onChange={e => setNewBlog({ ...newBlog, category: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors">
                    <option>Nutrition & Wellness</option>
                    <option>Disease Management</option>
                    <option>Vitamins & Supplements</option>
                    <option>Mental Health</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Cover Image URL *</label>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input required type="url" placeholder="https://..." value={newBlog.coverImage} onChange={e => setNewBlog({ ...newBlog, coverImage: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
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
                <CustomEditor value={newBlog.content} onChange={(val) => setNewBlog({ ...newBlog, content: val })} />
              </div>
            </div>

            {/* SEO Settings */}
            <div className="space-y-4 md:col-span-2 mt-4">
              <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200/60">
                <h4 className="text-md font-extrabold text-slate-800 mb-4">SEO Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Meta Title</label>
                    <input type="text" placeholder="SEO Title" value={newBlog.seoTitle} onChange={e => setNewBlog({ ...newBlog, seoTitle: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors shadow-sm" />
                    <p className="text-xs text-slate-400 mt-1.5">Optimal length: 50-60 characters</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Meta Description</label>
                    <textarea placeholder="SEO Description" value={newBlog.seoDescription} onChange={e => setNewBlog({ ...newBlog, seoDescription: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl h-24 resize-none focus:outline-none focus:border-brand-500 transition-colors shadow-sm"></textarea>
                    <p className="text-xs text-slate-400 mt-1.5">Optimal length: 150-160 characters</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button type="submit" disabled={loading} className="px-8 py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> {loading ? 'Publishing...' : 'Publish Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

