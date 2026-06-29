'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pill, ArrowLeft, Save } from 'lucide-react';
import api from '@/lib/api';

export default function NewMedicinePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [brands, setBrands] = useState<{id: number, name: string}[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    composition: '',
    dosage: '',
    description: '',
    sideEffects: '',
    storageInstructions: '',
    prescriptionRequired: false,
    price: '',
    discountPrice: '',
    stock: '0',
    categoryId: '',
    brandId: '',
    minStockAlertThreshold: '10',
    locationInWarehouse: ''
  });

  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/medicines/categories'),
          api.get('/medicines/brands')
        ]);
        if (catRes.data?.success) setCategories(catRes.data.data);
        if (brandRes.data?.success) setBrands(brandRes.data.data);
      } catch (err) {
        console.error('Failed to load form metadata', err);
      }
    }
    loadMeta();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || !formData.brandId || !formData.price) {
      return alert('Please fill all required fields');
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
        stock: Number(formData.stock),
        categoryId: Number(formData.categoryId),
        brandId: Number(formData.brandId),
        minStockAlertThreshold: Number(formData.minStockAlertThreshold)
      };

      await api.post('/medicines', payload);
      router.push('/dashboard/admin/medicines');
    } catch (err) {
      console.error('Failed to create medicine', err);
      alert('Failed to save medicine');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin/medicines" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Pill className="w-8 h-8 text-brand-600" /> Add New Medicine
        </h1>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Basic Info */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Medicine Name *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="e.g. Crocin Pain Relief" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Generic Name *</label>
                  <input type="text" value={formData.genericName} onChange={e => setFormData({...formData, genericName: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="e.g. Paracetamol" />
                </div>
              </div>
            </div>

            {/* Classification */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Classification</h3>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category *</label>
                <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Brand *</label>
                <select value={formData.brandId} onChange={e => setFormData({...formData, brandId: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500">
                  <option value="">Select Brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Manufacturer *</label>
                <input type="text" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Manufacturer Name" />
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Pricing & Inventory</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">MRP Price (₹) *</label>
                  <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Discount Price (₹)</label>
                  <input type="number" step="0.01" value={formData.discountPrice} onChange={e => setFormData({...formData, discountPrice: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Optional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Current Stock *</label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Low Stock Alert at</label>
                  <input type="number" value={formData.minStockAlertThreshold} onChange={e => setFormData({...formData, minStockAlertThreshold: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input type="checkbox" id="rx" checked={formData.prescriptionRequired} onChange={e => setFormData({...formData, prescriptionRequired: e.target.checked})} className="w-5 h-5 text-brand-600 rounded border-slate-300 focus:ring-brand-500" />
                <label htmlFor="rx" className="text-sm font-bold text-slate-700 cursor-pointer">Doctor Prescription Required (Rx)</label>
              </div>
            </div>

            {/* Clinical Info */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Clinical Details</h3>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Active Composition *</label>
                <input type="text" value={formData.composition} onChange={e => setFormData({...formData, composition: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="e.g. Paracetamol IP 650mg" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Dosage Guidelines *</label>
                <input type="text" value={formData.dosage} onChange={e => setFormData({...formData, dosage: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="e.g. 1 tablet twice a day" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Medicine description..."></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Side Effects</label>
                  <textarea value={formData.sideEffects} onChange={e => setFormData({...formData, sideEffects: e.target.value})} rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="List common side effects..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Storage Instructions</label>
                  <textarea value={formData.storageInstructions} onChange={e => setFormData({...formData, storageInstructions: e.target.value})} rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="e.g. Store in a cool dry place..."></textarea>
                </div>
              </div>
            </div>
            
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md shadow-brand-500/20 disabled:opacity-70 flex items-center gap-2"
            >
              {saving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Medicine</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
