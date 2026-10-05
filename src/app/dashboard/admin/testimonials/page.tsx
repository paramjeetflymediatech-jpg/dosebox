'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, CheckCircle2, XCircle, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import Pagination from '../../../../components/admin/Pagination';

interface Testimonial {
  id: number;
  authorName: string;
  rating: number;
  text: string;
  relativeTime?: string;
  profileImage?: string;
  isActive: boolean;
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    authorName: '',
    rating: 5,
    text: '',
    relativeTime: '',
    profileImage: '',
    isActive: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await fetch('/api/admin/testimonials');
      const data = await res.json();
      if (data.success) {
        setTestimonials(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching Testimonials:', error);
      toast.error('Failed to fetch Testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingId(testimonial.id);
      setFormData({
        authorName: testimonial.authorName,
        rating: testimonial.rating,
        text: testimonial.text,
        relativeTime: testimonial.relativeTime || '',
        profileImage: testimonial.profileImage || '',
        isActive: testimonial.isActive
      });
      setImageFile(null);
    } else {
      setEditingId(null);
      setFormData({
        authorName: '',
        rating: 5,
        text: '',
        relativeTime: '',
        profileImage: '',
        isActive: true
      });
      setImageFile(null);
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/admin/testimonials/${editingId}` : '/api/admin/testimonials';
      const method = editingId ? 'PUT' : 'POST';
      
      const submitData = new FormData();
      submitData.append('authorName', formData.authorName);
      submitData.append('rating', formData.rating.toString());
      submitData.append('text', formData.text);
      submitData.append('relativeTime', formData.relativeTime);
      submitData.append('isActive', formData.isActive.toString());

      if (imageFile) {
        submitData.append('profileImage', imageFile);
      } else if (formData.profileImage) {
        submitData.append('profileImage', formData.profileImage);
      } else {
        submitData.append('profileImage', '');
      }

      const res = await fetch(url, {
        method,
        body: submitData
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? 'Testimonial updated' : 'Testimonial created');
        setShowModal(false);
        fetchTestimonials();
      } else {
        toast.error(data.message || data.error || 'Failed to save Testimonial');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this Testimonial?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Testimonial deleted');
        fetchTestimonials();
      } else {
        toast.error(data.message || data.error || 'Failed to delete Testimonial');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const filteredTestimonials = testimonials.filter(t => 
    t.authorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTestimonials.length / ITEMS_PER_PAGE);
  const paginatedTestimonials = filteredTestimonials.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Testimonials</h1>
          <p className="text-slate-500 text-sm mt-1">Add, edit, and organize customer reviews.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Testimonial
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center mx-8">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Testimonials..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mx-8">
        {loading ? (
          <div className="p-10 text-center text-slate-500">Loading Testimonials...</div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No Testimonials found.</div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="grid grid-cols-1 divide-y divide-slate-100 md:hidden">
              {paginatedTestimonials.map((testimonial) => (
                <div key={testimonial.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      {testimonial.profileImage ? (
                        <img src={testimonial.profileImage} alt={testimonial.authorName} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                          {testimonial.authorName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900">{testimonial.authorName}</div>
                        <div className="flex text-amber-400 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < testimonial.rating ? 'fill-current' : 'text-slate-200'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-slate-500 text-sm mt-1 line-clamp-2 italic">"{testimonial.text}"</div>
                  <div className="flex justify-between items-center pt-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      testimonial.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {testimonial.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {testimonial.isActive ? 'Active' : 'Hidden'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(testimonial)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(testimonial.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-medium">
                  <tr>
                    <th className="px-6 py-4">Author</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4">Review</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTestimonials.map((testimonial) => (
                    <tr key={testimonial.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {testimonial.profileImage ? (
                            <img src={testimonial.profileImage} alt={testimonial.authorName} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                              {testimonial.authorName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-slate-900">{testimonial.authorName}</div>
                            {testimonial.relativeTime && <div className="text-xs text-slate-500">{testimonial.relativeTime}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'fill-current' : 'text-slate-200'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-500 text-sm truncate max-w-sm italic">"{testimonial.text}"</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          testimonial.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {testimonial.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {testimonial.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(testimonial)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(testimonial.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="mx-4 md:mx-8 mt-6">
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTestimonials.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'Edit Testimonial' : 'Add New Testimonial'}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Author Name</label>
                  <input
                    type="text"
                    required
                    value={formData.authorName}
                    onChange={(e) => setFormData({...formData, authorName: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm"
                    placeholder="E.g. John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Review Text</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.text}
                    onChange={(e) => setFormData({...formData, text: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm resize-none"
                    placeholder="E.g. Excellent service and fast delivery!"
                  ></textarea>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Rating (1-5)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value) || 5})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Relative Time</label>
                    <input
                      type="text"
                      value={formData.relativeTime}
                      onChange={(e) => setFormData({...formData, relativeTime: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm"
                      placeholder="E.g. 2 days ago"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Profile Image</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex-shrink-0 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200 overflow-hidden">
                        {imageFile ? (
                          <img src={URL.createObjectURL(imageFile)} alt="preview" className="w-full h-full object-cover" />
                        ) : formData.profileImage ? (
                          <img src={formData.profileImage} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <Star className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setImageFile(e.target.files[0]);
                              setFormData({...formData, profileImage: ''});
                            }
                          }}
                          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 transition-colors cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.profileImage}
                          onChange={(e) => {
                            setFormData({...formData, profileImage: e.target.value});
                            if (e.target.value) setImageFile(null);
                          }}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm"
                          placeholder="Or enter image URL..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Active</span>
                  </label>
                </div>
              </div>
              
              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 font-medium rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-colors text-sm shadow-sm"
                >
                  Save Testimonial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
