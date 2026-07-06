'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, Tag, FileText, Settings, Flag, LogOut, Code, Pill, ShoppingBag, Clipboard, Truck, Shield, Stethoscope, Calendar, Menu, X
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAdmin, loading, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutGrid },
    { name: 'Orders', href: '/dashboard/admin/orders', icon: ShoppingBag },
    { name: 'Transactions', href: '/dashboard/admin/transactions', icon: FileText },
    { name: 'Medicines', href: '/dashboard/admin/medicines', icon: Pill },
    { name: 'Categories', href: '/dashboard/admin/categories', icon: Tag },
    { name: 'Brands', href: '/dashboard/admin/brands', icon: Shield },
    { name: 'Suppliers', href: '/dashboard/admin/suppliers', icon: Truck },
    { name: 'Prescriptions', href: '/dashboard/admin/prescriptions', icon: FileText },
    { name: 'Doctors', href: '/dashboard/admin/doctors', icon: Stethoscope },
    { name: 'Appointments', href: '/dashboard/admin/appointments', icon: Calendar },
    { name: 'Blogs', href: '/dashboard/admin/blogs', icon: FileText },
    { name: 'SEO Rules', href: '/dashboard/admin/seo', icon: Settings },
    { name: 'Coupons', href: '/dashboard/admin/coupons', icon: Tag },
    { name: 'Banners', href: '/dashboard/admin/banners', icon: Flag }
  ];

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
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex-col z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full md:flex'}`}>
        <div className="p-6 border-b border-slate-100 flex flex-col items-center justify-center text-center relative">
          <button 
            className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
          <img src="/Media.jpg" alt="Logo" className="w-30 h-30 object-contain" />
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">Admin Control</h2>
            <p className="text-xs text-slate-500">Manage your store</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive 
                  ? 'bg-brand-50 text-brand-700 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-brand-600'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="w-5 h-5 text-rose-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-slate-800 text-lg">Admin Control</h1>
          </div>
          <img src="/Media.jpg" alt="Logo" className="w-8 h-8 object-contain" />
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/50 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
