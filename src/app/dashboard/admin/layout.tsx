'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, Settings, Shield, ShoppingBag, LayoutGrid, 
  Menu, X, FileText, LogOut,
  Pill, Wand2, Tag, Truck, HelpCircle, Trash2, Flag,
  Gift, MessageSquare, Building2, Star, Bell, CheckCheck, Clock
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAdmin, isLeadership, isMedico, loading, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowNotifications(false);
  }, [pathname]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasDashboardAccess = isAdmin || isLeadership || isMedico;
  const dashboardTitle = isAdmin ? 'Admin Control' : isLeadership ? 'Leadership Portal' : isMedico ? 'Medical Portal' : 'Dashboard';

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/account/alerts');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
      }
    } catch (e) {
      // Silently fail if not authenticated
    }
  };

  useEffect(() => {
    if (!loading && !hasDashboardAccess) {
      router.push('/');
    }
  }, [loading, hasDashboardAccess, router]);

  useEffect(() => {
    if (user && hasDashboardAccess) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user, hasDashboardAccess]);

  const markAllRead = async () => {
    try {
      await api.put('/account/alerts', {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading || !hasDashboardAccess) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const allNavItems = [
    { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutGrid, allowRoles: ['Admin', 'Leadership', 'Medico'] },
    { name: 'Users', href: '/dashboard/admin/users', icon: Users, allowRoles: ['Admin'] },
    { name: 'Roles', href: '/dashboard/admin/roles', icon: Shield, allowRoles: ['Admin'] },
    { name: 'Reward Points', href: '/dashboard/admin/rewards', icon: Gift, allowRoles: ['Admin', 'Leadership'] },
    { name: 'Orders', href: '/dashboard/admin/orders', icon: ShoppingBag, allowRoles: ['Admin', 'Leadership', 'Medico'] },
    { name: 'Transactions', href: '/dashboard/admin/transactions', icon: FileText, allowRoles: ['Admin', 'Leadership'] },
    { name: 'Medicines', href: '/dashboard/admin/medicines', icon: Pill, allowRoles: ['Admin', 'Medico'] },
    { name: 'Generate AI', href: '/dashboard/admin/generate-ai-bulk', icon: Wand2, allowRoles: ['Admin', 'Medico'] },
    { name: 'Categories', href: '/dashboard/admin/categories', icon: Tag, allowRoles: ['Admin'] },
    { name: 'Brands', href: '/dashboard/admin/brands', icon: Shield, allowRoles: ['Admin'] },
    { name: 'Suppliers', href: '/dashboard/admin/suppliers', icon: Truck, allowRoles: ['Admin'] },
    { name: 'Prescriptions', href: '/dashboard/admin/prescriptions', icon: FileText, allowRoles: ['Admin', 'Medico'] },
    { name: 'Blogs', href: '/dashboard/admin/blogs', icon: FileText, allowRoles: ['Admin'] },
    { name: 'FAQs', href: '/dashboard/admin/faqs', icon: HelpCircle, allowRoles: ['Admin'] },
    { name: 'Support Tickets', href: '/dashboard/admin/support', icon: HelpCircle, allowRoles: ['Admin', 'Leadership'] },
    { name: 'Data Deletion', href: '/dashboard/admin/data-deletion', icon: Trash2, allowRoles: ['Admin'] },
    { name: 'SEO Rules', href: '/dashboard/admin/seo', icon: Settings, allowRoles: ['Admin'] },
    { name: 'Coupons', href: '/dashboard/admin/coupons', icon: Tag, allowRoles: ['Admin'] },
    { name: 'Banners', href: '/dashboard/admin/banners', icon: Flag, allowRoles: ['Admin'] },
    { name: 'Testimonials', href: '/dashboard/admin/testimonials', icon: Star, allowRoles: ['Admin'] },
    { name: 'Bot Simulator', href: '/dashboard/admin/bot-simulator', icon: MessageSquare, allowRoles: ['Admin', 'Leadership'] },
    { name: 'Admin Profile', href: '/dashboard/admin/enterprise', icon: Building2, allowRoles: ['Admin'] },
  ];

  const navItems = allNavItems.filter(item => {
    if (isAdmin) return true;
    if (isLeadership && item.allowRoles.includes('Leadership')) return true;
    if (isMedico && item.allowRoles.includes('Medico')) return true;
    return false;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full md:flex'}`}>
        <div className="p-6 border-b border-slate-100 flex flex-col items-center justify-center text-center relative">
          <button
            className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
          <Link href="/">
            <img src="/Media.jpg" alt="Logo" className="w-28 h-auto object-contain mb-2" />
          </Link>
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">{dashboardTitle}</h2>
            <p className="text-xs text-slate-500">Manage your store</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-brand-600'
                  }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar for Desktop & Mobile */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3.5 flex items-center justify-between z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-slate-800 text-lg md:text-xl hidden md:block">
              {dashboardTitle}
            </h1>
            <img src="/Media.jpg" alt="Logo" className="w-8 h-8 object-contain md:hidden" />
          </div>

          {/* Header Right: Live Notifications & User Profile */}
          <div className="flex items-center gap-3 relative" ref={notifRef}>
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 rounded-xl transition-all relative ${
                  showNotifications
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-brand-600" />
                      <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-600 rounded-full border border-rose-200">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 15).map((n) => (
                        <Link
                          key={n.id}
                          href="/dashboard/admin/orders"
                          onClick={() => setShowNotifications(false)}
                          className={`p-3.5 flex flex-col gap-1 hover:bg-slate-50 transition-colors block ${
                            !n.read ? 'bg-brand-50/40' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 line-clamp-1">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">{n.message}</p>
                        </Link>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 border-t border-slate-100 text-center bg-slate-50/50">
                    <Link
                      href="/dashboard/admin/orders"
                      onClick={() => setShowNotifications(false)}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700"
                    >
                      View all orders →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Admin User Info */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-slate-500 font-medium capitalize">{user?.role || 'Staff'}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}