'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider, useCart } from '../context/CartContext';
import {
  ShoppingBag, Search, User, LogOut, LayoutDashboard, Stethoscope, BookOpen, Clipboard, LogIn, X, ChevronRight, UserPlus, Upload, Shield, ThermometerSnowflake, BadgeCheck, CheckSquare, Menu, Eye, EyeOff, Plus, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import TrackingProvider from '../components/TrackingProvider';
import Chatbot from '../components/Chatbot';

import './globals.css';
import api from '../lib/api';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { toast, Toaster } from 'react-hot-toast';
const queryClient = new QueryClient();

function ScriptInjector({ html, target }: { html: string, target: 'head' | 'body' }) {
  React.useEffect(() => {
    if (!html) return;
    const template = document.createElement('div');
    template.innerHTML = html;
    const elements = Array.from(template.childNodes);
    const addedNodes: Node[] = [];
    
    elements.forEach(el => {
      if (el.nodeName === 'SCRIPT') {
        const script = document.createElement('script');
        Array.from((el as HTMLScriptElement).attributes).forEach(attr => script.setAttribute(attr.name, attr.value));
        script.text = (el as HTMLScriptElement).text;
        (target === 'head' ? document.head : document.body).appendChild(script);
        addedNodes.push(script);
      } else {
        const cloned = el.cloneNode(true);
        (target === 'head' ? document.head : document.body).appendChild(cloned);
        addedNodes.push(cloned);
      }
    });
    
    return () => {
      addedNodes.forEach(node => node.parentNode?.removeChild(node));
    };
  }, [html, target]);
  return null;
}



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>DoseBox.in | Specialty Smart Pharmacy</title>
        <meta name="description" content="India's digital super-specialty pharmacy. Save up to 85% on oncology, kidney, and transplant medicines." />
        <link rel="icon" href="/favicon-512x512.png" sizes="512x512" type="image/png" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" sizes="512x512" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          * {
            font-family: 'Outfit', sans-serif;
          }
        `}</style>
      </head>
      <body suppressHydrationWarning>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '73308780119-gli7r3u398qmqjovnmiptbcubpl7euum.apps.googleusercontent.com'}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <CartProvider>
                <TrackingProvider>
                  <LayoutContent>{children}</LayoutContent>
                  <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#333', color: '#fff', borderRadius: '12px' } }} />
                </TrackingProvider>
              </CartProvider>
            </AuthProvider>
          </QueryClientProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}

// Sub-component to use context hooks safely inside layout
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user, login, googleLogin, logout, isAdmin } = useAuth();
  const { cartItems } = useCart();
  const [searchVal, setSearchVal] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const delayDebounceFn = setTimeout(async () => {
      if (searchVal.trim().length >= 2) {
        try {
          const res = await api.get(`/medicines?search=${encodeURIComponent(searchVal.trim())}&limit=6`, {
            signal: controller.signal
          });
          if (res.data?.success) {
            setSearchSuggestions(res.data.data || []);
            setShowSuggestions(true);
          }
        } catch (e) {
          if (axios.isCancel(e)) {
            console.log('Header search suggestions query aborted');
          } else {
            console.error('Failed to fetch suggestions', e);
          }
        }
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [searchVal]);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('New Delhi (110001)');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'verify' | 'reset'>('login');
  const [globalSettings, setGlobalSettings] = useState<Record<string, string>>({});
  const pathname = usePathname();
  const router = useRouter();

  const handleSearch = () => {
    if (searchVal.trim()) {
      setShowSuggestions(false);
      router.push(`/medicines?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    api.get('/admin/settings')
      .then(res => {
        if(res.data?.success) {
          const sm: Record<string, string> = {};
          res.data.data.forEach((s: any) => sm[s.key] = s.value);
          setGlobalSettings(sm);
        }
      })
      .catch(e => console.error('Failed to load global settings', e));
  }, []);

  // Auto-open login modal when session expires
  React.useEffect(() => {
    const handleLoginRequired = () => {
      setAuthMode('login');
      setShowAuthModal(true);
    };
    window.addEventListener('auth_login_required', handleLoginRequired);
    return () => window.removeEventListener('auth_login_required', handleLoginRequired);
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    if (authMode === 'signup') {
      // Sign up mock
      try {
        const { api } = await import('../lib/api');
        const res = await api.post('/auth/register', { name, email, password });
        if (res.data?.success) {
          setAuthMode('login');
          setPassword('');
          toast.success('Registration successful! Please sign in with your credentials.');
        } else {
          setErrorMsg(res.data?.message || 'Registration failed');
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Error occurred');
      } finally {
        setIsLoading(false);
      }
    } else if (authMode === 'login') {
      // Sign in standard
      const success = await login(email, password);
      setIsLoading(false);
      if (success) {
        setShowAuthModal(false);
        resetForm();
      } else {
        setErrorMsg('Invalid email or password');
      }
    } else if (authMode === 'forgot') {
      try {
        const { api } = await import('../lib/api');
        const res = await api.post('/auth/forgot-password', { email });
        if (res.data?.success) {
          setAuthMode('verify');
        } else {
          setErrorMsg(res.data?.message || 'Failed to send OTP');
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Error occurred');
      } finally {
        setIsLoading(false);
      }
    } else if (authMode === 'verify') {
      try {
        const { api } = await import('../lib/api');
        const res = await api.post('/auth/verify-otp', { email, otp });
        if (res.data?.success) {
          setResetToken(res.data.resetToken);
          setAuthMode('reset');
        } else {
          setErrorMsg(res.data?.message || 'Invalid OTP');
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Error occurred');
      } finally {
        setIsLoading(false);
      }
    } else if (authMode === 'reset') {
      try {
        const { api } = await import('../lib/api');
        const res = await api.post('/auth/reset-password', { email, otp, password: newPassword });
        if (res.data?.success) {
          toast.success('Password reset successful. Please login.');
          setAuthMode('login');
          setOtp('');
          setNewPassword('');
          setPassword('');
        } else {
          setErrorMsg(res.data?.message || 'Failed to reset password');
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Error occurred');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    setErrorMsg('');
    try {
      const { api } = await import('../lib/api');
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data?.success) {
        toast.success('OTP resent to your email.');
      } else {
        setErrorMsg(res.data?.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error occurred');
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setErrorMsg('');
    setOtp('');
    setNewPassword('');
    setAuthMode('login');
  };

  const handleApplyPincode = async () => {
    if (pincodeInput.length !== 6) return;
    setIsFetchingLocation(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincodeInput}`);
      const data = await res.json();
      if (data && data[0] && data[0].Status === 'Success') {
        const areaName = data[0].PostOffice[0].Name;
        const district = data[0].PostOffice[0].District;
        const newLocation = `${district} (${pincodeInput})`;
        setDeliveryLocation(newLocation);
        setShowLocationModal(false);
        toast.success(`Delivery available in ${newLocation}`);
      } else {
        alert('Invalid Pincode. Could not fetch details.');
      }
    } catch (err) {
      alert('Error fetching pincode details. Please try again.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          
          if (data && data.address) {
            const city = data.address.city || data.address.town || data.address.county || data.address.state_district || 'Your Location';
            const zip = data.address.postcode || '';
            const newLocation = `${city} ${zip ? `(${zip})` : ''}`;
            setDeliveryLocation(newLocation);
            setShowLocationModal(false);
            toast.success(`Delivery available in ${newLocation}`);
          } else {
            alert('Failed to detect precise address from coordinates.');
          }
        } catch (error) {
          alert('Failed to fetch address details. Please try entering a pincode.');
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        alert('Location access denied or unavailable. Please manually enter a pincode.');
        setIsFetchingLocation(false);
      }
    );
  };

  const isPlainLayout = pathname === '/pos' || pathname?.startsWith('/admin/login') || pathname?.startsWith('/dashboard/admin');

  if (isPlainLayout) {
    return <main className="min-h-screen bg-[#080b11]">{children}</main>;
  }

  const hideHeaderFooter = false; // Always show header/footer except for plain layouts (handled above)

  return (
    <>
      <ScriptInjector html={globalSettings['global_head_scripts'] || ''} target="head" />
      <ScriptInjector html={globalSettings['global_footer_scripts'] || ''} target="body" />
      
      {/* TOP ANNOUNCEMENT BANNER */}
      {!hideHeaderFooter && (
        <div className="bg-brand-700 text-white text-center py-2 px-4 text-xs font-medium flex items-center justify-center gap-2">
          <span className="text-accent-light">⚡</span>
          Regulatory Compliance Indian Specialty Drugs. Swapping branded oncology & kidney medications saves up to 85% under Special Patient Assistance programs!
        </div>
      )}

      {/* HEADER SECTION */}
      {!hideHeaderFooter && (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-border shadow-sm">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-[88px] flex items-center justify-between gap-4 sm:gap-6">

          {/* LEFT: Hamburger + LOGO + LOCATION */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link href="/" className="flex items-center gap-2">
              <img src={globalSettings['logo_url'] || "/Media.jpg"} alt="Logo" className="h-10 sm:h-16 w-auto rounded-lg object-contain" />
            </Link>

            <div 
              className="hidden lg:flex items-center gap-2 text-xs border-l border-slate-200 pl-4 sm:pl-8 cursor-pointer hover:bg-slate-50 transition-colors p-2 rounded-xl"
              onClick={() => setShowLocationModal(true)}
            >
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DELIVERING TO</div>
                <div className="font-bold text-slate-700 truncate max-w-[120px]">{deliveryLocation} <span className="text-brand-500 ml-1">▼</span></div>
              </div>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="flex-1 max-w-2xl relative hidden lg:block" ref={searchContainerRef}>
            <input
              type="text"
              placeholder="Search chronic care drugs, Galvus, Trastuzumab..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              onFocus={() => { if (searchVal.trim().length >= 2) setShowSuggestions(true); }}
              className="w-full bg-slate-50/50 border-2 border-slate-100 text-slate-800 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:border-brand-500 focus:bg-white transition-all text-sm font-medium shadow-inner"
            />
            <button 
              onClick={handleSearch}
              className="absolute left-3 top-2.5 p-1 hover:bg-slate-200 rounded-full transition-colors"
            >
              <Search className="w-5 h-5 text-slate-400 hover:text-brand-600" />
            </button>
            
            {/* TYPE-AHEAD SUGGESTIONS */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                <div className="py-2">
                  <div className="px-4 py-2 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <span>Suggestions</span>
                  </div>
                  {searchSuggestions.map((med) => {
                    let img = '/Media.jpg';
                    try {
                      if (med.images) {
                        const arr = typeof med.images === 'string' ? JSON.parse(med.images) : med.images;
                        if (arr && arr.length > 0) img = arr[0];
                      }
                    } catch (e) {}

                    return (
                      <div 
                        key={med.id}
                        onClick={() => {
                          setShowSuggestions(false);
                          setSearchVal('');
                          router.push(`/medicines/detail?id=${med.id}`);
                        }}
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0"
                      >
                        <img src={img} alt={med.name} className="w-10 h-10 object-contain rounded-lg border border-slate-100 p-1 shrink-0 bg-white" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 truncate">{med.name}</h4>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{med.composition || med.genericName || 'Generic Medicine'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-extrabold text-brand-600">₹{med.discountPrice || med.price}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div 
                  onClick={handleSearch}
                  className="bg-slate-50 px-4 py-3 text-center text-sm font-bold text-brand-600 hover:bg-brand-50 cursor-pointer transition-colors border-t border-slate-100"
                >
                  View all results for "{searchVal}"
                </div>
              </div>
            )}
          </div>

          {/* NAVIGATION BUTTONS */}
          <nav className="flex items-center gap-4 text-sm font-semibold">
            {/* Upload Rx */}
            <Link href="/upload-prescription" className="hidden lg:flex items-center gap-2  text-white px-4 py-2.5 rounded-full  border border-brand-200 bg-[#E68A85]">
              <Clipboard className="w-4 h-4" />
              <span>Upload Rx</span>
            </Link>

            {/* PAP Program */}
            <Link href="/medicines?pap=true" className="hidden lg:flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2.5 rounded-full hover:bg-amber-100 transition-colors border border-amber-200">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>PAP Assist</span>
            </Link>

            {/* WhatsApp Buy */}
            <a href="https://api.whatsapp.com/send/?phone=919877817314&text=Hi,%20I%20would%20like%20to%20order%20medicines." target="_blank" rel="noopener noreferrer" className="hidden xl:flex items-center gap-2 bg-[#E8F8F5] text-[#059669] px-4 py-2.5 rounded-full hover:bg-[#D1F2EB] transition-colors border border-[#A3E4D7]">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              <span>WhatsApp Buy</span>
            </a>



            {/* Admin Dashboard */}
            {user && (isAdmin || (user.role === 'Leadership') || (user.role === 'Medico') || (user.role === 'Pharmacist')) && (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <Link href="/dashboard/admin" className="p-2 text-slate-500 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 rounded-full transition-colors" title="Admin">
                  <LayoutDashboard className="w-5 h-5" />
                </Link>
              </div>
            )}

            {/* Cart & Notifications */}
            <div className="flex items-center gap-2 sm:gap-4 pl-2 sm:pl-4 border-l border-slate-200">

              
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
                <div className="relative group">
                  <Link
                    href={user && (isAdmin || user.role === 'Leadership' || user.role === 'Medico' || user.role === 'Pharmacist') ? '/dashboard/admin' : '/account'}
                    className="flex items-center gap-2 text-slate-600 hover:text-brand-600 transition-colors bg-slate-50 p-2.5 sm:px-4 sm:py-2.5 rounded-full hover:bg-brand-50"
                  >
                    {(user as any)?.avatar ? (
                      <img src={(user as any).avatar} alt="Profile" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline truncate max-w-[100px]">{user.name?.split(' ')[0] || 'Account'}</span>
                  </Link>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full w-48 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col py-2">
                      <Link 
                        href={user && (isAdmin || user.role === 'Leadership' || user.role === 'Medico' || user.role === 'Pharmacist') ? '/dashboard/admin' : '/account'} 
                        className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <button onClick={() => logout()} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors">
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 text-slate-600 hover:text-brand-600 transition-colors bg-slate-50 p-2.5 sm:px-4 sm:py-2.5 rounded-full hover:bg-brand-50"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}
            </div>

          </nav>
        </div>
      </header>
      )}

      {/* MOBILE SEARCH BAR */}
      {!hideHeaderFooter && (
        <div className="lg:hidden px-4 py-3 bg-white border-b border-slate-100 sticky top-[88px] z-30 shadow-sm">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search chronic care drugs..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-500 focus:bg-white transition-all text-sm font-medium"
            />
            <button onClick={handleSearch} className="absolute left-2.5 top-1.5 p-1 text-slate-400">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MOBILE MENU DRAWER */}
      {!hideHeaderFooter && (
        <>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
          )}
          <div className={`fixed inset-y-0 left-0 w-72 bg-white z-50 transform transition-transform duration-300 lg:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <img src={globalSettings['logo_url'] || "/Media.jpg"} alt="Logo" className="h-10 w-auto object-contain" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              <Link href="/medicines" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-slate-700 font-semibold hover:bg-slate-50 rounded-xl">Browse Medicines</Link>
              <Link href="/medicines?pap=true" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-amber-700 font-semibold bg-amber-50 rounded-xl flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>PAP Assist (Patient Program)</span>
              </Link>
              <Link href="/upload-prescription" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-slate-700 font-semibold hover:bg-slate-50 rounded-xl flex items-center gap-2"><Clipboard className="w-4 h-4"/> Upload Rx</Link>
              <a href="https://wa.me/919877817314?text=Hi,%20I%20would%20like%20to%20order%20medicines." target="_blank" rel="noopener noreferrer" className="block px-4 py-3 text-emerald-700 font-semibold bg-emerald-50 rounded-xl flex items-center gap-2"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg> WhatsApp Buy</a>
            </div>
          </div>
        </>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 bg-white">
        {children}
      </main>

      {/* DOSEBOX FOOTER */}
      {!hideHeaderFooter && (
        <footer className="bg-brand-900 text-slate-300">
          {/* Trust Badges Strip */}
          <div className="border-b border-brand-800/30 bg-brand-950/30">
            <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-brand-800/20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-950/40 flex items-center justify-center text-brand-300">
                  <Shield className="w-6 h-6" />
                </div>
                <h4 className="text-white font-bold text-sm">Regulatory Compliance Pharmacy</h4>
                <p className="text-[11px] text-slate-400/80">Legal license for specialty medicines (Schedule H, H1, X)</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-950/40 flex items-center justify-center text-brand-300">
                  <ThermometerSnowflake className="w-6 h-6" />
                </div>
                <h4 className="text-white font-bold text-sm">Safe Cold-Chain Storage</h4>
                <p className="text-[11px] text-slate-400/80">All thermolabile drugs shipped in 2-8°C insulated valid packs.</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-950/40 flex items-center justify-center text-brand-300">
                  <BadgeCheck className="w-6 h-6" />
                </div>
                <h4 className="text-white font-bold text-sm">WHO-GMP Generics Sourced</h4>
                <p className="text-[11px] text-slate-400/80">Efficacy-assured, verified facilities of the highest standards.</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-950/40 flex items-center justify-center text-brand-300">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <h4 className="text-white font-bold text-sm">Double Verification Routine</h4>
                <p className="text-[11px] text-slate-400/80">RX is checked twice by two supervisory pharmacists before dispatch.</p>
              </div>
            </div>
          </div>

          {/* Main Footer Links */}
          <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-4">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <img src={globalSettings['logo_url'] || "/Media.jpg"} alt="Logo" className="h-16 w-auto rounded-lg object-contain bg-white p-1" />
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                {globalSettings['site_name'] || 'DoseBox.in'} is India's pioneering specialty generic healthcare delivery portal. By shortening distribution chains and sourcing from exclusively accredited formulators, we protect daily chronic patients from heavy financial stress.
              </p>
              <div className="space-y-2 text-xs font-semibold">
                <div className="flex items-center gap-2 text-slate-300"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> License No: DL-05-320092 | FSSAI: 13320011000329</div>
                <div className="flex items-center gap-2 text-slate-300"><div className="w-2 h-2 bg-brand-500 rounded-full"></div> Registered Pharmacists on Roll: 15+ (D.Pharm / B.Pharm / Pharm.D)</div>
              </div>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-white font-bold text-xs mb-6 uppercase tracking-widest">REGISTERED OFFICE & SUPPORT</h4>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <div className="mt-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>
                  {globalSettings['physical_address'] || 'DoseBox Healthcare Intermediaries Private Limited. C1 - 2, Okhla Ind. Marg, Connaught Place, New Delhi - 110001'}
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg></div>
                  {globalSettings['contact_phone'] || '+91 11 4000 3000'} (Support Hrs: 9AM - 8PM IST)
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>
                  {globalSettings['contact_email'] || 'support@dosebox.com'}
                </li>
              </ul>
              {/* Dynamic Social Links */}
              <div className="flex gap-4 mt-6">
                {globalSettings['social_facebook'] && <a href={globalSettings['social_facebook']} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-brand-300 transition-colors">FB</a>}
                {globalSettings['social_twitter'] && <a href={globalSettings['social_twitter']} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-brand-300 transition-colors">TW</a>}
                {globalSettings['social_instagram'] && <a href={globalSettings['social_instagram']} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-brand-300 transition-colors">IG</a>}
                {globalSettings['social_linkedin'] && <a href={globalSettings['social_linkedin']} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-brand-300 transition-colors">LI</a>}
              </div>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-white font-bold text-xs mb-6 uppercase tracking-widest">OPERATIONAL LINKS</h4>
              <ul className="space-y-3 text-sm font-medium">
                <li><Link href="/medicines" className="hover:text-brand-300 transition-colors">Browse Chronic Brands</Link></li>
                <li><Link href="/fda-guidelines" className="hover:text-brand-300 transition-colors">FDA Guidelines (India)</Link></li>
                <li><Link href="/institutional-supply" className="hover:text-brand-300 transition-colors">Institutional Supply</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-brand-300 transition-colors">Privacy & HIPAA Compliance</Link></li>
                <li><Link href="/return-policy" className="hover:text-brand-300 transition-colors">Return / Safety Policy</Link></li>
                <li><Link href="/data-deletion" className="hover:text-brand-300 transition-colors text-rose-400">Account Deletion Request</Link></li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-white font-bold text-xs mb-6 uppercase tracking-widest">DOWNLOAD DOSEBOX APP</h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Scan the QR code below or click store links to install our App on your phone.
              </p>
              <div className="bg-brand-950/40 border border-brand-800/30 p-3 rounded-2xl flex items-center gap-3">
                <div className="bg-white p-1 rounded-lg shrink-0">
                  <img 
                    src="https://quickchart.io/qr?text=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.doseboxmobile&size=300" 
                    alt="DoseBox QR Code" 
                    className="w-20 h-20 object-contain"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <a 
                    href="https://play.google.com/store/apps/details?id=com.doseboxmobile" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="transition-transform hover:scale-105 duration-200"
                  >
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                      alt="Get it on Google Play" 
                      className="h-10 w-auto rounded-lg mx-auto"
                    />
                  </a>
                  <a 
                    href="https://apps.apple.com/app/dosebox" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="transition-transform hover:scale-105 duration-200"
                  >
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                      alt="Download on the App Store" 
                      className="h-10 w-auto rounded-lg mx-auto"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="bg-brand-950/50 py-4 border-t border-brand-800/30">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-[10px] text-slate-500">
                © {new Date().getFullYear()} {globalSettings['site_name'] || 'DoseBox.in'}. All rights reserved. Registered with relevant local regulatory compliance authorities.
              </p>
              <div className="text-[10px] text-slate-500 font-bold">
                Approved by D&C Act, India
              </div>
            </div>
          </div>
        </footer>
      )}

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
                <h3 className="text-xl font-bold text-slate-900">
                  {authMode === 'signup' ? 'Create your Account' : authMode === 'forgot' ? 'Reset Password' : authMode === 'verify' ? 'Verify OTP' : authMode === 'reset' ? 'New Password' : 'Welcome Back to DoseBox'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {authMode === 'signup' ? 'Sign up to upload prescriptions.' : authMode === 'forgot' ? 'Enter your email to get a reset code.' : authMode === 'verify' ? 'Enter the 6-digit code sent to your email.' : authMode === 'reset' ? 'Create your new password.' : 'Please sign in to continue.'}
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs p-3 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'signup' && (
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

                {(authMode === 'login' || authMode === 'signup' || authMode === 'forgot' || authMode === 'verify') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-brand-500 focus:bg-white"
                      required
                      disabled={authMode === 'verify'}
                    />
                  </div>
                )}

                {(authMode === 'login' || authMode === 'signup') && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-600 uppercase">Password</label>
                      {authMode === 'login' && (
                        <button type="button" onClick={() => { setAuthMode('forgot'); setErrorMsg(''); }} className="text-xs font-bold text-brand-600 hover:underline">
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-brand-500 focus:bg-white pr-10"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                {authMode === 'verify' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">6-Digit OTP</label>
                    <input
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-brand-500 focus:bg-white tracking-widest text-center text-xl"
                      maxLength={6}
                      required
                    />
                  </div>
                )}

                {authMode === 'reset' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 focus:outline-none focus:border-brand-500 focus:bg-white pr-10"
                        required
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full ${isLoading ? 'bg-brand-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700'} text-white font-bold text-sm py-3 rounded-lg shadow-lg shadow-brand-500/10 transition-colors flex items-center justify-center gap-1.5 mt-2`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Please wait...
                    </span>
                  ) : (
                    <>
                      {authMode === 'signup' && <UserPlus className="w-4 h-4" />}
                      {authMode === 'login' && <LogIn className="w-4 h-4" />}
                      {authMode === 'signup' ? 'Sign Up' : authMode === 'forgot' ? 'Send OTP' : authMode === 'verify' ? 'Verify Code' : authMode === 'reset' ? 'Reset Password' : 'Sign In'}
                    </>
                  )}
                </button>
              </form>

              {(authMode === 'login' || authMode === 'signup') && (
                <>
                  <div className="relative my-6 text-center">
                    <hr className="border-slate-100" />
                    <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xxs font-semibold uppercase tracking-wider text-slate-300">
                      Or Sign in with Google
                    </span>
                  </div>

                  <div className="flex justify-center w-full">
                    <GoogleLogin
                      ux_mode="redirect"
                      login_uri={`${process.env.NEXT_PUBLIC_APP_URL || 'https://dosebox.in'}/api/auth/google/callback`}
                      onSuccess={() => {}}
                      onError={() => setErrorMsg('Google Login Failed')}
                      theme="outline"
                      shape="rectangular"
                      text="signin_with"
                    />
                  </div>
                </>
              )}

              <div className="mt-6 text-center text-xs">
                {authMode === 'verify' && (
                  <div className="mb-4">
                    <span className="text-slate-500">Didn't receive the code? </span>
                    <button onClick={handleResendOtp} type="button" className="text-brand-600 font-bold hover:underline">
                      Resend OTP
                    </button>
                  </div>
                )}
                
                {authMode === 'signup' && (
                  <span>
                    Already have an account?{' '}
                    <button type="button" onClick={() => { setAuthMode('login'); setErrorMsg(''); }} className="text-brand-600 font-bold hover:underline">
                      Sign In
                    </button>
                  </span>
                )}
                {authMode === 'login' && (
                  <span>
                    New to DoseBox?{' '}
                    <button type="button" onClick={() => { setAuthMode('signup'); setErrorMsg(''); }} className="text-brand-600 font-bold hover:underline">
                      Create an Account
                    </button>
                  </span>
                )}
                {(authMode === 'forgot' || authMode === 'verify' || authMode === 'reset') && (
                  <button type="button" onClick={() => { setAuthMode('login'); setErrorMsg(''); }} className="text-brand-600 font-bold hover:underline">
                    Back to Login
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* LOCATION MODAL */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setShowLocationModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-8 pb-10">
              <h3 className="text-xl font-black text-slate-900 mb-1">Where do you want the delivery?</h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">Get access to your Addresses, and Orders</p>

              {!user && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between mb-8">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Please login first</h4>
                  </div>
                  <button onClick={() => { setShowLocationModal(false); setShowAuthModal(true); }} className="bg-white border border-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors whitespace-nowrap ml-4">
                    Login
                  </button>
                </div>
              )}

              {user && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-xs text-slate-500 uppercase tracking-widest">Saved Addresses</h4>
                  </div>
                  <div className="space-y-3">
                    <Link href="/account/addresses" onClick={() => setShowLocationModal(false)} className="w-full flex items-center justify-center gap-2 text-sm font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-4 py-3 rounded-xl transition-all border border-brand-200">
                      <Plus className="w-4 h-4" /> Manage Addresses
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Or Enter Pincode</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>
              
              <p className="text-xs text-slate-500 mb-3 font-medium text-center">Select pincode to see product availability</p>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="Enter Pincode"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 bg-white border-2 border-slate-200 text-slate-800 text-sm rounded-xl p-3 focus:outline-none focus:border-brand-500 font-bold tracking-widest text-center"
                />
                <button 
                  onClick={handleApplyPincode}
                  disabled={isFetchingLocation || pincodeInput.length !== 6}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold px-6 rounded-xl transition-colors"
                >
                  {isFetchingLocation ? '...' : 'Apply'}
                </button>
              </div>
              
              <button 
                onClick={handleDetectLocation}
                disabled={isFetchingLocation}
                className="w-full flex items-center justify-center gap-2 mt-4 text-brand-600 font-bold hover:bg-brand-50 py-3 rounded-xl transition-colors border border-transparent hover:border-brand-200 disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                {isFetchingLocation ? 'Detecting...' : 'or detect my location'}
              </button>

            </div>
          </div>
        </div>
      )}
      {/* FLOATING APP DOWNLOAD WIDGET */}
      {!hideHeaderFooter && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden lg:flex items-center group">
          {/* Tab Button */}
          <div className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-3 px-2.5 rounded-l-2xl shadow-xl flex flex-col items-center gap-1.5 cursor-pointer select-none transition-all duration-300 transform group-hover:-translate-x-1 border-y border-l border-brand-500/40 tracking-wider vertical-text">
            <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
            <span style={{ writingMode: 'vertical-lr' }} className="rotate-180 uppercase font-black tracking-widest text-[9px] py-1">App Download</span>
          </div>

          {/* Hover Expanded Panel */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out bg-white p-5 rounded-l-3xl border-y-2 border-l-2 border-brand-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-56 flex flex-col items-center text-center">
            <h4 className="text-brand-900 font-black text-xs uppercase tracking-widest mb-1.5">Get DoseBox App</h4>
            <p className="text-[10px] text-slate-500 mb-3.5 leading-relaxed font-semibold">Scan QR to download mobile app instantly</p>
            
            <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 mb-4 shadow-inner">
              <img 
                src="https://quickchart.io/qr?text=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.doseboxmobile&size=300" 
                alt="App QR Code" 
                className="w-28 h-28 object-contain"
              />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <a 
                href="https://play.google.com/store/apps/details?id=com.doseboxmobile" 
                target="_blank" 
                rel="noreferrer" 
                className="transition-transform hover:scale-105 duration-200"
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                  alt="Get it on Google Play" 
                  className="h-9 w-auto rounded-lg mx-auto"
                />
              </a>
              <a 
                href="https://apps.apple.com/app/dosebox" 
                target="_blank" 
                rel="noreferrer" 
                className="transition-transform hover:scale-105 duration-200"
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                  alt="Download on the App Store" 
                  className="h-9 w-auto rounded-lg mx-auto"
                />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot Integration */}
      {!pathname.startsWith('/dashboard/admin') && <Chatbot />}
    </>
  );
}

