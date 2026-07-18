/**
 * CartContext.js
 * Global cart state — persisted to AsyncStorage.
 * Wrap your app with <CartProvider> then use useCart() in any screen.
 */
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertService } from '../services/AlertService';

const CART_KEY = '@dosebox_cart';
const RX_ID_KEY = '@dosebox_rx_id';
const RX_STATUS_KEY = '@dosebox_rx_status';

const CartContext = createContext(null);

const initialState = { items: [] };

function cartReducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      if (state.items.length > 0) return state; // Prevent overwriting newly added items
      return { ...state, items: action.payload };

    case 'ADD': {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, qty: 1 }] };
    }

    case 'REMOVE': {
      const existing = state.items.find((i) => i.id === action.id);
      if (!existing) return state;
      if (existing.qty <= 1) {
        return { ...state, items: state.items.filter((i) => i.id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, qty: i.qty - 1 } : i
        ),
      };
    }

    case 'DELETE':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };

    case 'CLEAR':
      return { ...state, items: [] };

    case 'SET_VERIFIED_CART':
      return { ...state, items: action.payload };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const [isLoaded, setIsLoaded] = React.useState(false);
  const [attachedPrescriptionId, setAttachedPrescriptionId] = React.useState(null);
  const [attachedPrescriptionStatus, setAttachedPrescriptionStatus] = React.useState(null);

  // Load from storage on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(CART_KEY),
      AsyncStorage.getItem(RX_ID_KEY),
      AsyncStorage.getItem(RX_STATUS_KEY)
    ]).then(([raw, rxId, rxStatus]) => {
      if (raw) {
        try {
          dispatch({ type: 'LOAD', payload: JSON.parse(raw) });
        } catch {}
      }
      if (rxId) setAttachedPrescriptionId(rxId);
      if (rxStatus) setAttachedPrescriptionStatus(rxStatus);
      setIsLoaded(true);
    });
  }, []);

  // Persist whenever cart changes
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(CART_KEY, JSON.stringify(state.items));
      if (attachedPrescriptionId) AsyncStorage.setItem(RX_ID_KEY, attachedPrescriptionId);
      else AsyncStorage.removeItem(RX_ID_KEY);
      
      if (attachedPrescriptionStatus) AsyncStorage.setItem(RX_STATUS_KEY, attachedPrescriptionStatus);
      else AsyncStorage.removeItem(RX_STATUS_KEY);
    }
  }, [state.items, attachedPrescriptionId, attachedPrescriptionStatus, isLoaded]);

  const totalQty = state.items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const addToCart = (item, suppressPopup = false) => {
    if (item.prescriptionRequired && attachedPrescriptionId && !suppressPopup) {
      // Loophole prevention: If user adds a new Rx item while holding an approved cart, invalidate the approval
      setAttachedPrescriptionId(null);
      setAttachedPrescriptionStatus(null);
    }
    dispatch({ type: 'ADD', item });
    if (!suppressPopup) {
      AlertService.show({
        type: 'success',
        title: 'Added to Cart',
        message: `${item.name || 'Product'} has been added to your cart.`
      });
    }
  };
  const removeFromCart = (id) => dispatch({ type: 'REMOVE', id });
  const deleteFromCart = (id) => dispatch({ type: 'DELETE', id });
  const clearCart = () => dispatch({ type: 'CLEAR' });
  const setVerifiedCart = (items, rxId) => {
    dispatch({ type: 'SET_VERIFIED_CART', payload: items });
    setAttachedPrescriptionId(String(rxId));
    setAttachedPrescriptionStatus('Approved');
  };

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalQty,
        totalPrice,
        attachedPrescriptionId,
        attachedPrescriptionStatus,
        addToCart,
        removeFromCart,
        deleteFromCart,
        clearCart,
        setVerifiedCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
