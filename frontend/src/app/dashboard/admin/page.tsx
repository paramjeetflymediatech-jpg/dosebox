'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, ShoppingBag, Users, AlertTriangle, FileText, Plus, Trash2, Calendar, FileEdit, Tag, LayoutGrid
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

interface Coupon {
  id: number;
  code: string;
  discountType: string;
  discountValue: string;
  minOrderValue: string;
  expiryDate: string;
  active: boolean;
}

interface Blog {
  id: number;
  title: string;
  slug: string;
  category: string;
  createdAt: string;
}

interface Banner {
  id: number;
  title: string;
  image: string;
  link: string;
  type: string;
}

export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();
  
  // Hydration check
  const [mounted, setMounted] = useState(false);
  
  // States
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [growthChart, setGrowthChart] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'coupons' | 'blogs' | 'banners'>('analytics');

  // Forms states
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'Percentage',
    discountValue: '',
    minOrderValue: '',
    expiryDate: ''
  });

  const [newBlog, setNewBlog] = useState({
    title: '',
    slug: '',
    content: '',
    category: 'Nutrition & Wellness',
    readTime: '5 mins',
    coverImage: ''
  });

  const [newBanner, setNewBanner] = useState({
    title: '',
    subtitle: '',
    image: '',
    link: '',
    type: 'Hero'
  });

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, couponsRes, blogsRes, bannersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/coupons'),
        api.get('/admin/blogs'),
        api.get('/admin/banners')
      ]);

      if (statsRes.data?.success) {
        setKpis(statsRes.data.data.kpis);
        setRevenueChart(statsRes.data.data.charts.revenueChart);
        setGrowthChart(statsRes.data.data.charts.customerGrowthChart);
      }
      if (couponsRes.data?.success) setCoupons(couponsRes.data.data);
      if (blogsRes.data?.success) setBlogs(blogsRes.data.data);
      if (bannersRes.data?.success) setBanners(bannersRes.data.data);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (!isAdmin) {
      window.location.href = '/';
      return;
    }
    loadAdminData();
  }, [isAdmin]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/coupons', newCoupon);
      if (res.data?.success) {
        alert('Coupon created successfully!');
        setNewCoupon({ code: '', discountType: 'Percentage', discountValue: '', minOrderValue: '', expiryDate: '' });
        loadAdminData();
      }
    } catch (err) {
      alert('Failed to create coupon.');
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      loadAdminData();
    } catch (err) {
      alert('Failed to delete coupon.');
    }
  };

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/blogs', newBlog);
      if (res.data?.success) {
        alert('Blog article created successfully!');
        setNewBlog({ title: '', slug: '', content: '', category: 'Nutrition & Wellness', readTime: '5 mins', coverImage: '' });
        loadAdminData();
      }
    } catch (err) {
      alert('Failed to create blog post.');
    }
  };

  const handleDeleteBlog = async (id: number) => {
    if (!confirm('Delete this article?')) return;
    try {
      await api.delete(`/admin/blogs/${id}`);
      loadAdminData();
    } catch (err) {
      alert('Failed to delete article.');
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/banners', newBanner);
      if (res.data?.success) {
        alert('Promo banner configured successfully!');
        setNewBanner({ title: '', subtitle: '', image: '', link: '', type: 'Hero' });
        loadAdminData();
      }
    } catch (err) {
      alert('Failed to create banner.');
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (!confirm('Delete this banner slide?')) return;
    try {
      await api.delete(`/admin/banners/${id}`);
      loadAdminData();
    } catch (err) {
      alert('Failed to delete banner.');
    }
  };

  if (!mounted) return null;

  if (loading && !kpis) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mx-auto" />
        <p className="text-slate-400 text-sm font-semibold">Loading Admin Suite...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/80 mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Admin Control Center</h1>
            <p className="text-xs text-slate-400 mt-1">Oversee business metrics, write health articles, configure slides, and manage coupons.</p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-4">
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-4 rounded-full font-bold text-xs transition-all border ${activeTab === 'analytics' ? 'bg-brand-600 border-brand-600 text-white shadow' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Business KPIs
            </button>
            <button 
              onClick={() => setActiveTab('coupons')}
              className={`py-2 px-4 rounded-full font-bold text-xs transition-all border ${activeTab === 'coupons' ? 'bg-brand-600 border-brand-600 text-white shadow' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Coupons ({coupons.length})
            </button>
            <button 
              onClick={() => setActiveTab('blogs')}
              className={`py-2 px-4 rounded-full font-bold text-xs transition-all border ${activeTab === 'blogs' ? 'bg-brand-600 border-brand-600 text-white shadow' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Blogs ({blogs.length})
            </button>
            <button 
              onClick={() => setActiveTab('banners')}
              className={`py-2 px-4 rounded-full font-bold text-xs transition-all border ${activeTab === 'banners' ? 'bg-brand-600 border-brand-600 text-white shadow' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Slides ({banners.length})
            </button>
          </div>
        </div>

        {/* TAB 1: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-10">
            
            {/* KPI grid */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0"><DollarSign className="w-5 h-5" /></div>
                <div><span className="text-xxs text-slate-400 font-bold block uppercase">Revenue</span><strong className="text-sm sm:text-base text-slate-800">₹{kpis?.totalRevenue.toFixed(0)}</strong></div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0"><ShoppingBag className="w-5 h-5" /></div>
                <div><span className="text-xxs text-slate-400 font-bold block uppercase">Orders</span><strong className="text-sm sm:text-base text-slate-800">{kpis?.totalOrders}</strong></div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5" /></div>
                <div><span className="text-xxs text-slate-400 font-bold block uppercase">Patients</span><strong className="text-sm sm:text-base text-slate-800">{kpis?.totalCustomers}</strong></div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5" /></div>
                <div><span className="text-xxs text-slate-400 font-bold block uppercase">Active</span><strong className="text-sm sm:text-base text-slate-800">{kpis?.activeUsers}</strong></div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5" /></div>
                <div><span className="text-xxs text-slate-400 font-bold block uppercase">Low Stock</span><strong className="text-sm sm:text-base text-slate-800">{kpis?.inventoryAlerts}</strong></div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5" /></div>
                <div><span className="text-xxs text-slate-400 font-bold block uppercase">Rx Pending</span><strong className="text-sm sm:text-base text-slate-800">{kpis?.prescriptionRequests}</strong></div>
              </div>
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Revenue area chart */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-6 uppercase tracking-wider">Revenue Curve (INR)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChart}>
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#0f766e" fill="#ccfbf1" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Customer Growth bar chart */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-6 uppercase tracking-wider">Patient Acquisition</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={growthChart}>
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="customers" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: COUPONS MANAGER */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-6 border-b border-slate-100 pb-3">Promo Coupon Catalog</h3>
              <div className="space-y-4">
                {coupons.map((c) => (
                  <div key={c.id} className="border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 text-brand-600 flex items-center justify-center flex-shrink-0"><Tag className="w-5 h-5" /></div>
                      <div>
                        <strong className="text-slate-900 text-sm sm:text-base block">{c.code}</strong>
                        <span className="text-xxs text-slate-400 block mt-0.5">Type: {c.discountType} • Value: {Number(c.discountValue).toFixed(0)} • Min order: ₹{Number(c.minOrderValue).toFixed(0)}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteCoupon(c.id)} 
                      className="p-1.5 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Create coupon form */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 self-start shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">Add New Coupon</h3>
              <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Coupon Code</label>
                  <input
                    type="text"
                    placeholder="e.g. EXTRA10"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 uppercase mb-1">Type</label>
                    <select
                      value={newCoupon.discountType}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-2 focus:outline-none"
                    >
                      <option value="Percentage">Percentage</option>
                      <option value="Fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 uppercase mb-1">Value</label>
                    <input
                      type="number"
                      placeholder="10 or 150"
                      value={newCoupon.discountValue}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={newCoupon.minOrderValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, minOrderValue: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newCoupon.expiryDate}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-2 focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl transition-all shadow"
                >
                  Save Coupon
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: HEALTH BLOGS */}
        {activeTab === 'blogs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-6 border-b border-slate-100 pb-3">SEO Health Articles</h3>
              <div className="space-y-4">
                {blogs.map((b) => (
                  <div key={b.id} className="border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><FileEdit className="w-5 h-5" /></div>
                      <div>
                        <strong className="text-slate-900 text-sm block line-clamp-1">{b.title}</strong>
                        <span className="text-xxs text-slate-400 block mt-0.5">Category: {b.category} • Slug: {b.slug}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteBlog(b.id)} 
                      className="p-1.5 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Write blog post */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 self-start shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">Write New Article</h3>
              <form onSubmit={handleCreateBlog} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Article Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Tips to avoid Hypertension"
                    value={newBlog.title}
                    onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Slug (Auto)</label>
                  <input
                    type="text"
                    value={newBlog.slug}
                    onChange={(e) => setNewBlog({ ...newBlog, slug: e.target.value })}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl p-2.5 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 uppercase mb-1">Category</label>
                    <select
                      value={newBlog.category}
                      onChange={(e) => setNewBlog({ ...newBlog, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-2 focus:outline-none"
                    >
                      <option value="Nutrition & Wellness">Wellness</option>
                      <option value="Chronic Conditions">Chronic Care</option>
                      <option value="Lifestyle Guides">Lifestyle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 uppercase mb-1">Read Time</label>
                    <input
                      type="text"
                      value={newBlog.readTime}
                      onChange={(e) => setNewBlog({ ...newBlog, readTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Content Text</label>
                  <textarea
                    placeholder="Write article details..."
                    value={newBlog.content}
                    onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 h-28 resize-none focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl transition-all shadow"
                >
                  Publish Post
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: BANNER SLIDES */}
        {activeTab === 'banners' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-6 border-b border-slate-100 pb-3">Active Slider Banners</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {banners.map((b) => (
                  <div key={b.id} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <img src={b.image} className="h-28 w-full object-cover" />
                    <div className="p-3 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <strong className="text-slate-900 text-xs block line-clamp-1">{b.title}</strong>
                        <span className="text-xxs text-slate-400 block">Link: {b.link}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteBanner(b.id)} 
                        className="p-1 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create banner slide form */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 self-start shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">Add Slider Image</h3>
              <form onSubmit={handleCreateBanner} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Banner Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Free Consultation Today"
                    value={newBanner.title}
                    onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Subtitle</label>
                  <input
                    type="text"
                    placeholder="e.g. Code CONSULT49"
                    value={newBanner.subtitle}
                    onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Image URL</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={newBanner.image}
                    onChange={(e) => setNewBanner({ ...newBanner, image: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 uppercase mb-1">Redirect Path</label>
                    <input
                      type="text"
                      placeholder="/medicines"
                      value={newBanner.link}
                      onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 uppercase mb-1">Type</label>
                    <select
                      value={newBanner.type}
                      onChange={(e) => setNewBanner({ ...newBanner, type: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-2 focus:outline-none"
                    >
                      <option value="Hero">Hero Banner</option>
                      <option value="Promo">Promo Banner</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl transition-all shadow"
                >
                  Save Slide
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
