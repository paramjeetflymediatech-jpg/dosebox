'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, Clock, User, Calendar, Tag, AlertCircle, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import api from '../../../lib/api';
import { toast } from 'react-hot-toast';

interface Blog {
  id: number;
  title: string;
  slug: string;
  content: string;
  category: string;
  tags?: string;
  readTime: string;
  coverImage?: string;
  createdAt: string;
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    
    async function loadBlog() {
      try {
        const res = await api.get(`/admin/blogs/${slug}`);
        if (res.data?.success) {
          setBlog(res.data.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to load blog:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    
    loadBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
        <div className="h-[400px] bg-slate-200 rounded-3xl mb-10"></div>
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-16 h-16 text-slate-300 mb-6" />
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Article Not Found</h1>
        <p className="text-slate-500 max-w-md mb-8">The medical article you are looking for does not exist or has been removed.</p>
        <Link href="/blogs" className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-bold transition-all">
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <Link href="/blogs" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-600 font-semibold mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to all articles
      </Link>

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
          <span className="text-brand-600 bg-brand-50 py-1 px-3 rounded-md">{blog.category}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {blog.readTime}</span>
          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(blog.createdAt).toLocaleDateString()}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-8">
          {blog.title}
        </h1>

        <div className="flex items-center gap-4 mb-10 pb-10 border-b border-slate-200">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Verified by Medical Team</p>
            <p className="text-xs text-slate-500">MrMed Clinical Pharmacy</p>
          </div>
        </div>

        {blog.coverImage && (
          <div className="mb-12 rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm relative group">
            <div className="absolute inset-0 bg-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
            <img 
              src={blog.coverImage} 
              alt={blog.title} 
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </div>
        )}

        <article 
          className="prose prose-slate prose-lg prose-headings:font-extrabold prose-a:text-brand-600 hover:prose-a:text-brand-700 max-w-none mb-16"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {blog.tags && (
          <div className="flex flex-wrap items-center gap-2 pt-8 border-t border-slate-200">
            <Tag className="w-4 h-4 text-slate-400 mr-2" />
            {blog.tags.split(',').map((tag, idx) => (
              <span key={idx} className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wider">
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="mt-16 bg-brand-50 border border-brand-100 rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8 justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600" /> Need Medical Advice?
            </h3>
            <p className="text-slate-600">Consult our verified doctors online to discuss your health conditions.</p>
          </div>
          <Link href="/doctors" className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-xl transition-all whitespace-nowrap shadow-sm">
            Book Consultation
          </Link>
        </div>
      </div>
    </div>
  );
}
