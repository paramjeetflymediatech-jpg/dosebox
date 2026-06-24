'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider, useCart } from '../context/CartContext';
import { 
  ShoppingBag, Search, User, LogOut, LayoutDashboard, Stethoscope, BookOpen, Clipboard, LogIn, X, ChevronRight, UserPlus, Upload
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './globals.css';

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>MrMed | Online Pharmacy, Doctor Consultation & Lab Packages</title>
        <meta name="description" content="Order medicines, health products online, upload prescriptions, and book video doctor consultations on India's premium healthcare SaaS platform." />
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
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-brand-500/20">
              M
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-2xl text-slate-900 tracking-tight">Mr</span>
              <span className="font-extrabold text-2xl text-brand-600 tracking-tight">Med</span>
            </div>
          </Link>

          {/* SEARCH BAR */}
          <div className="flex-1 max-w-lg relative hidden md:block">
            <input
              type="text"
              placeholder="Search medicines, composition, generics..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchVal.trim()) {
                  window.location.href = `/medicines?search=${encodeURIComponent(searchVal)}`;
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-full py-2.5 pl-11 pr-4 focus:outline-none focus:border-brand-500 focus:bg-white transition-all text-sm shadow-inner"
            />
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="flex items-center gap-1 sm:gap-6 text-sm font-semibold text-slate-600">
            <Link href="/medicines" className="hover:text-brand-600 transition-colors flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-50">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden lg:inline">Medicines</span>
            </Link>
            <Link href="/consultations" className="hover:text-brand-600 transition-colors flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-50">
              <Stethoscope className="w-4 h-4" />
              <span className="hidden lg:inline">Doctor Clinic</span>
            </Link>
            <Link href="/blogs" className="hover:text-brand-600 transition-colors flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-50">
              <BookOpen className="w-4 h-4" />
              <span className="hidden lg:inline">Health Blogs</span>
            </Link>
            <Link href="/upload-prescription" className="hover:text-brand-600 transition-colors flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 bg-brand-50 text-brand-700">
              <Upload className="w-4 h-4 text-brand-600" />
              <span className="hidden lg:inline font-bold">Upload Rx</span>
            </Link>

            {/* CART ICON */}
            <Link href="/cart" className="relative p-2 text-slate-700 hover:text-brand-600 transition-colors">
              <ShoppingBag className="w-6 h-6" />
              {cartItems.length > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Link>

            {/* AUTH ACTIONS */}
            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link href="/dashboard/admin" className="p-2 text-brand-700 hover:bg-brand-50 rounded-full transition-colors" title="Admin Control Room">
                    <LayoutDashboard className="w-5 h-5" />
                  </Link>
                )}
                {isPharmacist && (
                  <Link href="/dashboard/pharmacist" className="p-2 text-blue-700 hover:bg-blue-50 rounded-full transition-colors" title="Pharmacist Verification Panel">
                    <Clipboard className="w-5 h-5" />
                  </Link>
                )}
                {!isAdmin && !isPharmacist && (
                  <Link href="/dashboard/customer" className="p-2 text-teal-700 hover:bg-teal-50 rounded-full transition-colors" title="Customer Dashboard">
                    <User className="w-5 h-5" />
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold py-2 px-4 rounded-full shadow-md shadow-brand-500/10 transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1">
        {children}
      </main>

      {/* PREMIUM FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold">M</div>
              <span className="font-bold text-xl text-white">MrMed</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              India\'s trusted enterprise online pharmacy and diagnostic aggregator, delivering genuine medications, certified consulting, and full care management.
            </p>
            <div className="text-xs text-slate-500">
              © {new Date().getFullYear()} MrMed. All rights reserved.
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Quick Access</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/medicines" className="hover:text-white transition-colors">Medicine Store</Link></li>
              <li><Link href="/consultations" className="hover:text-white transition-colors">Video Consultations</Link></li>
              <li><Link href="/blogs" className="hover:text-white transition-colors">Healthcare Blogs</Link></li>
              <li><Link href="/cart" className="hover:text-white transition-colors">My Cart</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Legal & Compliance</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FDA Guidelines</a></li>
              <li><a href="#" className="hover:text-white transition-colors">GST Invoicing Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Developer & Admin Test accounts</h4>
            <div className="space-y-1.5 text-xs text-slate-500">
              <div><strong className="text-slate-400">Admin:</strong> admin@mrmed.com / password123</div>
              <div><strong className="text-slate-400">Pharmacist:</strong> pharmacist@mrmed.com / password123</div>
              <div><strong className="text-slate-400">Customer:</strong> customer@mrmed.com / password123</div>
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
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.39 7.56l3.85 2.99c.92-2.75 3.5-4.51 6.76-4.51z"/>
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.66-5.02 3.66-8.73z"/>
                  <path fill="#FBBC05" d="M5.24 10.55c-.24-.72-.37-1.49-.37-2.3s.13-1.58.37-2.3L1.39 2.96C.5 4.77 0 6.83 0 9c0 2.17.5 4.23 1.39 6.04l3.85-2.99c-.24-.72-.37-1.49-.37-2.3z"/>
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.1.74-2.5 1.18-4.2 1.18-3.26 0-5.84-1.76-6.76-4.51L1.39 15.1C3.37 19.35 7.35 22 12 22z"/>
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
