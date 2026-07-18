'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  prescriptionRequired: boolean;
  image: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }, bypassRxCheck?: boolean) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  couponCode: string;
  couponObj: any;
  applyCoupon: (code: string, obj: any) => void;
  removeCoupon: () => void;
  
  // Computed values
  subtotal: number;
  savings: number;
  couponDiscount: number;
  gstAmount: number;
  totalAmount: number;
  requiresPrescription: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponObj, setCouponObj] = useState<any>(null);

  // Load cart from LocalStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        try {
          setCartItems(JSON.parse(storedCart));
        } catch (e) {
          localStorage.removeItem('cart');
        }
      }
    }
  }, []);

  // Sync to LocalStorage on change
  const saveCart = (newItems: CartItem[]) => {
    setCartItems(newItems);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(newItems));
    }
  };

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }, bypassRxCheck: boolean = false) => {
    if (!bypassRxCheck && item.prescriptionRequired) {
      if (typeof window !== 'undefined') {
        const existingStatus = localStorage.getItem('attachedPrescriptionStatus');
        if (existingStatus === 'Approved' || existingStatus === 'Verified') {
          localStorage.removeItem('attachedPrescriptionId');
          localStorage.removeItem('attachedPrescriptionStatus');
          toast.error('Added new Rx medicine. Previous prescription approval was unlinked.');
          // Fire event to let cart page know if it's currently open
          window.dispatchEvent(new Event('prescription_unlinked'));
        }
      }
    }

    setCartItems(prev => {
      const qtyToAdd = item.quantity || 1;
      const existingIndex = prev.findIndex(i => i.id === item.id);
      let updated;
      if (existingIndex > -1) {
        updated = [...prev];
        updated[existingIndex].quantity += qtyToAdd;
      } else {
        const { quantity, ...itemWithoutQty } = item;
        updated = [...prev, { ...itemWithoutQty, quantity: qtyToAdd }];
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const removeFromCart = (id: number) => {
    setCartItems(prev => {
      const updated = prev.filter(i => i.id !== id);
      if (typeof window !== 'undefined') localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, quantity } : item);
      if (typeof window !== 'undefined') localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const clearCart = () => {
    saveCart([]);
    setCouponCode('');
  };

  const applyCoupon = (code: string, obj: any) => {
    setCouponCode(code.toUpperCase());
    setCouponObj(obj);
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponObj(null);
  };

  // Computed values
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const savings = cartItems.reduce((acc, item) => {
    const disc = item.discountPrice ? (item.price - item.discountPrice) : 0;
    return acc + (disc * item.quantity);
  }, 0);

  const taxableAmount = subtotal - savings;
  

  // Shipping details
  const shippingFee = (taxableAmount > 500 || cartItems.length === 0) ? 0 : 50;

  // Dynamic coupon calculation based on verified couponObj
  let couponDiscount = 0;
  if (couponObj && taxableAmount >= Number(couponObj.minOrderValue)) {
    if (couponObj.discountType === 'Percentage') {
      couponDiscount = taxableAmount * (Number(couponObj.discountValue) / 100);
      if (couponObj.maxDiscount && couponDiscount > Number(couponObj.maxDiscount)) {
        couponDiscount = Number(couponObj.maxDiscount);
      }
    } else {
      couponDiscount = Number(couponObj.discountValue);
    }
  }

  // GST calculation (18% exclusive)
  const gstAmount = Math.max(0, taxableAmount - couponDiscount) * 0.18;

  const totalAmount = Math.max(0, taxableAmount - couponDiscount + gstAmount + shippingFee);

  const requiresPrescription = cartItems.some(item => item.prescriptionRequired);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      couponCode,
      couponObj,
      applyCoupon,
      removeCoupon,
      subtotal,
      savings,
      couponDiscount,
      gstAmount,
      totalAmount,
      requiresPrescription
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
