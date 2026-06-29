'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { LogIn } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAdmin, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If already logged in and is admin, redirect to admin dashboard
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
      // The useEffect will handle the redirect if they are an admin
      // But we should also check if the logged in user is actually an admin right after login
      // However, `useAuth` state takes a render cycle to update.
      // The API response also sets localStorage. Let's just wait for the useEffect.
      // If they are NOT an admin, we probably shouldn't let them in here, but AuthContext handles `isAdmin`.
      // We can do a small delay to let state settle.
      setTimeout(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.role === 'Admin') {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-600 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">Admin Portal</h2>
          <p className="text-brand-100 text-sm mt-1">Please sign in to access the control center.</p>
        </div>

        {/* Form */}
        <div className="p-8">
          {errorMsg && (
            <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-sm p-4 rounded-r-lg font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Admin Email</label>
              <input
                type="email"
                placeholder="admin@mrmed.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-3.5 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-3.5 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <a href="/" className="text-sm text-slate-500 hover:text-brand-600 font-medium transition-colors">
              &larr; Back to Main Site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
