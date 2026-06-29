'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../../../../../lib/api';
import Link from 'next/link';

export default function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [coupon, setCoupon] = useState({
    code: '',
    discountType: 'Percentage',
    discountValue: '',
    minOrderValue: '',
    expiryDate: ''
  });

  useEffect(() => {
    params.then(p => {
      setCouponId(p.id);
      loadCoupon(p.id);
    });
  }, [params]);

  const loadCoupon = async (id: string) => {
    try {
      const res = await api.get(`/admin/coupons/${id}`);
      if (res.data.success) {
        // format date for input type="date"
        let formattedDate = '';
        if (res.data.data.expiryDate) {
          formattedDate = new Date(res.data.data.expiryDate).toISOString().split('T')[0];
        }
        
        setCoupon({
          code: res.data.data.code || '',
          discountType: res.data.data.discountType || 'Percentage',
          discountValue: res.data.data.discountValue || '',
          minOrderValue: res.data.data.minOrderValue || '',
          expiryDate: formattedDate
        });
      }
    } catch (err) {
      console.error('Failed to load coupon', err);
      alert('Failed to load coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/coupons/${couponId}`, coupon);
      router.push('/dashboard/admin/coupons');
    } catch (err) {
      console.error('Failed to update coupon', err);
      alert('Failed to update coupon');
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-slate-500 font-medium">Loading Coupon Data...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin/coupons" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Edit Coupon</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <form onSubmit={handleUpdateCoupon} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required type="text" placeholder="Coupon Code (e.g. SUMMER20)" value={coupon.code} onChange={e => setCoupon({...coupon, code: e.target.value.toUpperCase()})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors uppercase" />
          
          <select value={coupon.discountType} onChange={e => setCoupon({...coupon, discountType: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors">
            <option>Percentage</option>
            <option>Fixed</option>
          </select>
          
          <input required type="number" placeholder="Discount Value" value={coupon.discountValue} onChange={e => setCoupon({...coupon, discountValue: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
          <input required type="number" placeholder="Min Order Value" value={coupon.minOrderValue} onChange={e => setCoupon({...coupon, minOrderValue: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
          <input required type="date" value={coupon.expiryDate} onChange={e => setCoupon({...coupon, expiryDate: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl md:col-span-2 focus:outline-none focus:border-brand-500 transition-colors" />
          
          <div className="md:col-span-2 mt-4 flex justify-end">
            <button type="submit" disabled={saving} className="px-8 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
