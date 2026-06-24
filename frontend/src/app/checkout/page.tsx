'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, CreditCard, ChevronRight, CheckCircle2, ShoppingBag, Plus, Sparkles, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

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

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  
  // States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Razorpay'>('COD');
  
  // Inline address creation fields
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressTitle, setAddressTitle] = useState('Home');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('India');
  
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  // Load addresses on mount
  useEffect(() => {
    if (!user) return;
    async function loadAddresses() {
      try {
        // Find user addresses from orders/my or mock profile
        const res = await api.get('/orders/my'); // Or fetch address list if any
        // In local mock, we can generate a default address if empty
        const defaultList = [
          { id: 1, title: 'Home Address', street: '45, Emerald Residency, Sector 62', city: 'Noida', state: 'Uttar Pradesh', zipCode: '201301', country: 'India', isDefault: true }
        ];
        setAddresses(defaultList);
        setSelectedAddressId(1);
      } catch (err) {
        console.warn('Addresses listing fallback');
      }
    }
    loadAddresses();
  }, [user]);

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!street || !city || !state || !zipCode) {
      alert('Please fill out all address details.');
      return;
    }

    const newAddr: Address = {
      id: Date.now(),
      title: addressTitle,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: false
    };

    setAddresses([...addresses, newAddr]);
    setSelectedAddressId(newAddr.id);
    setShowAddAddress(false);
    
    // Clear inputs
    setStreet('');
    setCity('');
    setState('');
    setZipCode('');
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert('Please select or add a shipping address.');
      return;
    }

    setProcessing(true);
    try {
      // Gather cart details
      const itemsPayload = cartItems.map(item => ({
        medicineId: item.id,
        quantity: item.quantity
      }));

      // Retrieve attached prescription ID if saved
      const prescriptionIdStr = sessionStorage.getItem('attachedPrescriptionId');
      const prescriptionId = prescriptionIdStr ? parseInt(prescriptionIdStr, 10) : undefined;

      const orderData = {
        items: itemsPayload,
        couponCode: sessionStorage.getItem('couponCode') || undefined,
        shippingAddressId: 1, // mapping to valid DB seed address or mock id
        paymentMethod,
        prescriptionId
      };

      const res = await api.post('/orders', orderData);

      if (res.data?.success) {
        setCreatedOrderId(res.data.data.id);
        clearCart();
        sessionStorage.removeItem('attachedPrescriptionId');
        setOrderComplete(true);
      } else {
        alert('Checkout failed: ' + res.data?.message);
      }
    } catch (err: any) {
      alert('Checkout order error: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Order Placed Successfully!</h2>
        <p className="text-slate-500 mt-2 text-sm">
          Your order ID is <strong className="text-slate-800">#OD-{createdOrderId}</strong>. A pharmacist is currently reviewing your order.
        </p>

        <div className="mt-10 space-y-4">
          <Link 
            href="/dashboard/customer" 
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-8 rounded-full shadow-lg shadow-brand-500/10 transition-colors inline-block text-sm"
          >
            Track in Customer Dashboard
          </Link>
          <br />
          <Link 
            href="/medicines" 
            className="text-brand-600 hover:underline font-bold text-sm block"
          >
            Back to Medicine Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-6 uppercase tracking-wider">
          <Link href="/cart" className="hover:text-brand-600">Cart</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600">Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: SHIPPING ADDRESS & PAYMENT SELECTOR */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Address Selection */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-600" />
                  Select Shipping Address
                </h3>
                
                <button 
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="text-xxs font-bold text-brand-600 hover:text-brand-700 border border-brand-200 hover:bg-brand-50/50 py-1 px-3 rounded-full flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Address
                </button>
              </div>

              {/* Add Address Form */}
              {showAddAddress && (
                <form onSubmit={handleAddAddress} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">New Shipping Location</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xxs font-semibold uppercase text-slate-500 mb-1">Address Label</label>
                      <input
                        type="text"
                        value={addressTitle}
                        onChange={(e) => setAddressTitle(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:border-brand-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xxs font-semibold uppercase text-slate-500 mb-1">Country</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:border-brand-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xxs font-semibold uppercase text-slate-500 mb-1">Street Address</label>
                    <input
                      type="text"
                      placeholder="House No, Apartment name, street details"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:border-brand-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xxs font-semibold uppercase text-slate-500 mb-1">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:border-brand-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xxs font-semibold uppercase text-slate-500 mb-1">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:border-brand-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xxs font-semibold uppercase text-slate-500 mb-1">Zip Code</label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:border-brand-500"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2 px-5 rounded-full transition-all"
                  >
                    Save Address
                  </button>
                </form>
              )}

              {/* Addresses List */}
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label 
                    key={addr.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${selectedAddressId === addr.id ? 'border-brand-500 bg-brand-50/10' : 'border-slate-100 hover:bg-slate-50'}`}
                  >
                    <input
                      type="radio"
                      name="selectedAddress"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 accent-brand-600"
                    />
                    <div className="text-xs sm:text-sm">
                      <span className="font-bold text-slate-800 block">{addr.title}</span>
                      <span className="text-slate-500 mt-1 block">
                        {addr.street}, {addr.city}, {addr.state} - {addr.zipCode}, {addr.country}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Method selection */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2 pb-4 border-b border-slate-100">
                <CreditCard className="w-5 h-5 text-brand-600" />
                Select Payment Mode
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cash on Delivery */}
                <label 
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-brand-500 bg-brand-50/10' : 'border-slate-100 hover:bg-slate-50'}`}
                >
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-1 accent-brand-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm block">Cash On Delivery (COD)</span>
                    <span className="text-slate-400 text-xxs mt-0.5 block">Pay in cash or UPI QR upon delivery at doorstep.</span>
                  </div>
                </label>

                {/* Razorpay Simulated */}
                <label 
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'Razorpay' ? 'border-brand-500 bg-brand-50/10' : 'border-slate-100 hover:bg-slate-50'}`}
                >
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={paymentMethod === 'Razorpay'}
                    onChange={() => setPaymentMethod('Razorpay')}
                    className="mt-1 accent-brand-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm block flex items-center gap-1.5">
                      Razorpay Online Payment
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-xxs px-1 font-bold">Fast</span>
                    </span>
                    <span className="text-slate-400 text-xxs mt-0.5 block">Simulates credit cards, debit cards, or net banking portals.</span>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* RIGHT: INVOICE BREAKDOWN SUMMARY */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 uppercase tracking-wider">Summary</h3>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-slate-600">
                    <span className="line-clamp-1 flex-1">{item.name} x {item.quantity}</span>
                    <span className="font-semibold text-slate-800 ml-3">₹{((item.discountPrice || item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex justify-between text-slate-800 text-xs sm:text-sm font-bold">
                  <span>Grand Total Bill:</span>
                  <span className="text-brand-700 text-sm sm:text-base">₹{totalAmount.toFixed(2)}</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={processing}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg shadow-brand-500/10 transition-all text-center disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing Checkout...
                    </>
                  ) : (
                    <>
                      Place Order
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
