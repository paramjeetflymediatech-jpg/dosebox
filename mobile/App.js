import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import NetInfo from '@react-native-community/netinfo';
import NoInternetScreen from './src/components/NoInternetScreen';

import { CartProvider } from './src/context/CartContext';
import { LocationProvider } from './src/context/LocationContext';

export default function App() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <CartProvider>
        <LocationProvider>
          <AppNavigator />
          {isConnected === false && <NoInternetScreen />}
        </LocationProvider>
      </CartProvider>
    </SafeAreaProvider>
  );
}
