'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Clock, Tag, Search, ChevronRight, Sparkles, User
} from 'lucide-react';
import Link from 'next/link';
import api from '../../lib/api';

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

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadBlogs() {
      try {
        const res = await api.get('/admin/blogs');
        if (res.data?.success) {
          setBlogs(res.data.data);
        }
      } catch (err) {
        console.warn('Blogs API loading failed. Using fallback health posts.');
        setBlogs([
          {
            id: 1,
            title: 'Managing Type 2 Diabetes: A Life Guide',
            slug: 'managing-type-2-diabetes',
            content: 'Type 2 Diabetes is a chronic health condition that affects how your body processes sugar. With correct diets, regular physical exercises, and proper adherence to prescribed medicines like Metformin, you can easily control it and maintain a standard vibrant lifestyle...',
            category: 'Chronic Conditions',
            tags: 'Diabetes, Health, Guide',
            readTime: '6 mins',
            coverImage: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=600',
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            title: 'The Vital Role of Daily Multivitamins',
            slug: 'role-of-daily-multivitamins',
            content: 'Vitamins and minerals form the micro-structural blocks of our metabolic energy and cell defenses. If your daily busy diet is lacking clean balanced nutrients, clinical multivitamins like Centrum can help cover your trace deficiencies and keep you energized...',
            category: 'Nutrition & Wellness',
            tags: 'Vitamins, Supplement, Diet',
            readTime: '4 mins',
            coverImage: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=600',
            createdAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadBlogs();
  }, []);

  const categories = ['All', 'Chronic Conditions', 'Nutrition & Wellness', 'Lifestyle Guides'];
  
  const filteredBlogs = blogs.filter(blog => {
    const matchesCategory = selectedCategory === 'All' || blog.category === selectedCategory;
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          blog.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-6 uppercase tracking-wider">
          <Link href="/" className="hover:text-brand-600">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600">Health Blogs</span>
        </div>

        {/* Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 mb-10 overflow-hidden relative border border-slate-800 shadow-xl text-center sm:text-left">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 max-w-2xl">
            <span className="text-brand-400 font-bold text-xxs uppercase tracking-widest flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="w-4 h-4" />
              Medical Research & Articles
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold mt-3">MrMed Health Library</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed">
              Read verified articles, health management guides, and wellness tips reviewed by certified pharmacists.
            </p>
          </div>
        </div>

        {/* Filters and search block */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1.5 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-1.5 px-4 rounded-full font-bold text-xs transition-all border flex-shrink-0 ${selectedCategory === cat ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/50'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-xs">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-850 text-xs rounded-xl p-2.5 pl-9 focus:outline-none focus:border-brand-500"
            />
            <Search className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Blogs grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1,2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 h-80 animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
            <p className="text-slate-400 text-sm font-semibold">No medical articles found matching selection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredBlogs.map((blog) => (
              <div 
                key={blog.id}
                className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <img 
                    src={blog.coverImage || 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=600'} 
                    alt={blog.title}
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-xxs font-bold text-slate-400 uppercase tracking-widest mb-3">
                      <span className="text-brand-600 bg-brand-50 py-0.5 px-2 rounded">{blog.category}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {blog.readTime}</span>
                    </div>

                    <h2 className="font-extrabold text-slate-900 text-base sm:text-lg hover:underline leading-snug">
                      {blog.title}
                    </h2>
                    
                    <p className="text-xs text-slate-500 mt-2.5 line-clamp-3 leading-relaxed">
                      {blog.content}
                    </p>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-50 flex justify-between items-center bg-slate-50/20 text-xxs font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Checked by Pharmacist</span>
                  <span className="text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-0.5 cursor-pointer">
                    Read Full Guide <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
