'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, XCircle } from 'lucide-react';
import api from '../../../lib/api';
import { toast } from 'react-hot-toast';

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

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState({ title: '', street: '', city: '', state: '', zipCode: '', isDefault: false });
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

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

  async function loadAddresses() {
    try {
      const res = await api.get('/account/addresses');
      if (res.data?.success) setAddresses(res.data.data);
    } catch (err) {
      console.error('Failed to load addresses', err);
    } finally {
      setLoading(false);
    }
  }

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
      loadAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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
                {addr.isDefault && <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">Default</span>}
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
    </>
  );
}
