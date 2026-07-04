'use client';

import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Tag, Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('FileText');
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      if (res.data?.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setIcon('FileText');
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setIcon(cat.image || 'FileText');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error('Error deleting category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, slug, description, image: icon };
      if (editCategory) {
        await api.put(`/admin/categories/${editCategory.id}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/admin/categories', payload);
        toast.success('Category created');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving category');
    } finally {
      setSaving(false);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editCategory) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  if (loading) return <div className="p-6 text-slate-500 font-medium">Loading Categories...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Tag className="w-8 h-8 text-brand-600" /> Manage Categories
        </h1>
        <button 
          onClick={openAddModal}
          className="px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> New Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map(cat => {
          const IconComp = (LucideIcons as any)[cat.image] || Tag;
          return (
            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group p-5 flex flex-col gap-4 hover:shadow-md hover:border-brand-300 transition-all">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-brand-500 to-brand-700 shadow-inner">
                  <IconComp className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEditModal(cat)} 
                    className="p-1.5 bg-slate-50 text-brand-600 hover:bg-brand-100 rounded-full transition-colors" 
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id)} 
                    className="p-1.5 bg-slate-50 text-rose-500 hover:bg-rose-100 rounded-full transition-colors" 
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg leading-tight">{cat.name}</h4>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">/{cat.slug}</p>
                <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed line-clamp-2">{cat.description || 'No description'}</p>
              </div>
            </div>
          );
        })}
        {categories.length === 0 && (
          <div className="md:col-span-2 lg:col-span-4 py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
            <Tag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            No categories found. Create your first category!
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-extrabold text-slate-900">{editCategory ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-800 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Category Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Icon Name (Lucide)</label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 flex-shrink-0 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 border border-brand-100 shadow-inner">
                    {React.createElement((LucideIcons as any)[icon] || LucideIcons.HelpCircle, { className: 'w-7 h-7' })}
                  </div>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="e.g. Stethoscope, Pill, Heart..."
                    className="flex-1 bg-white border border-slate-200 text-slate-900 text-sm font-semibold rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">Type any valid Lucide React icon name (e.g., Activity, Shield, Cross). The preview will update automatically.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
