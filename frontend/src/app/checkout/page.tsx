'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, CreditCard, ChevronRight, CheckCircle2, Plus, Loader2, ArrowLeft, ShieldCheck, Wallet
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  const { cartItems, totalAmount, clearCart, subtotal, savings, gstAmount } = useCart();
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
      const itemsPayload = cartItems.map(item => ({
        medicineId: item.id,
        quantity: item.quantity
      }));

      const prescriptionIdStr = sessionStorage.getItem('attachedPrescriptionId');
      const prescriptionId = prescriptionIdStr ? parseInt(prescriptionIdStr, 10) : undefined;

      const orderData = {
        items: itemsPayload,
        couponCode: sessionStorage.getItem('couponCode') || undefined,
        shippingAddressId: 1, // mock valid DB address
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
      <div className="max-w-xl mx-auto px-4 py-32 text-center flex flex-col items-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-brand-600 text-white rounded-full flex items-center justify-center mb-8 shadow-xl shadow-brand-500/30"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Order Confirmed!</h2>
        <p className="text-slate-500 mt-4 text-sm font-medium max-w-sm">
          Thank you. Your order <strong className="text-slate-900">#OD-{createdOrderId}</strong> has been received and is being reviewed by our pharmacists.
        </p>

        <div className="mt-12 w-full space-y-4">
          <Link 
            href="/dashboard/customer" 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Track Order Status
          </Link>
          <Link 
            href="/medicines" 
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-4 px-8 rounded-full transition-all flex items-center justify-center gap-2"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">
          <Link href="/cart" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Bag
          </Link>
          <ChevronRight className="w-3.5 h-3.5 mx-2" />
          <span className="text-slate-900">Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: ADDRESS & PAYMENT */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Address Selection */}
            <div className="bg-white rounded-[2rem] border border-slate-100/50 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-slate-900 text-xl tracking-tight flex items-center gap-3">
                  <span className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-900">1</span>
                  Shipping Address
                </h3>
                
                <button 
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 py-2 px-4 rounded-full flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New Address
                </button>
              </div>

              <AnimatePresence>
                {/* Add Address Form Minimal */}
                {showAddAddress && (
                  <motion.form 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleAddAddress} 
                    className="overflow-hidden"
                  >
                    <div className="bg-slate-50/50 border border-slate-100 rounded-[1.5rem] p-6 space-y-5 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Label (e.g. Home, Work)</label>
                          <input
                            type="text"
                            value={addressTitle}
                            onChange={(e) => setAddressTitle(e.target.value)}
                            className="w-full bg-white border border-slate-200/60 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Country</label>
                          <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full bg-white border border-slate-200/60 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Street Address</label>
                        <input
                          type="text"
                          placeholder="House No, Apartment name, street details"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          className="w-full bg-white border border-slate-200/60 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">City</label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full bg-white border border-slate-200/60 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">State</label>
                          <input
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full bg-white border border-slate-200/60 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Zip Code</label>
                          <input
                            type="text"
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            className="w-full bg-white border border-slate-200/60 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button 
                          type="submit"
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 px-8 rounded-full transition-all"
                        >
                          Save Address
                        </button>
                      </div>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Addresses List */}
              <div className="space-y-4">
                {addresses.map((addr) => (
                  <label 
                    key={addr.id}
                    className={`flex items-start gap-5 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedAddressId === addr.id 
                        ? 'border-brand-500 bg-brand-50/30 shadow-sm' 
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center transition-colors ${
                      selectedAddressId === addr.id ? 'bg-brand-600' : 'bg-slate-200'
                    }`}>
                      {selectedAddressId === addr.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-extrabold text-slate-900 block tracking-tight">{addr.title}</span>
                      <span className="text-slate-500 mt-1 block font-medium leading-relaxed">
                        {addr.street}, {addr.city}, {addr.state} - {addr.zipCode}, {addr.country}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Method selection */}
            <div className="bg-white rounded-[2rem] border border-slate-100/50 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
              <h3 className="font-extrabold text-slate-900 text-xl tracking-tight flex items-center gap-3">
                <span className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-900">2</span>
                Payment Method
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* Cash on Delivery */}
                <label 
                  className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                    paymentMethod === 'COD' 
                      ? 'border-brand-500 bg-brand-50/30 shadow-sm' 
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center transition-colors ${
                    paymentMethod === 'COD' ? 'bg-brand-600' : 'bg-slate-200'
                  }`}>
                    {paymentMethod === 'COD' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-slate-400" />
                      Cash on Delivery
                    </span>
                    <span className="text-slate-500 text-xs mt-1 block font-medium">Pay via cash or UPI to the delivery executive.</span>
                  </div>
                </label>

                {/* Online Payment */}
                <label 
                  className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                    paymentMethod === 'Razorpay' 
                      ? 'border-brand-500 bg-brand-50/30 shadow-sm' 
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center transition-colors ${
                    paymentMethod === 'Razorpay' ? 'bg-brand-600' : 'bg-slate-200'
                  }`}>
                    {paymentMethod === 'Razorpay' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      Online Payment
                      <span className="bg-brand-100 text-brand-700 text-[9px] px-1.5 py-0.5 rounded-full">Secure</span>
                    </span>
                    <span className="text-slate-500 text-xs mt-1 block font-medium">Credit/Debit Cards, UPI, Netbanking.</span>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* RIGHT: INVOICE BREAKDOWN SUMMARY */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-100/50 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6 sticky top-28">
              
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight border-b border-slate-100 pb-4">
                Order Summary
              </h3>

              <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <span className="text-slate-600 font-medium pr-4 leading-tight">{item.name} <span className="text-slate-400">x{item.quantity}</span></span>
                    <span className="font-bold text-slate-900">₹{((item.discountPrice || item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4 text-sm font-semibold text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>- ₹{savings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated GST</span>
                  <span className="text-slate-900">₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-slate-900">{(subtotal - savings) > 500 ? 'Free' : '₹50.00'}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 flex justify-between items-baseline">
                <span className="font-extrabold text-slate-900 text-lg">Total</span>
                <span className="font-black text-brand-600 text-2xl tracking-tight">₹{totalAmount.toFixed(2)}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={processing}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 text-sm shadow-lg shadow-brand-500/20 transition-all text-center disabled:opacity-50 mt-4"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Place Order Securely
                  </>
                )}
              </button>
              <p className="text-center text-xs font-semibold text-slate-400 mt-4">
                By placing your order, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
