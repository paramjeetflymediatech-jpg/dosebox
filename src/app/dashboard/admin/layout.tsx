'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, Tag, FileText, Settings, Flag, LogOut, Code, Pill, ShoppingBag, Clipboard
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAdmin, loading, logout } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
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
    { name: 'Prescriptions', href: '/dashboard/admin/prescriptions', icon: Clipboard },
    { name: 'Medicines', href: '/dashboard/admin/medicines', icon: Pill },
    { name: 'Blogs', href: '/dashboard/admin/blogs', icon: FileText },
    { name: 'SEO Rules', href: '/dashboard/admin/seo', icon: Settings },
    { name: 'Coupons', href: '/dashboard/admin/coupons', icon: Tag },
    { name: 'Banners', href: '/dashboard/admin/banners', icon: Flag }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-10">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Admin Control</h2>
          <p className="text-sm text-slate-500">Manage your store</p>
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
      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        {children}
      </main>
    </div>
  );
}
