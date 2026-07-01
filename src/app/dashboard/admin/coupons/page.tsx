'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Edit } from 'lucide-react';
import api from '../../../../lib/api';
import Link from 'next/link';

interface Coupon {
  id: number;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  expiryDate: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadCoupons = async () => {
    try {
      const res = await api.get('/admin/coupons');
      setCoupons(res.data.data);
    } catch (err) {
      console.error('Failed to load coupons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleDeleteCoupon = async (id: number) => {
    if(!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      loadCoupons();
    } catch (err) {
      console.error('Failed to delete coupon', err);
    }
  };

  if (loading) return <div className="p-6 text-slate-500 font-medium">Loading Coupons...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Tag className="w-8 h-8 text-brand-600" /> Manage Coupons
        </h1>
        <Link 
          href="/dashboard/admin/coupons/new" 
          className="px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> New Coupon
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold">Code</th>
                <th className="py-4 px-6 font-semibold">Discount</th>
                <th className="py-4 px-6 font-semibold">Min Order</th>
                <th className="py-4 px-6 font-semibold">Expiry</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(coupon => (
                <tr key={coupon.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-6 font-bold text-slate-800">{coupon.code}</td>
                  <td className="py-4 px-6 text-brand-600 font-medium">
                    {coupon.discountType === 'Percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                  </td>
                  <td className="py-4 px-6 text-slate-600">₹{coupon.minOrderValue}</td>
                  <td className="py-4 px-6 text-slate-600">
                    {new Date(coupon.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/dashboard/admin/coupons/${coupon.id}/edit`} 
                        className="p-2 text-slate-400 rounded-lg transition-colors" 
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button 
                        onClick={() => handleDeleteCoupon(coupon.id)} 
                        className="p-2 text-slate-400 rounded-lg transition-colors" 
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Tag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    No active coupons found. Create your first coupon!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {Math.ceil(coupons.length / itemsPerPage) > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4">
            <span className="text-sm font-semibold text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, coupons.length)} of {coupons.length} entries
            </span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm">Prev</button>
              <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(coupons.length / itemsPerPage), p + 1))} disabled={currentPage === Math.ceil(coupons.length / itemsPerPage)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
