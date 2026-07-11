'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { LogIn, ShieldCheck, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAdmin, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && isAdmin) {
      router.push('/dashboard/admin');
    }
  }, [user, isAdmin, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const success = await login(email, password);
    if (success) {
      setTimeout(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.role === 'Admin' || userData.role === 'SuperAdmin') {
            router.push('/dashboard/admin');
          } else {
            setErrorMsg('Access denied. You do not have admin privileges.');
          }
        }
      }, 100);
    } else {
      setErrorMsg('Invalid admin credentials');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-200/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex w-full max-w-[1200px] mx-auto items-center justify-center p-4 lg:p-12 z-10">
        <div className="w-full max-w-[1000px] bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Side - Branding (Hidden on mobile) */}
          <div className="hidden md:flex flex-col w-1/2 bg-gradient-to-br from-brand-600 to-brand-800 p-12 text-white justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200')] opacity-10 mix-blend-overlay bg-cover bg-center"></div>
            
            <div className="relative z-10">
              <img src="/mobile-uper.png" alt="DoseBox Logo" className="bg-white w-16 h-16 md:w-24 md:h-24 rounded-xl shadow-lg border border-white/20 mb-6 object-cover" />
              <h1 className="text-4xl font-extrabold leading-tight mb-4">
                DoseBox<br/>Control Center
              </h1>
              <p className="text-brand-100 text-lg max-w-sm">
                Securely manage your pharmacy operations, inventory, and consultations from one unified dashboard.
              </p>
            </div>
            
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-brand-100 font-medium">Enterprise Grade Security</span>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white">
            <div className="mb-10 text-center md:text-left">
              {/* Mobile Logo */}
              <img src="/Media.jpg" alt="DoseBox Logo" className="w-14 h-14 rounded-xl shadow-sm border border-slate-100 mb-6 object-cover mx-auto md:hidden" />
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Login</h2>
              <p className="text-slate-500 mt-2 text-sm font-medium">Please authenticate to access the dashboard.</p>
            </div>

            {errorMsg && (
              <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-700 text-sm p-4 rounded-xl font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-rose-600" />
                </div>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  placeholder="admin@dosebox.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium pr-12"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 group"
                >
                  {loading ? 'Authenticating...' : (
                    <>
                      Sign In to Dashboard
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
              <a href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 font-bold transition-colors">
                <ArrowRight className="w-4 h-4 rotate-180" /> Back to Storefront
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
