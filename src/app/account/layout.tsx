'use client';

import React, { useEffect, useState } from 'react';
import {
  ShoppingBag, MapPin, FileText, LogOut, ChevronRight, User as UserIcon, LayoutDashboard, Sparkles, Home, Stethoscope, Menu, X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user && isMounted) {
      router.push('/');
    }
  }, [user, authLoading, isMounted, router]);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
    { id: '/account/consultations', label: 'My Consultations', icon: Stethoscope },
    { id: '/account/rewards', label: 'Reward Points', icon: Sparkles },
    { id: '/account/addresses', label: 'Manage Addresses', icon: MapPin },
    { id: '/account/orders', label: 'My Orders', icon: ShoppingBag },
    { id: '/account/profile', label: 'Personal Information', icon: UserIcon },
  ] as const;

  return (
    <div className="bg-slate-50 min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Mobile Header / Sidebar Toggle */}
        <div className="lg:hidden mb-6 flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="font-extrabold text-slate-900 text-lg">My Account</div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          
          {/* Sidebar Overlay (Mobile) */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div className={`fixed inset-y-0 left-0 w-72 lg:w-80 flex-shrink-0 bg-white shadow-2xl lg:shadow-none border-r border-slate-200 lg:border-none transform transition-transform duration-300 ease-in-out z-50 lg:z-auto lg:static lg:block lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="lg:sticky lg:top-[120px] bg-white lg:rounded-2xl lg:shadow-sm lg:border lg:border-slate-200 overflow-hidden h-full lg:h-auto flex flex-col">
              
              {/* Sidebar Header (Mobile close button) */}
              <div className="lg:hidden p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="font-extrabold text-slate-900">Menu</div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
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
              </div>

              <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
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
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
