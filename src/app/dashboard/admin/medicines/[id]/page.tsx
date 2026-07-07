'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Pill, ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import dynamic from 'next/dynamic';

const CustomEditor = dynamic(() => import('@/components/CustomEditor'), { ssr: false });

export default function EditMedicinePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: number, name: string }[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    images: [] as string[],
    genericName: '',
    manufacturer: '',
    composition: '',
    dosage: '',
    packSize: '',
    description: '',
    sideEffects: '',
    storageInstructions: '',
    papOffer: '',
    prescriptionRequired: false,
    price: '',
    discountPrice: '',
    stock: '0',
    categoryId: '',
    brandId: '',
    minStockAlertThreshold: '10',
    locationInWarehouse: '',
    sections: [] as { id?: number; title: string; content: string; sortOrder: number }[]
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, brandRes, medRes] = await Promise.all([
          api.get('/medicines/categories'),
          api.get('/medicines/brands'),
          api.get(`/medicines/${id}`)
        ]);

        if (catRes.data?.success) setCategories(catRes.data.data);
        if (brandRes.data?.success) setBrands(brandRes.data.data);

        if (medRes.data?.success) {
          const m = medRes.data.data;
          let parsedImages: string[] = [];
          try {
            parsedImages = m.images ? JSON.parse(m.images) : [];
          } catch (e) { }

          setFormData({
            name: m.name || '',
            images: parsedImages,
            genericName: m.genericName || '',
            manufacturer: m.manufacturer || '',
            composition: m.composition || '',
            dosage: m.dosage || '',
            packSize: m.packSize || '',
            description: m.description || '',
            sideEffects: m.sideEffects || '',
            storageInstructions: m.storageInstructions || '',
            papOffer: m.papOffer || '',
            prescriptionRequired: m.prescriptionRequired || false,
            price: m.price?.toString() || '',
            discountPrice: m.discountPrice?.toString() || '',
            stock: m.stock?.toString() || '0',
            categoryId: m.categoryId?.toString() || '',
            brandId: m.brandId?.toString() || '',
            minStockAlertThreshold: m.inventory?.minStockAlertThreshold?.toString() || '10',
            locationInWarehouse: m.inventory?.locationInWarehouse || '',
            sections: m.sections ? [...m.sections].sort((a: any, b: any) => a.sortOrder - b.sortOrder) : []
          });
        }
      } catch (err) {
        console.error('Failed to load medicine data', err);
        alert('Could not load medicine details.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setFormData({ ...formData, images: [...formData.images, imageUrlInput.trim()] });
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const uploadedUrls: string[] = [];

    try {
      const token = localStorage.getItem('accessToken');
      
      // Upload files sequentially or in parallel. Let's do sequentially to avoid overwhelming the server if there are many.
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fd = new FormData();
        fd.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd
        });
        const data = await res.json();

        if (res.ok && data.success) {
          uploadedUrls.push(data.fileUrl);
        } else {
          alert(`Upload failed for ${file.name}: ${data.message || 'Unknown error'}`);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      }
    } catch (err) {
      console.error('Image upload failed', err);
      alert('Failed to upload image(s)');
    } finally {
      setUploadingImage(false);
      e.target.value = ''; // Reset input
    }
  };

  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, { title: '', content: '', sortOrder: prev.sections.length }]
    }));
  };

  const removeSection = (index: number) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections.splice(index, 1);
      return { ...prev, sections: newSections };
    });
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    setFormData(prev => {
      const newSections = [...prev.sections];
      const temp = newSections[index - 1];
      newSections[index - 1] = newSections[index];
      newSections[index] = temp;
      return { ...prev, sections: newSections };
    });
  };

  const moveSectionDown = (index: number) => {
    if (index === formData.sections.length - 1) return;
    setFormData(prev => {
      const newSections = [...prev.sections];
      const temp = newSections[index + 1];
      newSections[index + 1] = newSections[index];
      newSections[index] = temp;
      return { ...prev, sections: newSections };
    });
  };

  const updateSection = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections[index] = { ...newSections[index], [field]: value };
      return { ...prev, sections: newSections };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || !formData.brandId || !formData.price) {
      return alert('Please fill all required fields');
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        images: JSON.stringify(formData.images),
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
        stock: Number(formData.stock),
        categoryId: Number(formData.categoryId),
        brandId: Number(formData.brandId),
        minStockAlertThreshold: Number(formData.minStockAlertThreshold),
        sections: formData.sections.map((s, i) => ({ ...s, sortOrder: i }))
      };

      await api.put(`/medicines/${id}`, payload);
      router.push('/dashboard/admin/medicines');
    } catch (err) {
      console.error('Failed to update medicine', err);
      alert('Failed to update medicine');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Loading medicine details...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin/medicines" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Pill className="w-8 h-8 text-brand-600" /> Edit Medicine
        </h1>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Basic Info */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Medicine Name *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="e.g. Crocin Pain Relief" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Generic Name *</label>
                  <input type="text" value={formData.genericName} onChange={e => setFormData({ ...formData, genericName: e.target.value })} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="e.g. Paracetamol" />
                </div>
              </div>

              {/* Image Upload */}
              <div className="pt-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Medicine Images</label>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1 w-full flex gap-2">
                    <input 
                      type="text" 
                      value={imageUrlInput} 
                      onChange={e => setImageUrlInput(e.target.value)} 
                      placeholder="Paste image URL here..." 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
                    />
                    <button 
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-4 py-2.5 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 transition-colors shrink-0"
                    >
                      Add URL
                    </button>
                  </div>
                  <div className="text-sm font-bold text-slate-400">OR</div>
                  <div className="relative flex-shrink-0">
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingImage}
                    />
                    <div className="px-6 py-2.5 bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center pointer-events-none">
                      {uploadingImage ? 'Uploading...' : 'Upload Images'}
                    </div>
                  </div>
                </div>
                
                {formData.images.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-4">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group p-2 border border-slate-200 rounded-xl bg-slate-50">
                        <img src={img} alt={`Preview ${idx+1}`} className="h-24 w-24 object-contain mix-blend-multiply" />
                        <button 
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Classification */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Classification</h3>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category *</label>
                <select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Brand *</label>
                <select value={formData.brandId} onChange={e => setFormData({ ...formData, brandId: e.target.value })} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500">
                  <option value="">Select Brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Manufacturer *</label>
                <input type="text" value={formData.manufacturer} onChange={e => setFormData({ ...formData, manufacturer: e.target.value })} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Manufacturer Name" />
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Pricing & Inventory</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">MRP Price (₹) *</label>
                  <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Discount Price (₹)</label>
                  <input type="number" step="0.01" value={formData.discountPrice} onChange={e => setFormData({ ...formData, discountPrice: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="Optional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Current Stock *</label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Low Stock Alert at</label>
                  <input type="number" value={formData.minStockAlertThreshold} onChange={e => setFormData({ ...formData, minStockAlertThreshold: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input type="checkbox" id="rx" checked={formData.prescriptionRequired} onChange={e => setFormData({ ...formData, prescriptionRequired: e.target.checked })} className="w-5 h-5 text-brand-600 rounded border-slate-300 focus:ring-brand-500" />
                <label htmlFor="rx" className="text-sm font-bold text-slate-700 cursor-pointer">Doctor Prescription Required (Rx)</label>
              </div>
            </div>

            {/* Clinical Info */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Clinical Details</h3>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Active Composition *</label>
                <input type="text" value={formData.composition} onChange={e => setFormData({ ...formData, composition: e.target.value })} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="e.g. Paracetamol IP 650mg" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Dosage Guidelines *</label>
                <input type="text" value={formData.dosage} onChange={e => setFormData({ ...formData, dosage: e.target.value })} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="e.g. 1 tablet twice a day" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-brand-500">
                  <CustomEditor 
                    value={formData.description} 
                    onChange={data => setFormData({...formData, description: data})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Side Effects</label>
                  <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-brand-500">
                    <CustomEditor 
                      value={formData.sideEffects} 
                      onChange={data => setFormData({...formData, sideEffects: data})} 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Storage Instructions</label>
                  <textarea value={formData.storageInstructions} onChange={e => setFormData({ ...formData, storageInstructions: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="e.g. Store in a cool dry place..."></textarea>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Pack Size</label>
                  <input type="text" value={formData.packSize} onChange={e => setFormData({ ...formData, packSize: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500" placeholder="e.g. 1 AMPOULE(s) OF 5ML" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">PAP Offer <span className="text-slate-400 font-normal text-xs">(Patient Assistance Program)</span></label>
                  <input
                    type="text"
                    value={formData.papOffer}
                    onChange={e => setFormData({ ...formData, papOffer: e.target.value })}
                    className="w-full px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Buy 3, Get 1 Free. Contact us for latest updates."
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Dynamic Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-bold text-slate-800">Dynamic Page Sections</h3>
              <button type="button" onClick={addSection} className="px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors">
                <Plus className="w-4 h-4" /> Add Section
              </button>
            </div>
            
            {formData.sections.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                <p className="text-slate-500 text-sm">No dynamic sections added yet. Click &quot;Add Section&quot; to create layout blocks like &quot;Fact Box&quot; or &quot;Safety Advices&quot;.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.sections.map((sec, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 relative group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 w-full sm:w-1/2">
                        <span className="flex items-center justify-center w-6 h-6 bg-slate-200 text-slate-600 rounded-full text-xs font-bold shrink-0">{idx + 1}</span>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => updateSection(idx, 'title', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500 font-semibold text-slate-800"
                          placeholder="Section Title (e.g., Introduction)"
                          required
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => moveSectionUp(idx)} disabled={idx === 0} className="p-1.5 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md border border-slate-200 disabled:opacity-50 transition-colors">
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => moveSectionDown(idx)} disabled={idx === formData.sections.length - 1} className="p-1.5 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md border border-slate-200 disabled:opacity-50 transition-colors">
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => removeSection(idx)} className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-md transition-colors ml-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Section Content</label>
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-brand-500">
                        <CustomEditor
                          value={sec.content}
                          onChange={(data) => updateSection(idx, 'content', data)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-slate-100">
            <Link href="/dashboard/admin/medicines" className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors">
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-8 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
