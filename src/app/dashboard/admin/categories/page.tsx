'use client';

import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Tag, Plus, Edit, Trash2, X, RefreshCw, Upload, Image as ImageIcon } from 'lucide-react';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';
import Pagination from '../../../../components/admin/Pagination';
import Swal from 'sweetalert2';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive?: boolean;
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
  const [icon, setIcon] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleSyncCategories = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/admin/categories/sync');
      if (res.data?.success) {
        toast.success(res.data.message || 'Categories & medicines synced successfully!');
        fetchCategories();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to sync categories');
    } finally {
      setSyncing(false);
    }
  };

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
    setIcon('');
    setIsActive(true);
    setImageFile(null);
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setIcon(cat.image || '');
    setIsActive(cat.isActive ?? true);
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this category?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
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
      const formData = new FormData();
      formData.append('name', name);
      formData.append('slug', slug);
      formData.append('description', description);
      formData.append('isActive', isActive.toString());
      
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (icon) {
        formData.append('image', icon);
      }

      if (editCategory) {
        await api.put(`/admin/categories/${editCategory.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Category updated');
      } else {
        await api.post('/admin/categories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
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

  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const currentItems = categories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <div className="p-6 text-slate-500 font-medium">Loading Categories...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Tag className="w-8 h-8 text-brand-600" /> Manage Categories
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={handleSyncCategories}
            disabled={syncing}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold rounded-xl transition-colors shadow-2xs flex items-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            title="Automatically activate all categories with active medicines and auto-map medicines by salt"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Auto-Assign Medicines & Sync'}
          </button>
          <button 
            onClick={openAddModal}
            className="px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5" /> New Category
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentItems.map(cat => {
          const previewImg = cat.image || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400';
          return (
            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group flex flex-col hover:shadow-lg transition-all">
              {/* Card Photo Preview with dark gradient */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                <img 
                  src={previewImg} 
                  alt={cat.name} 
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400'; }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-3 right-3 text-white font-bold text-sm drop-shadow truncate">
                  {cat.name}
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shadow-xs ${cat.isActive !== false ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-200'}`}>
                    {cat.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Info & Actions */}
              <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400">/{cat.slug}</span>
                    <div className="flex gap-1.5 items-center">
                      <button 
                        onClick={() => openEditModal(cat)} 
                        className="p-1.5 bg-slate-50 text-brand-600 hover:bg-brand-100 rounded-lg transition-colors border border-slate-200 cursor-pointer" 
                        title="Edit Category & Image"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)} 
                        className="p-1.5 bg-slate-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors border border-slate-200 cursor-pointer" 
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {cat.description && (
                    <p className="text-xs text-slate-500 font-medium mt-2 line-clamp-2">{cat.description}</p>
                  )}
                </div>
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

      <div className="mt-8 -mx-4 md:-mx-8">
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={categories.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
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
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-700 mb-2">
                  Category Card Image / Photo
                </label>
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col sm:flex-row items-center gap-4">
                  {/* Live preview card matching home page */}
                  <div className="relative w-28 h-28 aspect-square rounded-2xl overflow-hidden bg-slate-900 flex-shrink-0 shadow-md border border-slate-200">
                    <img
                      src={
                        imageFile
                          ? URL.createObjectURL(imageFile)
                          : icon || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400'
                      }
                      alt="Preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400';
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
                    <div className="absolute bottom-1.5 inset-x-0 px-2 text-center">
                      <span className="text-[10px] font-bold text-white drop-shadow block truncate">
                        {name || 'Category Name'}
                      </span>
                    </div>
                  </div>

                  {/* Upload controls */}
                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-1">Upload Photo File</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setImageFile(e.target.files[0]);
                          }
                        }}
                        className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#108098] file:text-white hover:file:bg-[#0c6b80] transition-colors cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-1">Or Paste Image URL</span>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/... or /uploads/..."
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#108098]/20 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Upload a photo to be displayed as the full-bleed card background on the home page Specialty section.
                </p>
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

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </div>
                  <span className="text-sm font-bold text-slate-700">Category is Active</span>
                </label>
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
