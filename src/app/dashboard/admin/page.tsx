'use client';

import { formatCurrency } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, ShoppingBag, Users, AlertTriangle, Download, Activity
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';

// Dynamically render charts to prevent SSR hydration errors
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
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
  const { user, isAdmin, isLeadership, isMedico } = useAuth();
  
  // Hydration check
  const [mounted, setMounted] = useState(false);
  
  // States
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [growthChart, setGrowthChart] = useState<any[]>([]);
  const [orderHealthChart, setOrderHealthChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/admin/dashboard');
      const statsData = statsRes.data.data;
      setKpis(statsData.kpis);
      setRevenueChart(statsData.charts.revenueChart);
      setGrowthChart(statsData.charts.customerGrowthChart);
      setOrderHealthChart(statsData.charts.orderHealthChart || []);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (isMedico) {
      window.location.href = '/dashboard/admin/prescriptions';
    } else if (isAdmin || isLeadership) {
      loadAdminData();
    }
  }, [isAdmin, isLeadership, isMedico]);

  const handleExport = async () => {
    try {
      const response = await api.get('/admin/orders/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'dosebox_orders_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

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
        <div className="flex gap-3 mt-4 md:mt-0">
          <button 
            onClick={handleExport}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 transition-all font-semibold flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Revenue Trend - Redesigned */}
        <div className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/30 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
          <div className="flex justify-between items-end mb-8 relative z-10">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl shadow-inner">
                  <DollarSign className="w-5 h-5"/>
                </div>
                Revenue Trend
              </h3>
              <p className="text-slate-500 font-medium mt-1 ml-12">Monthly revenue tracking and forecasting</p>
            </div>
          </div>
          <div className="h-[400px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} dy={15} interval={0} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 'bold'}}
                  cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Growth - Redesigned */}
        <div className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100/30 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
          <div className="flex justify-between items-end mb-8 relative z-10">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl shadow-inner">
                  <Users className="w-5 h-5"/>
                </div>
                Customer Growth
              </h3>
              <p className="text-slate-500 font-medium mt-1 ml-12">New customer acquisitions over time</p>
            </div>
          </div>
          <div className="h-[400px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthChart} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorCust" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} dy={15} interval={0} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 'bold'}}
                />
                <Bar dataKey="customers" fill="url(#colorCust)" radius={[6, 6, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Health Status - Redesigned */}
        <div className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-100/30 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
          <div className="flex justify-between items-end mb-8 relative z-10">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl shadow-inner">
                  <Activity className="w-5 h-5"/>
                </div>
                Order Health Status
              </h3>
              <p className="text-slate-500 font-medium mt-1 ml-12">Distribution of current order statuses</p>
            </div>
          </div>
          <div className="h-[400px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderHealthChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={110}
                  outerRadius={150}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={8}
                >
                  {orderHealthChart.map((entry, index) => {
                    const colors = ['#10b981', '#f59e0b', '#f43f5e', '#6366f1', '#0ea5e9'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />;
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 'bold'}}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={50} 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '20px', fontWeight: 600, color: '#475569' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
