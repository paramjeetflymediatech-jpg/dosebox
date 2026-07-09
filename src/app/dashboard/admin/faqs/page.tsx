'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, ArrowUpDown, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  isActive: boolean;
  displayOrder: number;
}

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    isActive: true,
    displayOrder: 0
  });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await fetch('/api/admin/faqs');
      const data = await res.json();
      if (data.success) {
        setFaqs(data.faqs);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast.error('Failed to fetch FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (faq?: FAQ) => {
    if (faq) {
      setEditingId(faq.id);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        isActive: faq.isActive,
        displayOrder: faq.displayOrder
      });
    } else {
      setEditingId(null);
      setFormData({
        question: '',
        answer: '',
        isActive: true,
        displayOrder: faqs.length > 0 ? Math.max(...faqs.map(f => f.displayOrder)) + 1 : 0
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/admin/faqs/${editingId}` : '/api/admin/faqs';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? 'FAQ updated' : 'FAQ created');
        setShowModal(false);
        fetchFaqs();
      } else {
        toast.error(data.message || 'Failed to save FAQ');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this FAQ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('FAQ deleted');
        fetchFaqs();
      } else {
        toast.error(data.message || 'Failed to delete FAQ');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const filteredFaqs = faqs.filter(f => 
    f.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFaqs.length / ITEMS_PER_PAGE);
  const paginatedFaqs = filteredFaqs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage FAQs</h1>
          <p className="text-slate-500 text-sm mt-1">Add, edit, and organize frequently asked questions.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 "
        >
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center mx-8">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search FAQs..."
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
          <div className="p-10 text-center text-slate-500">Loading FAQs...</div>
        ) : filteredFaqs.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No FAQs found.</div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="grid grid-cols-1 divide-y divide-slate-100 md:hidden">
              {paginatedFaqs.map((faq) => (
                <div key={faq.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="font-medium text-slate-900 line-clamp-2">{faq.question}</div>
                      <div className="text-slate-500 text-sm mt-1 line-clamp-2">{faq.answer}</div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-semibold text-slate-700 flex-shrink-0">
                      {faq.displayOrder}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      faq.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {faq.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {faq.isActive ? 'Active' : 'Hidden'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(faq)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
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
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Question</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedFaqs.map((faq) => (
                    <tr key={faq.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-semibold text-slate-700">
                          {faq.displayOrder}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 truncate max-w-sm">{faq.question}</div>
                        <div className="text-slate-500 text-xs truncate max-w-sm mt-1">{faq.answer}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          faq.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {faq.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {faq.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(faq)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(faq.id)}
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
      {!loading && filteredFaqs.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-2xl mx-8 shadow-sm">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Showing <span className="font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-semibold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredFaqs.length)}</span> of{' '}
                <span className="font-semibold">{filteredFaqs.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                      currentPage === i + 1 
                        ? 'z-10 bg-brand-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600' 
                        : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
          
          {/* Mobile Pagination */}
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-slate-700 self-center">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'Edit FAQ' : 'Add New FAQ'}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Question</label>
                  <input
                    type="text"
                    required
                    value={formData.question}
                    onChange={(e) => setFormData({...formData, question: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm"
                    placeholder="E.g. What is your return policy?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Answer</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.answer}
                    onChange={(e) => setFormData({...formData, answer: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm resize-none"
                    placeholder="E.g. We offer a 7-day return policy..."
                  ></textarea>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Display Order</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
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
                  Save FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
