'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  couponCode: string;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  
  // Computed values
  subtotal: number;
  savings: number;
  gstAmount: number;
  totalAmount: number;
  requiresPrescription: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');

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

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qtyToAdd = item.quantity || 1;
    const existingIndex = cartItems.findIndex(i => i.id === item.id);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += qtyToAdd;
      saveCart(updated);
    } else {
      // Create a clean item without the optional quantity property for the rest object
      const { quantity, ...itemWithoutQty } = item;
      saveCart([...cartItems, { ...itemWithoutQty, quantity: qtyToAdd }]);
    }
  };

  const removeFromCart = (id: number) => {
    saveCart(cartItems.filter(i => i.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    const updated = cartItems.map(item => 
      item.id === id ? { ...item, quantity } : item
    );
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
    setCouponCode('');
  };

  const applyCoupon = (code: string) => {
    setCouponCode(code.toUpperCase());
  };

  const removeCoupon = () => {
    setCouponCode('');
  };

  // Computed values
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const savings = cartItems.reduce((acc, item) => {
    const disc = item.discountPrice ? (item.price - item.discountPrice) : 0;
    return acc + (disc * item.quantity);
  }, 0);

  const taxableAmount = subtotal - savings;
  
  // GST calculation (18% inclusive)
  const gstAmount = taxableAmount * 0.18;

  // Shipping details
  const shippingFee = (taxableAmount > 500 || cartItems.length === 0) ? 0 : 50;

  // Basic coupon reductions mock
  let couponDiscount = 0;
  if (couponCode === 'WELCOME10' && taxableAmount >= 200) {
    couponDiscount = taxableAmount * 0.10;
  } else if (couponCode === 'HEALTH20' && taxableAmount >= 500) {
    couponDiscount = Math.min(taxableAmount * 0.20, 250);
  } else if (couponCode === 'FLAT50' && taxableAmount >= 300) {
    couponDiscount = 50;
  }

  const totalAmount = Math.max(0, taxableAmount - couponDiscount + shippingFee);

  const requiresPrescription = cartItems.some(item => item.prescriptionRequired);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      couponCode,
      applyCoupon,
      removeCoupon,
      subtotal,
      savings,
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
