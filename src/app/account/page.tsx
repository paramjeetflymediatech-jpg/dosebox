'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, FileText, Sparkles, User as UserIcon, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import api from '../../lib/api';

export default function AccountDashboardPage() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    orders: 0,
    prescriptions: 0,
    addresses: 0,
    consultations: 0  // CONSULT FEATURE DISABLED
  });
  const [currentTokens, setCurrentTokens] = useState(user?.doseboxTokens || 0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [ordersRes, prescRes, addrRes, consultRes, profileRes] = await Promise.all([
          api.get('/orders').catch(() => ({ data: { success: false } })),
          api.get('/prescriptions/customer').catch(() => ({ data: { success: false } })),
          api.get('/account/addresses').catch(() => ({ data: { success: false } })),
          // api.get('/account/appointments').catch(() => ({ data: { success: false } })),  // CONSULT FEATURE DISABLED
          Promise.resolve({ data: { success: false } }),
          api.get('/account/profile').catch(() => ({ data: { success: false } }))
        ]);
        
        setStats({
          orders: ordersRes.data?.success ? ordersRes.data.data.length : 0,
          prescriptions: prescRes.data?.success ? prescRes.data.data.length : 0,
          addresses: addrRes.data?.success ? addrRes.data.data.length : 0,
          consultations: 0  // CONSULT FEATURE DISABLED — was: consultRes.data?.success ? consultRes.data.data.length : 0
        });
        if (profileRes.data?.success) {
          setCurrentTokens(profileRes.data.data.doseboxTokens || 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      loadStats();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
        <p className="text-slate-500 mb-8">Manage your orders, prescriptions, and account settings from here.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/account/orders" className="block bg-slate-50 hover:bg-slate-100 border border-slate-100 p-6 rounded-2xl transition-all">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4">
              <ShoppingBag className="w-6 h-6 text-brand-600" />
            </div>
            <h3 className="font-bold text-slate-900">Total Orders</h3>
            <p className="text-3xl font-black text-brand-600 mt-2">{stats.orders}</p>
          </Link>
          
          <Link href="/account/prescriptions" className="block bg-slate-50 hover:bg-slate-100 border border-slate-100 p-6 rounded-2xl transition-all">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900">Prescriptions</h3>
            <p className="text-3xl font-black text-emerald-600 mt-2">{stats.prescriptions}</p>
          </Link>

          {/* <Link href="/account/consultations" className="block bg-slate-50 hover:bg-slate-100 border border-slate-100 p-6 rounded-2xl transition-all">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4">
              <Stethoscope className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-900">Consultations</h3>
            <p className="text-3xl font-black text-blue-600 mt-2">{stats.consultations}</p>
          </Link> */}
          
          <Link href="/account/rewards" className="block bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-2xl transition-all hover:shadow-lg shadow-amber-500/20 text-white">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 border border-white/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <p className="text-white/80 font-medium text-sm mt-4">DoseBox Tokens</p>
            <p className="text-3xl font-black text-white mt-2">{currentTokens}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
