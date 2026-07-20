'use client';

import { formatCurrency } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, ShoppingBag, Users, AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';

// Dynamically render charts to prevent SSR hydration errors
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

interface KPI {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  activeUsers: number;
  totalTokens: number;
  prescriptionRequests: number;
  inventoryAlerts: number;
}

export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();
  
  // Hydration check
  const [mounted, setMounted] = useState(false);
  
  // States
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [growthChart, setGrowthChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/admin/dashboard');
      const statsData = statsRes.data.data;
      setKpis(statsData.kpis);
      setRevenueChart(statsData.charts.revenueChart);
      setGrowthChart(statsData.charts.customerGrowthChart);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-semibold">Loading Admin Suite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-2 font-medium text-lg">Welcome back, {user?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-100 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-7 h-7 text-emerald-600 drop-shadow-sm" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-slate-500 mb-1 tracking-wide uppercase">Total Revenue</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">₹{formatCurrency(kpis?.totalRevenue || 0)}</h3>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <ShoppingBag className="w-7 h-7 text-blue-600 drop-shadow-sm" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-slate-500 mb-1 tracking-wide uppercase">Total Orders</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{kpis?.totalOrders.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-100 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Users className="w-7 h-7 text-purple-600 drop-shadow-sm" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-slate-500 mb-1 tracking-wide uppercase">Customers</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{kpis?.totalCustomers.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-100 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100/50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-100 to-rose-50 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="w-7 h-7 text-rose-600 drop-shadow-sm" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-slate-500 mb-1 tracking-wide uppercase">Inventory Alerts</p>
            <h3 className="text-3xl font-black text-rose-600 tracking-tight">{kpis?.inventoryAlerts} Items</h3>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-100 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-7 h-7 text-amber-600 drop-shadow-sm" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-slate-500 mb-1 tracking-wide uppercase">Total Tokens</p>
            <h3 className="text-3xl font-black text-amber-600 tracking-tight">{kpis?.totalTokens?.toLocaleString() || '0'}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white">
          <h3 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2"><DollarSign className="w-6 h-6 text-emerald-500"/> Revenue Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  cursor={{stroke: '#e2e8f0', strokeWidth: 2}}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white">
          <h3 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2"><Users className="w-6 h-6 text-purple-500"/> Customer Growth</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthChart}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  cursor={{fill: '#f1f5f9'}}
                />
                <Bar dataKey="customers" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
