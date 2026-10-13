import React, { useEffect, useState } from 'react';
import { View, Text, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import NetInfo from '@react-native-community/netinfo';
import NoInternetScreen from './src/components/NoInternetScreen';
import CustomAlert from './src/components/CustomAlert';
import PushNotificationService from './src/services/PushNotificationService';

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

  useEffect(() => {
    let unsubscribeForeground;
    let unsubscribeTokenRefresh;

    const syncFcmToken = async (token) => {
      if (!token) return;
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('fcmToken', token);

        const accessToken = await AsyncStorage.getItem('accessToken');
        if (accessToken) {
          const api = require('./src/services/api').default;
          await api.put('/account/fcm-token', { fcmToken: token });
          console.log('[FCM] Successfully synchronized push token with backend');
        }
      } catch (err) {
        console.log('[FCM] Failed to sync token with backend:', err?.message || err);
      }
    };

    const initPushNotifications = async () => {
      await PushNotificationService.requestUserPermission();
      const token = await PushNotificationService.getFCMToken();
      if (token) {
        await syncFcmToken(token);
      }

      // Handle token refreshes automatically
      unsubscribeTokenRefresh = PushNotificationService.setupTokenRefresh(async (newToken) => {
        await syncFcmToken(newToken);
      });
    };

    initPushNotifications();

    PushNotificationService.setupForegroundHandler().then(unsub => {
      unsubscribeForeground = unsub;
    });

    // When app resumes or becomes active, sync token if logged in
    const appStateSub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const currentToken = await AsyncStorage.getItem('fcmToken');
          if (currentToken) {
            await syncFcmToken(currentToken);
          }
        } catch (e) {}
      }
    });

    return () => {
      if (unsubscribeForeground) unsubscribeForeground();
      if (unsubscribeTokenRefresh) unsubscribeTokenRefresh();
      if (appStateSub && appStateSub.remove) appStateSub.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <CartProvider>
        <LocationProvider>
          <AppNavigator />
          {isConnected === false && <NoInternetScreen />}
          <CustomAlert />
        </LocationProvider>
      </CartProvider>
    </SafeAreaProvider>
  );
}
