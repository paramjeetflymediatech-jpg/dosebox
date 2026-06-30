'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, MapPin, Eye, FileText, CheckCircle2, AlertCircle, XCircle, Download, Upload, ShieldCheck, User as UserIcon, Lock, LogOut, ChevronRight, Edit2, Trash2, Plus
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

interface OrderItem {
  id: number;
  quantity: number;
  price: string;
  medicine?: { name: string; images: string };
}

interface Order {
  id: number;
  status: string;
  totalAmount: string;
  finalAmount: string;
  paymentStatus: string;
  trackingTimeline: string;
  createdAt: string;
  items?: OrderItem[];
}

interface Prescription {
  id: number;
  fileUrl: string;
  status: string;
  notes?: string;
  createdAt: string;
}

interface Address {
  id: number;
  title: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

type TabType = 'profile' | 'addresses' | 'orders' | 'prescriptions';

export default function AccountPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const { addToCart } = useCart();
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loadingData, setLoadingData] = useState(true);

  // Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  
  // Profile State
  const [profileData, setProfileData] = useState({ name: '', phone: '', currentPassword: '', newPassword: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState({ title: '', street: '', city: '', state: '', zipCode: '', isDefault: false });
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  
  // Search Address State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Other States
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [showScanResults, setShowScanResults] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = '/';
      return;
    }
    
    setProfileData(prev => ({ ...prev, name: user.name || '', phone: user.phone || '' }));
    loadDashboardData();
  }, [user, authLoading]);

  // Address Search Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5`);
        const data = await res.json();
        setSearchResults(data || []);
        setShowSearchResults(true);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectSearchResult = (result: any) => {
    const address = result.address || {};
    const street = address.road || address.suburb || address.neighbourhood || result.name || '';
    const city = address.city || address.town || address.county || '';
    const state = address.state || '';
    const zipCode = address.postcode || '';

    setAddressForm(prev => ({
      ...prev,
      street: street || prev.street,
      city: city || prev.city,
      state: state || prev.state,
      zipCode: zipCode || prev.zipCode
    }));
    
    setSearchQuery('');
    setShowSearchResults(false);
  };

  async function loadDashboardData() {
    setLoadingData(true);
    try {
      const [ordersRes, prescRes, addrRes] = await Promise.all([
        api.get('/orders').catch(() => ({ data: { success: false } })),
        api.get('/prescriptions/customer').catch(() => ({ data: { success: false } })),
        api.get('/account/addresses').catch(() => ({ data: { success: false } }))
      ]);
      if (ordersRes.data?.success) setOrders(ordersRes.data.data);
      if (prescRes.data?.success) setPrescriptions(prescRes.data.data);
      if (addrRes.data?.success) setAddresses(addrRes.data.data);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoadingData(false);
    }
  }

  // --- Profile Logic ---
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await api.put('/account/profile', profileData);
      if (res.data?.success) {
        toast.success('Profile updated successfully');
        setProfileData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      } else {
        toast.error(res.data?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // --- Address Logic ---
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        await api.put(`/account/addresses/${editingAddressId}`, addressForm);
        toast.success('Address updated!');
      } else {
        await api.post('/account/addresses', addressForm);
        toast.success('Address added!');
      }
      setShowAddressModal(false);
      const res = await api.get('/account/addresses');
      if (res.data?.success) setAddresses(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    }
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          
          let street = '', city = '', state = '', zipCode = '';

          // If user provided a Google API Key, use Google Maps
          if (apiKey) {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
            const data = await res.json();
            
            if (data.status === 'OK' && data.results[0]) {
              const result = data.results[0];
              result.address_components.forEach((component: any) => {
                if (component.types.includes('route')) street = component.long_name;
                if (!street && component.types.includes('neighborhood')) street = component.long_name;
                if (component.types.includes('locality')) city = component.long_name;
                if (component.types.includes('administrative_area_level_1')) state = component.long_name;
                if (component.types.includes('postal_code')) zipCode = component.long_name;
              });
              if (!street) street = result.formatted_address.split(',')[0];
            } else {
              toast.error('Could not determine address from location');
              setIsFetchingLocation(false);
              return;
            }
          } else {
            // Demo Fallback: Use OpenStreetMap Nominatim API (Free, No API Key Required)
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            
            if (data && data.address) {
              street = data.address.road || data.address.suburb || data.address.neighbourhood || '';
              city = data.address.city || data.address.town || data.address.county || '';
              state = data.address.state || '';
              zipCode = data.address.postcode || '';
              toast.success('Used OpenStreetMap Demo API (Add Google Key for production)');
            } else {
              toast.error('Demo API failed to locate address');
              setIsFetchingLocation(false);
              return;
            }
          }
          
          setAddressForm(prev => ({
            ...prev,
            street: street || prev.street,
            city: city || prev.city,
            state: state || prev.state,
            zipCode: zipCode || prev.zipCode
          }));
          if (apiKey) toast.success('Location fetched successfully!');
        } catch (error) {
          toast.error('Failed to fetch address details');
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        toast.error('Location access denied or unavailable');
        setIsFetchingLocation(false);
      }
    );
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/account/addresses/${id}`);
      toast.success('Address deleted');
      setAddresses(addresses.filter(a => a.id !== id));
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  const openAddressModal = (addr?: Address) => {
    if (addr) {
      setEditingAddressId(addr.id);
      setAddressForm({
        title: addr.title, street: addr.street, city: addr.city, state: addr.state, zipCode: addr.zipCode, isDefault: addr.isDefault
      });
    } else {
      setEditingAddressId(null);
      setAddressForm({ title: '', street: '', city: '', state: '', zipCode: '', isDefault: false });
    }
    setSearchQuery('');
    setShowSearchResults(false);
    setShowAddressModal(true);
  };

  // --- Prescriptions Logic ---
  const handlePrescriptionUpload = async () => {
    if (!prescriptionFile) {
      toast.error('Please choose a file to upload first.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', prescriptionFile);
      const res = await api.post('/prescriptions', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      if (res.data?.success) {
        toast.success('Prescription scanned successfully');
        const prescRes = await api.get('/prescriptions/customer');
        if (prescRes.data?.success) setPrescriptions(prescRes.data.data);

        if (res.data.extractedMedicines?.length > 0) {
          setScanResults(res.data.extractedMedicines);
          setShowScanResults(true);
        }
      } else {
        toast.error('Upload failed');
      }
    } catch (err: any) {
      toast.error('Upload error: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      setPrescriptionFile(null);
    }
  };

  const addAllScannedToCart = () => {
    scanResults.forEach((med) => {
      let imagesArr = ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250'];
      try { if (med.images) imagesArr = JSON.parse(med.images); } catch (e) {}
      addToCart({ id: med.id, name: med.name, price: Number(med.price), prescriptionRequired: med.prescriptionRequired, image: imagesArr[0] });
    });
    toast.success('All scanned medicines added to cart!');
    setShowScanResults(false);
  };

  const downloadInvoice = async (orderId: number) => {
    try {
      const res = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', `Invoice_Order_${orderId}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (err) {
      toast.error('Failed to download invoice PDF.');
    }
  };

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Personal Information', icon: UserIcon },
    { id: 'addresses', label: 'Manage Addresses', icon: MapPin },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'prescriptions', label: 'My Prescriptions', icon: FileText },
  ] as const;

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm sticky top-24">
              <div className="flex items-center gap-4 mb-8">
                {(user as any)?.avatar ? (
                  <img src={(user as any).avatar} alt="Profile" className="w-14 h-14 rounded-full border border-slate-200 shadow-sm object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xl flex-shrink-0">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="font-extrabold text-slate-900 line-clamp-1">{user?.name}</h2>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>

              <nav className="space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                      {tab.label}
                      <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${isActive ? 'translate-x-1 text-brand-600' : 'opacity-0'}`} />
                    </button>
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
          <div className="lg:w-3/4">
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
                <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                  <UserIcon className="w-6 h-6 text-brand-600" /> Personal Information
                </h3>
                <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Full Name</label>
                      <input 
                        type="text" required value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Phone Number</label>
                      <input 
                        type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm"
                        placeholder="e.g. +91 9876543210"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Email Address (Cannot be changed)</label>
                    <input 
                      type="email" disabled value={user?.email}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed text-sm"
                    />
                  </div>
                  
                  {!(user as any)?.googleId && (
                    <div className="pt-6 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-slate-400" /> Change Password</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">Current Password</label>
                          <input 
                            type="password" value={profileData.currentPassword} onChange={e => setProfileData({...profileData, currentPassword: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">New Password</label>
                          <input 
                            type="password" value={profileData.newPassword} onChange={e => setProfileData({...profileData, newPassword: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <button disabled={updatingProfile} type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm">
                      {updatingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-brand-600" /> Saved Addresses
                  </h3>
                  <button onClick={() => openAddressModal()} className="flex items-center gap-2 text-sm font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-lg transition-all">
                    <Plus className="w-4 h-4" /> Add New
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                    <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-medium">No saved addresses found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                      <div key={addr.id} className="border border-slate-200 rounded-xl p-5 relative group hover:border-brand-300 transition-colors">
                        {addr.isDefault && <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-xxs font-bold px-2 py-0.5 rounded-full">Default</span>}
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">{addr.title}</h4>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                          {addr.street}<br/>
                          {addr.city}, {addr.state} {addr.zipCode}<br/>
                          {addr.country}
                        </p>
                        <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openAddressModal(addr)} className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"><Edit2 className="w-3 h-3"/> Edit</button>
                          <button onClick={() => handleDeleteAddress(addr.id)} className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"><Trash2 className="w-3 h-3"/> Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h3 className="text-xl font-extrabold text-slate-900 mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6 text-brand-600" /> Order History
                </h3>
                {orders.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 text-sm font-semibold mb-4">You have not placed any orders yet.</p>
                    <Link href="/medicines" className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-3 px-8 rounded-full transition-all inline-block">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  orders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    let timeline = [];
                    try { timeline = JSON.parse(order.trackingTimeline || '[]'); } catch(e){}

                    return (
                      <div key={order.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm transition-all">
                        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-slate-900 text-sm">Order #OD-{order.id}</span>
                              <span className={`text-xxs font-bold px-2.5 py-0.5 rounded-full ${order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xxs text-slate-400 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-xxs text-slate-400 font-semibold uppercase tracking-wider block">Total</span>
                              <span className="font-extrabold text-slate-900 text-sm sm:text-base">₹{Number(order.finalAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setExpandedOrderId(isExpanded ? null : order.id)} className="p-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg transition-all" title="View details">
                                <Eye className="w-4 h-4" />
                              </button>
                              {order.paymentStatus === 'Paid' && (
                                <button onClick={() => downloadInvoice(order.id)} className="p-2 bg-brand-50 border border-brand-100 text-brand-600 hover:bg-brand-100 rounded-lg transition-all" title="Download Invoice">
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100">
                            <div className="space-y-4">
                              <h4 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Ordered Items</h4>
                              <div className="space-y-3">
                                {order.items?.map((item) => {
                                  let imgUrl = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250';
                                  try { if (item.medicine?.images) imgUrl = JSON.parse(item.medicine.images)[0]; } catch(e){}
                                  return (
                                    <div key={item.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 flex-shrink-0">
                                          <img src={imgUrl} className="object-contain max-h-8 mix-blend-multiply" />
                                        </div>
                                        <div className="min-w-0">
                                          <h5 className="font-bold text-slate-800 text-xs truncate">{item.medicine?.name || 'Unknown item'}</h5>
                                          <span className="text-xxs text-slate-400 block mt-0.5">Qty: {item.quantity} • ₹{Number(item.price).toFixed(2)}</span>
                                        </div>
                                      </div>
                                      <span className="text-xs font-bold text-slate-800 flex-shrink-0">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-950 text-xs uppercase tracking-wider mb-4">Tracking Timeline</h4>
                              <div className="relative border-l-2 border-slate-100 ml-3 pl-6 space-y-5">
                                {timeline.map((step: any, sIdx: number) => (
                                  <div key={sIdx} className="relative">
                                    <div className="absolute -left-[31px] top-1 w-4 h-4 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-sm">
                                      <CheckCircle2 className="w-3 h-3" />
                                    </div>
                                    <span className="font-bold text-slate-800 text-xs block">{step.status}</span>
                                    <span className="text-xxs text-slate-400 block">{new Date(step.time).toLocaleString('en-IN')}</span>
                                    <span className="text-xxs text-slate-500 mt-1 block">{step.desc}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* PRESCRIPTIONS TAB */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-brand-600" /> Prescriptions
                  </h3>
                  
                  <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-5 mb-8">
                    <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 mb-2">
                      <Upload className="w-4 h-4 text-brand-600" /> Upload New Prescription
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">Upload a prescription sheet to let our AI instantly find matchable medicines.</p>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setPrescriptionFile(e.target.files ? e.target.files[0] : null)} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-100 file:text-brand-700 hover:file:bg-brand-200 w-full sm:w-auto cursor-pointer" />
                      <button onClick={handlePrescriptionUpload} disabled={!prescriptionFile || uploading} className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-2 px-6 rounded-lg transition-all w-full sm:w-auto disabled:opacity-50">
                        {uploading ? 'Scanning...' : 'Upload & Scan'}
                      </button>
                    </div>
                  </div>

                  {showScanResults && scanResults.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-extrabold text-emerald-900 text-sm flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600" /> AI Matched Medicines</h4>
                        <button onClick={addAllScannedToCart} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-4 rounded-lg transition-all">Add All to Cart</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {scanResults.map(med => (
                          <div key={med.id} className="bg-white border border-emerald-100 p-3 rounded-lg flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-800">{med.name} <span className="text-xs text-slate-400 block font-normal">₹{Number(med.price).toFixed(2)}</span></span>
                            <button onClick={() => addToCart({ id: med.id, name: med.name, price: Number(med.price), prescriptionRequired: med.prescriptionRequired, image: '' })} className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100">Add</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prescriptions.map((presc) => (
                      <div key={presc.id} className="border border-slate-100 p-4 rounded-xl flex items-center justify-between gap-4 hover:border-brand-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">#{presc.id}</span>
                            <span className="text-xs text-slate-400 block mt-0.5">{new Date(presc.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className={`text-xs font-bold py-1 px-3 rounded-full flex items-center gap-1.5 ${presc.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : presc.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                          {presc.status}
                        </span>
                      </div>
                    ))}
                    {prescriptions.length === 0 && <p className="text-slate-500 text-sm italic col-span-2 py-4">No prescriptions uploaded yet.</p>}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-slate-900">{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
              <button onClick={() => setShowAddressModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
              <div className="relative z-10 mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="Search for an address..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                    />
                    {isSearching && <span className="absolute right-3 top-3 text-xs text-slate-400">Searching...</span>}
                  </div>
                  <button 
                    type="button" 
                    onClick={handleFetchLocation} 
                    disabled={isFetchingLocation}
                    className="flex-shrink-0 flex items-center justify-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <MapPin className="w-4 h-4" />
                    {isFetchingLocation ? 'Locating...' : 'Use Location'}
                  </button>
                </div>
                
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                    {searchResults.map((result: any, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSearchResult(result)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 text-sm text-slate-700 transition-colors"
                      >
                        <span className="font-bold text-slate-900 block">{result.name || (result.address && (result.address.road || result.address.suburb)) || 'Unknown Address'}</span>
                        <span className="text-xs text-slate-500 block truncate mt-0.5">{result.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address Title (e.g., Home, Office)</label>
                <input required type="text" value={addressForm.title} onChange={e => setAddressForm({...addressForm, title: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
                <input required type="text" value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input required type="text" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input required type="text" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 outline-none text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Zip Code</label>
                  <input required type="text" value={addressForm.zipCode} onChange={e => setAddressForm({...addressForm, zipCode: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 outline-none text-sm" />
                </div>
              </div>
              <div className="pt-2 flex items-center gap-2">
                <input type="checkbox" id="isDefault" checked={addressForm.isDefault} onChange={e => setAddressForm({...addressForm, isDefault: e.target.checked})} className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500" />
                <label htmlFor="isDefault" className="text-sm text-slate-700 font-medium">Set as default address</label>
              </div>
              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setShowAddressModal(false)} className="flex-1 py-3 px-4 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors">Save Address</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
