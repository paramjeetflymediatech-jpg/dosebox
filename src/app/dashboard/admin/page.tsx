'use client';

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
    loadAdminData();
  }, []);

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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1 font-medium">Welcome back, {user?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-brand-200 transition-colors">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">Total Revenue</p>
            <h3 className="text-2xl font-black text-slate-800">₹{kpis?.totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-brand-200 transition-colors">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">Total Orders</p>
            <h3 className="text-2xl font-black text-slate-800">{kpis?.totalOrders.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-brand-200 transition-colors">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">Customers</p>
            <h3 className="text-2xl font-black text-slate-800">{kpis?.totalCustomers.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-brand-200 transition-colors">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">Inventory Alerts</p>
            <h3 className="text-2xl font-black text-rose-600">{kpis?.inventoryAlerts} Items</h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Trend</h3>
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

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Customer Growth</h3>
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
