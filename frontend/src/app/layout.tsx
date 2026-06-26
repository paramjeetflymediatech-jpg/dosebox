'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider, useCart } from '../context/CartContext';
import {
  ShoppingBag, Search, User, LogOut, LayoutDashboard, Stethoscope, BookOpen, Clipboard, LogIn, X, ChevronRight, UserPlus, Upload, Shield, ThermometerSnowflake, BadgeCheck, CheckSquare
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './globals.css';

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>DoseBox.in | Specialty Smart Pharmacy</title>
        <meta name="description" content="India's digital super-specialty pharmacy. Save up to 85% on oncology, kidney, and transplant medicines." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          * {
            font-family: 'Outfit', sans-serif;
          }
        `}</style>
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <LayoutContent>{children}</LayoutContent>
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

// Sub-component to use context hooks safely inside layout
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user, login, googleLogin, logout, isAdmin, isPharmacist } = useAuth();
  const { cartItems } = useCart();
  const [searchVal, setSearchVal] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const pathname = usePathname();
  const isPosPage = pathname === '/pos';

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (isSignUp) {
      // Sign up mock
      try {
        const { api } = await import('../lib/api');
        const res = await api.post('/auth/register', { name, email, password });
        if (res.data?.success) {
          setIsSignUp(false);
          setPassword('');
          alert('Registration successful! Please sign in with your credentials.');
        } else {
          setErrorMsg(res.data?.message || 'Registration failed');
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Error occurred');
      }
    } else {
      // Sign in standard
      const success = await login(email, password);
      if (success) {
        setShowAuthModal(false);
        resetForm();
      } else {
        setErrorMsg('Invalid email or password');
      }
    }
  };

  const handleGoogleMock = async () => {
    // Quick simulator for testing Google Auth
    const success = await googleLogin(
      `g_${Math.random().toString(36).substr(2, 9)}`,
      email || 'google_user@gmail.com',
      name || 'Google User'
    );
    if (success) {
      setShowAuthModal(false);
      resetForm();
    } else {
      setErrorMsg('Google login simulation failed');
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setErrorMsg('');
  };

  if (isPosPage) {
    return <main className="min-h-screen bg-[#080b11]">{children}</main>;
  }

  return (
    <>
      {/* TOP ANNOUNCEMENT BANNER */}
      <div className="bg-brand-700 text-white text-center py-2 px-4 text-xs font-medium flex items-center justify-center gap-2">
        <span className="text-accent-light">⚡</span>
        Government-Compliant Indian Specialty Drugs. Swapping branded oncology & kidney medications saves up to 85% under Special Patient Assistance programs!
      </div>

      {/* HEADER SECTION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-border shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-[88px] flex items-center justify-between gap-6">

          {/* LOGO & LOCATION */}
          <div className="flex items-center gap-8 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <img src="/Media.jpg" alt="Logo" className="h-16 w-auto rounded-lg object-contain" />
            </Link>

            <div className="hidden lg:flex items-center gap-2 text-xs border-l border-slate-200 pl-8">
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DELIVERING TO</div>
                <div className="font-bold text-slate-700">New Delhi (110001) <span className="text-brand-500 ml-1">▼</span></div>
              </div>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="flex-1 max-w-2xl relative hidden md:block">
            <input
              type="text"
              placeholder="Search chronic care drugs, Galvus, Trastuzumab..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchVal.trim()) {
                  window.location.href = `/medicines?search=${encodeURIComponent(searchVal)}`;
                }
              }}
              className="w-full bg-slate-50/50 border-2 border-slate-100 text-slate-800 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:border-brand-500 focus:bg-white transition-all text-sm font-medium shadow-inner"
            />
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          </div>

          {/* NAVIGATION BUTTONS */}
          <nav className="flex items-center gap-4 text-sm font-semibold">
            {/* WhatsApp Buy */}
            <a href="https://wa.me/911140003000" target="_blank" rel="noopener noreferrer" className="hidden xl:flex items-center gap-2 bg-[#E8F8F5] text-[#059669] px-4 py-2.5 rounded-full hover:bg-[#D1F2EB] transition-colors border border-[#A3E4D7]">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              <span>WhatsApp Buy</span>
            </a>

            {/* Upload Rx */}
            <Link href="/upload-prescription" className="hidden lg:flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-full hover:bg-accent-dark transition-colors shadow-sm shadow-accent/20 border border-accent-dark/50">
              <Upload className="w-4 h-4" />
              <span>Upload Rx</span>
            </Link>

            {/* Admin / Pharmacist Dashboards */}
            {user && (isAdmin || isPharmacist) && (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                {isAdmin && (
                  <Link href="/dashboard/admin" className="p-2 text-slate-500 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 rounded-full transition-colors" title="Admin">
                    <LayoutDashboard className="w-5 h-5" />
                  </Link>
                )}
                {isPharmacist && (
                  <Link href="/dashboard/pharmacist" className="p-2 text-slate-500 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 rounded-full transition-colors" title="Pharmacist">
                    <Clipboard className="w-5 h-5" />
                  </Link>
                )}
              </div>
            )}

            {/* Cart */}
            <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
              <Link href="/cart" className="relative p-2 text-slate-600 hover:text-brand-600 transition-colors">
                <ShoppingBag className="w-6 h-6" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </Link>
              
              {/* User Login/Logout */}
              {user ? (
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-slate-600 hover:text-rose-600 transition-colors bg-slate-50 px-4 py-2.5 rounded-full"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 text-slate-600 hover:text-brand-600 transition-colors bg-slate-50 px-4 py-2.5 rounded-full hover:bg-brand-50"
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </button>
              )}
            </div>

          </nav>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 bg-white">
        {children}
      </main>

      {/* DOSEBOX FOOTER */}
      <footer className="bg-slate-900 text-slate-400">
        {/* Trust Badges Strip */}
        <div className="border-b border-slate-800 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-slate-800">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-brand-400">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="text-white font-bold text-sm">Govt Registered Chemist</h4>
              <p className="text-[11px] text-slate-500">Legal license for specialty medicines (Schedule H, H1, X)</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-brand-400">
                <ThermometerSnowflake className="w-6 h-6" />
              </div>
              <h4 className="text-white font-bold text-sm">Safe Cold-Chain Storage</h4>
              <p className="text-[11px] text-slate-500">All thermolabile drugs shipped in 2-8°C insulated valid packs.</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-brand-400">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <h4 className="text-white font-bold text-sm">WHO-GMP Generics Sourced</h4>
              <p className="text-[11px] text-slate-500">Efficacy-assured, verified facilities of the highest standards.</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-brand-400">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h4 className="text-white font-bold text-sm">Double Verification Routine</h4>
              <p className="text-[11px] text-slate-500">RX is checked twice by two supervisory pharmacists before dispatch.</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <img src="/Media.jpg" alt="Logo" className="h-16 w-auto rounded-lg object-contain bg-white p-1" />
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              DoseBox.in is India's pioneering specialty generic healthcare delivery portal. By shortening distribution chains and sourcing from exclusively accredited formulators, we protect daily chronic patients from heavy financial stress.
            </p>
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-center gap-2 text-slate-400"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> License No: DL-05-320092 | FSSAI: 13320011000329</div>
              <div className="flex items-center gap-2 text-slate-400"><div className="w-2 h-2 bg-brand-500 rounded-full"></div> Registered Pharmacists on Roll: 15+ (D.Pharm / B.Pharm / Pharm.D)</div>
            </div>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-white font-bold text-xs mb-6 uppercase tracking-widest">REGISTERED OFFICE & SUPPORT</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <div className="mt-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>
                DoseBox Healthcare Intermediaries Private Limited. C1 - 2, Okhla Ind. Marg, Connaught Place, New Delhi - 110001
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg></div>
                +91 11 4000 3000 (Support Hrs: 9AM - 8PM IST)
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>
                pharma.rx@dosebox.in
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-white font-bold text-xs mb-6 uppercase tracking-widest">OPERATIONAL LINKS</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link href="/medicines" className="hover:text-white transition-colors">Browse Chronic Brands</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">FDA Guidelines (India)</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Institutional Supply</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Privacy & HIPAA Compliance</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Return / Safety Policy</Link></li>
            </ul>
            
            {/* Dev Login Panel - Mocking only */}
            <div className="mt-8 pt-6 border-t border-slate-800">
               <h4 className="text-slate-600 font-bold text-[10px] mb-2 uppercase tracking-widest">Test Accounts (Dev)</h4>
               <div className="text-[10px] text-slate-500 space-y-1">
                 <div>Admin: admin@mrmed.com</div>
                 <div>Pharm: pharmacist@mrmed.com</div>
               </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="bg-slate-950 py-4 border-t border-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-slate-600">
              © {new Date().getFullYear()} DoseBox.in. All rights reserved. Registered with relevant local regulatory compliance authorities.
            </p>
            <div className="text-[10px] text-slate-600 font-bold">
              Approved by D&C Act, India
            </div>
          </div>
        </div>
      </footer>

      {/* COMPREHENSIVE INLINE AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative border border-slate-100 transform scale-100 transition-all">

            <button
              onClick={() => { setShowAuthModal(false); resetForm(); }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              <div className="text-center mb-6">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-50 text-brand-600 mb-3 font-extrabold text-2xl">M</span>
                <h3 className="text-xl font-bold text-slate-900">{isSignUp ? 'Create your Account' : 'Welcome Back to MrMed'}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isSignUp ? 'Sign up to upload prescriptions and purchase medications.' : 'Please sign in to continue shopping and consulting.'}
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs p-3 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-brand-500 focus:bg-white"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-brand-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-brand-500 focus:bg-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-3 rounded-lg shadow-lg shadow-brand-500/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </button>
              </form>

              <div className="relative my-6 text-center">
                <hr className="border-slate-100" />
                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xxs font-semibold uppercase tracking-wider text-slate-300">
                  Or Simulate
                </span>
              </div>

              <button
                onClick={handleGoogleMock}
                type="button"
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {/* SVG Google icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.39 7.56l3.85 2.99c.92-2.75 3.5-4.51 6.76-4.51z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.66-5.02 3.66-8.73z" />
                  <path fill="#FBBC05" d="M5.24 10.55c-.24-.72-.37-1.49-.37-2.3s.13-1.58.37-2.3L1.39 2.96C.5 4.77 0 6.83 0 9c0 2.17.5 4.23 1.39 6.04l3.85-2.99c-.24-.72-.37-1.49-.37-2.3z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.1.74-2.5 1.18-4.2 1.18-3.26 0-5.84-1.76-6.76-4.51L1.39 15.1C3.37 19.35 7.35 22 12 22z" />
                </svg>
                Sign In with Google
              </button>

              <div className="mt-6 text-center text-xs">
                {isSignUp ? (
                  <span>
                    Already have an account?{' '}
                    <button onClick={() => { setIsSignUp(false); resetForm(); }} className="text-brand-600 font-bold hover:underline">
                      Sign In
                    </button>
                  </span>
                ) : (
                  <span>
                    New to MrMed?{' '}
                    <button onClick={() => { setIsSignUp(true); resetForm(); }} className="text-brand-600 font-bold hover:underline">
                      Create an Account
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
