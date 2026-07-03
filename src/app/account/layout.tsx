'use client';

import React, { useEffect, useState } from 'react';
import {
  ShoppingBag, MapPin, FileText, LogOut, ChevronRight, User as UserIcon, LayoutDashboard, Sparkles, Home
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user && isMounted) {
      router.push('/');
    }
  }, [user, authLoading, isMounted, router]);

  if (!isMounted || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: '/account', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { id: '/account/prescriptions', label: 'My Prescriptions', icon: FileText },
    { id: '/account/rewards', label: 'Reward Points', icon: Sparkles },
    { id: '/account/addresses', label: 'Manage Addresses', icon: MapPin },
    { id: '/account/orders', label: 'My Orders', icon: ShoppingBag },
    { id: '/account/profile', label: 'Personal Information', icon: UserIcon },

  ] as const;

  return (
    <div className="bg-slate-50 h-screen overflow-hidden flex flex-col lg:flex-row">
      {/* Sidebar */}
      <div className="lg:w-80 flex-shrink-0 bg-white border-r border-slate-200 h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-8">
            {(user as any)?.avatar ? (
              <img src={(user as any).avatar} alt="Profile" className="w-14 h-14 rounded-full border border-slate-200 shadow-sm object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xl flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-extrabold text-slate-900 line-clamp-1">{user?.name}</h2>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = (tab as any).exact ? pathname === tab.id : pathname.startsWith(tab.id);
              return (
                <Link
                  key={tab.id}
                  href={tab.id}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  {tab.label}
                  <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${isActive ? 'translate-x-1 text-brand-600' : 'opacity-0'}`} />
                </Link>
              );
            })}
            <hr className="my-4 border-slate-100" />
            <Link
              href="/"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all mb-2"
            >
              <Home className="w-5 h-5 text-slate-400" />
              Back to Website
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all"
            >
              <LogOut className="w-5 h-5 opacity-80" />
              Sign Out
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 p-6 sm:p-10 lg:p-12 h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
