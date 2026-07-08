'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, FileText, Edit, Search } from 'lucide-react';
import api from '../../../../lib/api';
import Link from 'next/link';
import Pagination from '../../../../components/admin/Pagination';

interface Blog {
  id: number;
  title: string;
  slug: string;
  category: string;
  createdAt: string;
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');

  const loadBlogs = async () => {
    try {
      const res = await api.get('/admin/blogs');
      setBlogs(res.data.data);
    } catch (err) {
      console.error('Failed to load blogs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const handleDeleteBlog = async (id: number) => {
    if(!confirm('Are you sure you want to delete this blog?')) return;
    try {
      await api.delete(`/admin/blogs/${id}`);
      loadBlogs();
    } catch (err) {
      console.error('Failed to delete blog', err);
    }
  };

  if (loading) return <div className="p-6 text-slate-500 font-medium">Loading Blogs...</div>;

  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <FileText className="w-8 h-8 text-brand-600" /> Manage Blogs
        </h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <Link 
            href="/dashboard/admin/blogs/new" 
            className="px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> New Blog
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold">Title</th>
                <th className="py-4 px-6 font-semibold">Category</th>
                <th className="py-4 px-6 font-semibold">Date</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(blog => (
                <tr key={blog.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-6 font-medium text-slate-800">{blog.title}</td>
                  <td className="py-4 px-6 text-slate-600">
                    <span className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg text-sm font-medium">
                      {blog.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{new Date(blog.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/dashboard/admin/blogs/${blog.id}/edit`} 
                        className="p-2 text-slate-400 rounded-lg transition-colors" 
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button 
                        onClick={() => handleDeleteBlog(blog.id)} 
                        className="p-2 text-slate-400 rounded-lg transition-colors" 
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBlogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    No blogs found. Create your first blog!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="-mx-px -mb-px">
          <Pagination 
            currentPage={currentPage}
            totalPages={Math.ceil(filteredBlogs.length / itemsPerPage)}
            totalItems={filteredBlogs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
