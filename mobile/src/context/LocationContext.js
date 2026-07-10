/**
 * LocationContext.js
 * Stores the user's selected delivery address globally.
 * Persisted in AsyncStorage so selection survives app restarts.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_KEY = '@dosebox_location';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(LOCATION_KEY).then((raw) => {
      if (raw) {
        try { setSelectedAddress(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const selectAddress = (address) => {
    setSelectedAddress(address);
    AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(address));
  };

  const clearAddress = () => {
    setSelectedAddress(null);
    AsyncStorage.removeItem(LOCATION_KEY);
  };

  return (
    <LocationContext.Provider value={{ selectedAddress, selectAddress, clearAddress }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within <LocationProvider>');
  return ctx;
}
