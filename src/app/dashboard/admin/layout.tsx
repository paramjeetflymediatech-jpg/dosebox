'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, Settings, Shield, ShoppingBag, LayoutGrid, 
  Menu, X, FileText, LogOut,
  Pill, Wand2, Tag, Truck, Stethoscope, Calendar, HelpCircle, Trash2, Flag,
  Gift, MessageSquare, Building2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAdmin, isLeadership, isMedico, loading, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const hasDashboardAccess = isAdmin || isLeadership || isMedico;
  const dashboardTitle = isAdmin ? 'Admin Control' : isLeadership ? 'Leadership Portal' : isMedico ? 'Medical Portal' : 'Dashboard';

  useEffect(() => {
    if (!loading && !hasDashboardAccess) {
      router.push('/');
    }
  }, [loading, hasDashboardAccess, router]);

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
    // { name: 'Doctors', href: '/dashboard/admin/doctors', icon: Stethoscope, allowRoles: ['Admin', 'Leadership'] },  // CONSULT FEATURE DISABLED
    // { name: 'Appointments', href: '/dashboard/admin/appointments', icon: Calendar, allowRoles: ['Admin'] },  // CONSULT FEATURE DISABLED
    { name: 'Blogs', href: '/dashboard/admin/blogs', icon: FileText, allowRoles: ['Admin'] },
    { name: 'FAQs', href: '/dashboard/admin/faqs', icon: HelpCircle, allowRoles: ['Admin'] },
    { name: 'Support Tickets', href: '/dashboard/admin/support', icon: HelpCircle, allowRoles: ['Admin', 'Leadership'] },
    { name: 'Data Deletion', href: '/dashboard/admin/data-deletion', icon: Trash2, allowRoles: ['Admin'] },
    { name: 'SEO Rules', href: '/dashboard/admin/seo', icon: Settings, allowRoles: ['Admin'] },
    { name: 'Coupons', href: '/dashboard/admin/coupons', icon: Tag, allowRoles: ['Admin'] },
    { name: 'Banners', href: '/dashboard/admin/banners', icon: Flag, allowRoles: ['Admin'] },
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
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex-col z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full md:flex'}`}>
        <div className="p-6 border-b border-slate-100 flex flex-col items-center justify-center text-center relative">
          <button
            className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
          <Link href="/">
            <img src="/Media.jpg" alt="Logo" className="w-30 h-30 object-contain" />
          </Link>
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">{dashboardTitle}</h2>
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive
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
            <h1 className="font-bold text-slate-800 text-lg">{dashboardTitle}</h1>
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
