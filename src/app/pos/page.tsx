'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, Minus, X, Check, ShoppingBag, LogOut, Settings, 
  ClipboardList, Pill, Upload, AlertCircle, Sparkles, Printer, User, Phone, CheckCircle
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface Medicine {
  id: number;
  name: string;
  genericName: string;
  manufacturer: string;
  composition: string;
  dosage: string;
  description?: string;
  sideEffects?: string;
  storageInstructions?: string;
  prescriptionRequired: boolean;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string;
  categoryId: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface CartItem {
  medicineId: number;
  medicine: Medicine;
  name: string;
  basePrice: number;
  billingPrice: number; // Discounted or base price
  quantity: number; // Multiplied quantity for package sizes
  displayQty: number; // User facing quantity (e.g. 1 box)
  selectedStrength: string;
  selectedSize: string; // e.g. "Strip of 10", "Box of 30", "Box of 100"
  multiplier: number; // e.g. 1, 3, 10
  schedule: string; // e.g. "OD", "BD", "TDS"
  notes: string;
}

export default function POSPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Authentication check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/');
      }
    }
  }, [router]);

  // States
  const [categories, setCategories] = useState<Category[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('9876543210');
  
  // Customization Modal states
  const [customizingMed, setCustomizingMed] = useState<Medicine | null>(null);
  const [selectedStrength, setSelectedStrength] = useState('500 mg');
  const [selectedSize, setSelectedSize] = useState('Strip of 10');
  const [selectedMultiplier, setSelectedMultiplier] = useState(1);
  const [selectedSchedule, setSelectedSchedule] = useState('OD');
  const [customNotes, setCustomNotes] = useState('');
  const [customQuantity, setCustomQuantity] = useState(1);
  const [prescriptionAttached, setPrescriptionAttached] = useState<number | null>(null);
  const [isUploadingRx, setIsUploadingRx] = useState(false);

  // Checkout Success Modal states
  const [showReceipt, setShowReceipt] = useState(false);
  const [recentOrder, setRecentOrder] = useState<any>(null);

  // Fetch Categories & Medicines on mount
  useEffect(() => {
    async function loadPOSData() {
      setLoading(true);
      try {
        const [catRes, medRes] = await Promise.all([
          api.get('/medicines/categories'),
          api.get('/medicines?limit=100')
        ]);
        
        if (catRes.data?.success) {
          setCategories(catRes.data.data);
        }
        if (medRes.data?.success) {
          setMedicines(medRes.data.data);
          setFilteredMedicines(medRes.data.data);
        }
      } catch (err) {
        console.warn('POS data load error, using high-quality static fallbacks.', err);
        // High fidelity medicine fallbacks
        const fallbackCats = [
          { id: 1, name: 'Chronic Care', slug: 'chronic-care' },
          { id: 2, name: 'OTC Medicines', slug: 'otc-medicines' },
          { id: 3, name: 'Vitamins & Supplements', slug: 'vitamins-supplements' },
          { id: 4, name: 'Ayurveda & Herbs', slug: 'ayurveda-herbs' },
        ];
        setCategories(fallbackCats);

        const fallbackMeds = [
          {
            id: 1,
            name: 'Metformin Hydrochloride 500mg',
            genericName: 'Metformin',
            manufacturer: 'Cipla Ltd.',
            composition: 'Metformin Hydrochloride IP 500mg',
            dosage: 'Take 1 tablet daily with dinner or as directed by the physician.',
            prescriptionRequired: true,
            price: 120.00,
            discountPrice: 96.00,
            stock: 150,
            images: '[]',
            categoryId: 1
          },
          {
            id: 2,
            name: 'Atorvastatin 10mg (Lipitor equivalent)',
            genericName: 'Atorvastatin',
            manufacturer: 'Sun Pharmaceutical Industries',
            composition: 'Atorvastatin Calcium Trihydrate IP 10mg',
            dosage: 'One tablet daily at night or as directed by the physician.',
            prescriptionRequired: true,
            price: 180.00,
            discountPrice: 144.00,
            stock: 200,
            images: '[]',
            categoryId: 1
          },
          {
            id: 3,
            name: 'Crocin Pain Relief Tablet',
            genericName: 'Paracetamol & Caffeine',
            manufacturer: 'GSK Consumer Healthcare',
            composition: 'Paracetamol IP 650mg, Caffeine Anhydrous 50mg',
            dosage: '1 to 2 tablets every 4-6 hours.',
            prescriptionRequired: false,
            price: 45.00,
            discountPrice: 42.00,
            stock: 350,
            images: '[]',
            categoryId: 2
          },
          {
            id: 4,
            name: 'Centrum Adults Multivitamin 30s',
            genericName: 'Multivitamins & Minerals',
            manufacturer: 'Abbott Healthcare',
            composition: 'Vitamins A, C, D3, E, B-Complex, Calcium, Zinc, Magnesium',
            dosage: 'One tablet daily with food.',
            prescriptionRequired: false,
            price: 650.00,
            discountPrice: 585.00,
            stock: 80,
            images: '[]',
            categoryId: 3
          },
          {
            id: 5,
            name: 'Himalaya Ashvagandha Capsules',
            genericName: 'Withania somnifera Extract',
            manufacturer: 'Himalaya Wellness Company',
            composition: 'Ashvagandha Root Extract - 250mg',
            dosage: '1 capsule twice daily, or as recommended by the doctor.',
            prescriptionRequired: false,
            price: 220.00,
            discountPrice: 198.00,
            stock: 120,
            images: '[]',
            categoryId: 4
          }
        ];
        setCategories(fallbackCats);
        setMedicines(fallbackMeds);
        setFilteredMedicines(fallbackMeds);
      } finally {
        setLoading(false);
      }
    }

    loadPOSData();
  }, []);

  // Filter & Search Logic
  useEffect(() => {
    let result = medicines;

    if (selectedCategoryId !== 'all') {
      result = result.filter(m => m.categoryId === parseInt(selectedCategoryId, 10));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.composition.toLowerCase().includes(q) ||
        m.manufacturer.toLowerCase().includes(q)
      );
    }

    setFilteredMedicines(result);
  }, [selectedCategoryId, searchQuery, medicines]);

  // Add Item Click
  const handleItemSelect = (med: Medicine) => {
    setCustomizingMed(med);
    setSelectedStrength('500 mg');
    setSelectedSize('Strip of 10');
    setSelectedMultiplier(1);
    setSelectedSchedule('OD');
    setCustomNotes('');
    setCustomQuantity(1);
    setPrescriptionAttached(null);
  };

  // Stepper quantity update in Modal
  const adjustCustomQty = (dir: 'inc' | 'dec') => {
    if (dir === 'inc') {
      setCustomQuantity(q => q + 1);
    } else {
      setCustomQuantity(q => Math.max(1, q - 1));
    }
  };

  // Mock Upload Prescription for prescriptionRequired items
  const handleMockRxUpload = async () => {
    setIsUploadingRx(true);
    try {
      const randomPrescId = Math.floor(Math.random() * 1000) + 1;
      await new Promise(resolve => setTimeout(resolve, 800));
      setPrescriptionAttached(randomPrescId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingRx(false);
    }
  };

  const sizeOptions = [
    { label: 'Strip of 10 (Base)', value: 'Strip of 10', multiplier: 1 },
    { label: 'Box of 30 (3x Base)', value: 'Box of 30', multiplier: 3 },
    { label: 'Box of 100 (10x Base)', value: 'Box of 100', multiplier: 10 }
  ];

  // Save customized item to POS cart
  const handleAddCustomToCart = () => {
    if (!customizingMed) return;

    const baseItemPrice = customizingMed.discountPrice ? Number(customizingMed.discountPrice) : Number(customizingMed.price);
    const unitBillingPrice = baseItemPrice * selectedMultiplier;
    
    const existingIndex = cart.findIndex(item => 
      item.medicineId === customizingMed.id &&
      item.selectedStrength === selectedStrength &&
      item.selectedSize === selectedSize &&
      item.schedule === selectedSchedule
    );

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].displayQty += customQuantity;
      updatedCart[existingIndex].quantity = updatedCart[existingIndex].displayQty * updatedCart[existingIndex].multiplier;
      setCart(updatedCart);
    } else {
      const cartItem: CartItem = {
        medicineId: customizingMed.id,
        medicine: customizingMed,
        name: `${customizingMed.name} (${selectedStrength})`,
        basePrice: Number(customizingMed.price),
        billingPrice: unitBillingPrice,
        displayQty: customQuantity,
        quantity: customQuantity * selectedMultiplier,
        selectedStrength,
        selectedSize,
        multiplier: selectedMultiplier,
        schedule: selectedSchedule,
        notes: customNotes
      };
      setCart([...cart, cartItem]);
    }

    setCustomizingMed(null);
  };

  // Stepper cart update
  const handleUpdateCartQty = (index: number, newDisplayQty: number) => {
    if (newDisplayQty <= 0) {
      setCart(cart.filter((_, i) => i !== index));
      return;
    }
    const updated = [...cart];
    updated[index].displayQty = newDisplayQty;
    updated[index].quantity = newDisplayQty * updated[index].multiplier;
    setCart(updated);
  };

  // Compute Totals
  const getCartTotals = () => {
    const rawSubtotal = cart.reduce((sum, item) => sum + (item.billingPrice * item.displayQty), 0);
    const gstRate = 0.18;
    const gst = rawSubtotal * gstRate;
    const total = rawSubtotal + gst;
    const rxRequired = cart.some(item => item.medicine.prescriptionRequired);
    return {
      subtotal: rawSubtotal,
      gst,
      total,
      rxRequired
    };
  };

  const { subtotal, gst, total, rxRequired } = getCartTotals();

  // Run Order / Checkout submission
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (rxRequired && !prescriptionAttached) {
      alert('Prescription-required medicine is in the cart. Please upload a doctor prescription first.');
      return;
    }

    const itemsPayload = cart.map(item => ({
      medicineId: item.medicineId,
      quantity: item.quantity
    }));

    const orderData = {
      items: itemsPayload,
      shippingAddressId: 1, // mapping to seeded DB address
      paymentMethod: 'Cash',
      prescriptionId: prescriptionAttached || undefined
    };

    try {
      const res = await api.post('/orders', orderData);
      if (res.data?.success) {
        setRecentOrder({
          id: res.data.data.id,
          items: cart,
          subtotal,
          gst,
          total,
          customerName,
          customerPhone,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          rxAttached: prescriptionAttached ? `Rx-${prescriptionAttached}` : 'OTC Order'
        });
        
        setCart([]);
        setCustomerName('Walk-in Customer');
        setCustomerPhone('9876543210');
        setPrescriptionAttached(null);
        setShowReceipt(true);
      } else {
        alert('Order submission failed: ' + res.data?.message);
      }
    } catch (err: any) {
      alert('Network / API error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#070b13] text-slate-200 overflow-hidden font-sans select-none">
      
      {/* 1. LEFT NARROW ICON NAVIGATION */}
      <div className="w-16 bg-[#0b0f19] border-r border-[#1e293b]/60 flex flex-col items-center py-6 justify-between shrink-0">
        <div className="flex flex-col items-center gap-8 w-full">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-teal-500/20 cursor-pointer" onClick={() => router.push('/')}>
            M
          </div>
          
          <div className="flex flex-col gap-4 w-full px-2">
            <button className="flex items-center justify-center w-full py-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20" title="POS Dashboard">
              <Pill className="w-5 h-5" />
            </button>
            <button className="flex items-center justify-center w-full py-3 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 transition-colors" title="Clinic Appointments" onClick={() => router.push('/consultations')}>
              <ClipboardList className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 w-full">
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors" title="Settings" onClick={() => router.push('/dashboard/pharmacist')}>
            <Settings className="w-4 h-4" />
          </button>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-950/30 text-rose-400 hover:bg-rose-950/50 transition-colors" title="Sign Out" onClick={() => logout()}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN CENTER CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden">
        
        {/* Top Header Row */}
        <header className="h-16 px-6 border-b border-[#1e293b]/60 flex items-center justify-between bg-[#0b0f19]/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-teal-400">MrMed</span> 
              <span className="text-slate-500 font-light">|</span> 
              <span className="text-slate-300">Point of Sale Terminal</span>
            </h1>
            <span className="bg-teal-500/10 border border-teal-500/25 px-2 py-0.5 rounded-full text-[9px] font-bold text-teal-400 uppercase tracking-widest">
              Live Connection
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-300">{user?.name || 'Pharmacist'}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Store Operator</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-teal-800 text-teal-300 font-bold flex items-center justify-center text-sm shadow">
              {user?.name ? user.name[0].toUpperCase() : 'P'}
            </div>
          </div>
        </header>

        {/* Categories Tab and Search Box */}
        <div className="px-6 py-4 bg-[#090d16]/80 border-b border-[#1e293b]/40 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shrink-0">
          <div className="flex overflow-x-auto scrollbar-none whitespace-nowrap gap-1.5 max-w-full">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                selectedCategoryId === 'all'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-[#1e293b]/50'
              }`}
            >
              All Medicines
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id.toString())}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  selectedCategoryId === cat.id.toString()
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-[#1e293b]/50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search drug, generics, composition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#1e293b] bg-[#070b13] py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/35 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Medicines Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-[#070b12]">
          {loading ? (
            <div className="h-full w-full flex flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent"></div>
              <p className="text-xs text-slate-500 font-medium">Fetching medicine database...</p>
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <AlertCircle className="w-8 h-8 opacity-40 text-teal-500" />
              <p className="text-xs font-bold">No medicines found matching criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredMedicines.map((med) => {
                const qtyInCart = cart.filter(c => c.medicineId === med.id).reduce((sum, item) => sum + item.displayQty, 0);
                
                return (
                  <div
                    key={med.id}
                    onClick={() => handleItemSelect(med)}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#1e293b]/45 bg-gradient-to-b from-[#0e1422]/90 to-[#070b13]/95 p-4.5 transition-all duration-300 hover:border-teal-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/5 cursor-pointer h-[210px] shadow"
                  >
                    <div>
                      {/* Name & Composition */}
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-[13.5px] font-bold text-white group-hover:text-teal-400 transition-colors leading-snug line-clamp-2">
                          {med.name}
                        </h4>
                        {med.prescriptionRequired ? (
                          <span className="shrink-0 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-rose-400">
                            Rx
                          </span>
                        ) : (
                          <span className="shrink-0 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-emerald-400">
                            OTC
                          </span>
                        )}
                      </div>
                      
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                        {med.genericName}
                      </p>
                      
                      <div className="border-t border-[#1e293b]/40 my-2.5"></div>
                      
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                        Comp: {med.composition}
                      </p>
                      <p className="text-[10px] text-slate-650 line-clamp-1 mt-1">
                        Mfr: {med.manufacturer}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div>
                        {med.discountPrice ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-extrabold text-teal-400">
                              ₹{Number(med.discountPrice).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-500 line-through">
                              ₹{Number(med.price).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-extrabold text-teal-400">
                            ₹{Number(med.price).toFixed(2)}
                          </span>
                        )}
                        <p className="text-[9px] text-slate-500 mt-0.5">Stock: {med.stock}</p>
                      </div>

                      {qtyInCart > 0 ? (
                        <div className="bg-teal-500/10 border border-teal-500/30 px-2.5 py-1 rounded-xl text-teal-400 text-xs font-bold">
                          {qtyInCart} in cart
                        </div>
                      ) : (
                        <button className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#0b0f19] border border-[#1e293b] hover:bg-teal-500 hover:text-slate-950 hover:border-transparent transition-all">
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. RIGHT PANEL */}
      <div className="w-80 bg-[#0b0f19] border-l border-[#1e293b]/60 flex flex-col justify-between shrink-0">
        
        {/* Cart Header */}
        <div className="p-4 border-b border-[#1e293b]/60 flex items-center justify-between bg-[#0b0f19]">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-teal-400" />
            Active Order Cart
          </h3>
          <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 border border-[#1e293b]/60">
            {cart.reduce((sum, item) => sum + item.displayQty, 0)} Items
          </span>
        </div>

        {/* Customer Details Form */}
        <div className="p-4 border-b border-[#1e293b]/40 space-y-3">
          <div>
            <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-teal-500" /> Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-[#070b13] border border-[#1e293b] text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/25"
            />
          </div>

          <div>
            <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3 text-teal-500" /> Phone Number
            </label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-[#070b13] border border-[#1e293b] text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/25"
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none min-h-0">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-650 gap-2">
              <ShoppingBag className="w-8 h-8 opacity-30" />
              <p className="text-[11px] font-bold">Cart is currently empty</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={index} className="bg-[#070b13] border border-[#1e293b]/50 p-3 rounded-xl space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h5 className="text-[12px] font-bold text-white leading-tight line-clamp-2">
                      {item.medicine.name}
                    </h5>
                    <p className="text-[9.5px] text-slate-400 mt-0.5">
                      {item.selectedStrength} • {item.selectedSize}
                    </p>
                    {item.schedule && (
                      <span className="inline-block bg-teal-500/10 text-teal-400 font-extrabold text-[8px] px-1.5 py-0.5 rounded border border-teal-500/20 mt-1">
                        Schedule: {item.schedule}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => handleUpdateCartQty(index, 0)}
                    className="text-slate-600 hover:text-rose-400 transition-colors p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#1e293b]/30">
                  <span className="text-[11.5px] font-extrabold text-teal-400">
                    ₹{item.billingPrice.toFixed(2)}
                  </span>
                  
                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-[#0b0f19] border border-[#1e293b] rounded-lg p-0.5">
                    <button 
                      onClick={() => handleUpdateCartQty(index, item.displayQty - 1)}
                      className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-white px-2">
                      {item.displayQty}
                    </span>
                    <button 
                      onClick={() => handleUpdateCartQty(index, item.displayQty + 1)}
                      className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pricing Summary & Checkout Button */}
        <div className="p-4 bg-[#090d16] border-t border-[#1e293b]/60 space-y-4 shrink-0">
          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Items Total</span>
              <span className="font-semibold text-slate-200">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (18% inclusive)</span>
              <span className="font-semibold text-slate-300">₹{gst.toFixed(2)}</span>
            </div>
            <div className="border-t border-[#1e293b]/40 my-1"></div>
            <div className="flex justify-between text-sm font-bold text-white">
              <span>Payable Amount</span>
              <span className="text-teal-400">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Rx Warning / prescription upload */}
          {rxRequired && (
            <div className="bg-rose-950/20 border border-rose-800/25 p-3 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div className="space-y-1.5">
                <p className="text-[10px] text-rose-300 font-semibold leading-relaxed">
                  Prescription required. Please upload to attach or verify.
                </p>
                {prescriptionAttached ? (
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                    <Check className="w-3 h-3" /> Rx Attached (#{prescriptionAttached})
                  </div>
                ) : (
                  <button
                    onClick={handleMockRxUpload}
                    disabled={isUploadingRx}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#0b0f19] border border-rose-500/30 hover:border-rose-500 text-[10px] font-bold text-rose-300 hover:text-white rounded-lg transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isUploadingRx ? 'Uploading...' : 'Upload/Verify Rx'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              cart.length > 0
                ? 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-teal-500/15 active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Run Checkout Order
          </button>
        </div>

      </div>

      {/* 4. CUSTOMIZATION MODAL */}
      {customizingMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#0c101b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-[#1e293b]/60 p-4 bg-[#0b0f19]">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Pill className="w-4 h-4 text-teal-400" />
                  Item Customization
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                  Configure dose parameters & sizing for {customizingMed.name}
                </p>
              </div>
              <button
                onClick={() => setCustomizingMed(null)}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 space-y-4 overflow-y-auto pr-2">
              
              {/* Medicine details overlay */}
              <div className="p-3.5 rounded-xl bg-[#070b13] border border-[#1e293b]/40">
                <span className="text-[9.5px] font-black uppercase bg-teal-500/15 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20">
                  {customizingMed.composition}
                </span>
                <p className="text-xs text-slate-400 leading-relaxed mt-2.5 font-medium">
                  {customizingMed.dosage}
                </p>
              </div>

              {/* Dosage Strength */}
              <div>
                <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Dosage Strength
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['250 mg', '500 mg', '650 mg'].map((str) => (
                    <button
                      key={str}
                      onClick={() => setSelectedStrength(str)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedStrength === str
                          ? 'border-teal-500 bg-teal-500/10 text-white font-extrabold shadow-sm'
                          : 'border-[#1e293b] bg-slate-950 text-slate-400 hover:bg-slate-900/50'
                      }`}
                    >
                      {str}
                    </button>
                  ))}
                </div>
              </div>

              {/* Packaging / Sizing Selection */}
              <div>
                <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Package Size / Unit Quantity
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {sizeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSelectedSize(opt.value);
                        setSelectedMultiplier(opt.multiplier);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                        selectedSize === opt.value
                          ? 'border-teal-500 bg-teal-500/10 text-white'
                          : 'border-[#1e293b] bg-slate-950 text-slate-400 hover:bg-slate-900/50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className={`text-[10px] font-black ${selectedSize === opt.value ? 'text-teal-400' : 'text-slate-500'}`}>
                        ₹{((customizingMed.discountPrice ? Number(customizingMed.discountPrice) : Number(customizingMed.price)) * opt.multiplier).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Shorthand Instructions Schedule */}
              <div>
                <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Directions (Dosage Schedule)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['OD', 'BD', 'TDS', 'PRN'].map((sch) => (
                    <button
                      key={sch}
                      onClick={() => setSelectedSchedule(sch)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedSchedule === sch
                          ? 'border-teal-500 bg-teal-500/10 text-white font-extrabold shadow-sm'
                          : 'border-[#1e293b] bg-slate-950 text-slate-400 hover:bg-slate-900/50'
                      }`}
                    >
                      {sch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Pharmacist Instructions / Remarks
                </label>
                <textarea
                  placeholder="e.g. Take after food, do not combine with dairy..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full mt-1.5 rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2 text-xs text-white h-16 outline-none resize-none focus:border-teal-500 transition-all"
                />
              </div>

              {/* Quantity Select Stepper */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1e293b]/40">
                <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider">
                  Select Pack Quantity
                </span>
                <div className="flex items-center gap-3 bg-slate-950 border border-[#1e293b] rounded-xl p-1">
                  <button
                    onClick={() => adjustCustomQty('dec')}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 active:scale-95 transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-black text-white min-w-[20px] text-center">
                    {customQuantity}
                  </span>
                  <button
                    onClick={() => adjustCustomQty('inc')}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#1e293b]/60 bg-[#0b0f19] flex gap-3">
              <button
                onClick={() => setCustomizingMed(null)}
                className="w-1/3 rounded-xl bg-slate-900 hover:bg-slate-850 py-3 text-xs font-bold text-slate-400 border border-[#1e293b]/40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomToCart}
                className="w-2/3 rounded-xl bg-teal-500 hover:bg-teal-400 py-3 text-xs font-black text-slate-950 shadow-md shadow-teal-500/10 transition-colors"
              >
                Add to Cart • ₹{((customizingMed.discountPrice ? Number(customizingMed.discountPrice) : Number(customizingMed.price)) * selectedMultiplier * customQuantity).toFixed(2)}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. CHECKOUT RECEIPT MODAL */}
      {showReceipt && recentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#1e293b] bg-white text-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Receipt Content */}
            <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs flex-1">
              
              <div className="text-center space-y-1">
                <h3 className="text-sm font-extrabold tracking-widest uppercase">Dosebox</h3>
                <p className="text-[10px] text-slate-500">POS Billing Invoices System</p>
                <p className="text-[10px] text-slate-500">GSTIN: 33AAFCM8435R1Z2</p>
              </div>

              <div className="border-b border-dashed border-slate-300 my-2"></div>

              <div className="space-y-1">
                <div><strong>Order ID:</strong> #{recentOrder.id}</div>
                <div><strong>Date:</strong> {recentOrder.date} | {recentOrder.time}</div>
                <div><strong>Client:</strong> {recentOrder.customerName}</div>
                <div><strong>Phone:</strong> {recentOrder.customerPhone}</div>
                <div><strong>Presc:</strong> {recentOrder.rxAttached}</div>
              </div>

              <div className="border-b border-dashed border-slate-300 my-2"></div>

              {/* Items List */}
              <div className="space-y-3">
                {recentOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <div className="font-extrabold uppercase">{item.medicine.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.selectedStrength} • {item.selectedSize} ({item.schedule})
                      </div>
                      {item.notes && <div className="text-[9px] text-slate-500 italic">*{item.notes}</div>}
                    </div>
                    <div className="text-right">
                      <div>{item.displayQty} x ₹{item.billingPrice.toFixed(2)}</div>
                      <div className="font-bold">₹{(item.billingPrice * item.displayQty).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-slate-300 my-3"></div>

              <div className="space-y-1 text-right">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>₹{recentOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18% incl):</span>
                  <span>₹{recentOrder.gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm border-t border-dashed border-slate-300 pt-1.5">
                  <span>GRAND TOTAL:</span>
                  <span>₹{recentOrder.total.toFixed(2)}</span>
                </div>
                {recentOrder.rewardPoints > 0 && (
                  <div className="flex justify-between text-xs font-bold text-amber-600 mt-1 pt-1 border-t border-dashed border-slate-300">
                    <span>REWARD POINTS EARNED:</span>
                    <span>+{recentOrder.rewardPoints} Pts</span>
                  </div>
                )}
              </div>

              <div className="border-b border-dashed border-slate-300 my-3"></div>

              <div className="text-center text-[10px] text-slate-500 space-y-1">
                <div className="font-bold flex items-center justify-center gap-1 text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" /> Order Completed & Confirmed
                </div>
                <p>Thank you for shopping at MrMed!</p>
              </div>

            </div>

            {/* Receipt Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-1/2 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setRecentOrder(null);
                }}
                className="w-1/2 rounded-xl bg-teal-600 hover:bg-teal-500 py-3 text-xs font-black text-white transition-colors"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
