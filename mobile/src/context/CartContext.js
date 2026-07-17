/**
 * CartContext.js
 * Global cart state — persisted to AsyncStorage.
 * Wrap your app with <CartProvider> then use useCart() in any screen.
 */
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = '@dosebox_cart';

const CartContext = createContext(null);

const initialState = { items: [] };

function cartReducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      if (state.items.length > 0) return state; // Prevent overwriting newly added items
      return { items: action.payload };

    case 'ADD': {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...action.item, qty: 1 }] };
    }

    case 'REMOVE': {
      const existing = state.items.find((i) => i.id === action.id);
      if (!existing) return state;
      if (existing.qty <= 1) {
        return { items: state.items.filter((i) => i.id !== action.id) };
      }
      return {
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, qty: i.qty - 1 } : i
        ),
      };
    }

    case 'DELETE':
      return { items: state.items.filter((i) => i.id !== action.id) };

    case 'CLEAR':
      return { items: [] };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then((raw) => {
      if (raw) {
        try {
          dispatch({ type: 'LOAD', payload: JSON.parse(raw) });
        } catch {}
      }
      setIsLoaded(true);
    });
  }, []);

  // Persist whenever cart changes
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(CART_KEY, JSON.stringify(state.items));
    }
  }, [state.items, isLoaded]);

  const totalQty = state.items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const addToCart = (item) => dispatch({ type: 'ADD', item });
  const removeFromCart = (id) => dispatch({ type: 'REMOVE', id });
  const deleteFromCart = (id) => dispatch({ type: 'DELETE', id });
  const clearCart = () => dispatch({ type: 'CLEAR' });

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalQty,
        totalPrice,
        addToCart,
        removeFromCart,
        deleteFromCart,
        clearCart,
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
