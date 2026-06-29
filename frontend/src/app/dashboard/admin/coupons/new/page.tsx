'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../../../../lib/api';
import Link from 'next/link';

export default function NewCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'Percentage',
    discountValue: '',
    minOrderValue: '',
    expiryDate: ''
  });

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/coupons', newCoupon);
      router.push('/dashboard/admin/coupons');
    } catch (err) {
      console.error('Failed to create coupon', err);
      alert('Failed to create coupon');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin/coupons" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Create New Coupon</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required type="text" placeholder="Coupon Code (e.g. SUMMER20)" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors uppercase" />
          
          <select value={newCoupon.discountType} onChange={e => setNewCoupon({...newCoupon, discountType: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors">
            <option>Percentage</option>
            <option>Fixed</option>
          </select>
          
          <input required type="number" placeholder="Discount Value" value={newCoupon.discountValue} onChange={e => setNewCoupon({...newCoupon, discountValue: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
          <input required type="number" placeholder="Min Order Value" value={newCoupon.minOrderValue} onChange={e => setNewCoupon({...newCoupon, minOrderValue: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
          <input required type="date" value={newCoupon.expiryDate} onChange={e => setNewCoupon({...newCoupon, expiryDate: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl md:col-span-2 focus:outline-none focus:border-brand-500 transition-colors" />
          
          <div className="md:col-span-2 mt-4 flex justify-end">
            <button type="submit" disabled={loading} className="px-8 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Add Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
