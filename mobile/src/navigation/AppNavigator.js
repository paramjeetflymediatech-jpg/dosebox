import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import VerifyOtpScreen from '../screens/auth/VerifyOtpScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import HomeScreen from '../screens/user/HomeScreen';
import UploadPrescriptionScreen from '../screens/user/UploadPrescriptionScreen';
import BrowseMedicinesScreen from '../screens/user/BrowseMedicinesScreen';
import CartCheckoutScreen from '../screens/user/CartCheckoutScreen';
import OrderTrackingScreen from '../screens/user/OrderTrackingScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import ProceedScreen from '../screens/user/ProceedScreen';
import AlertsScreen from '../screens/user/AlertsScreen';
import MainTabNavigator from './MainTabNavigator';
import AdminTabNavigator from './AdminTabNavigator';
import GuestTabNavigator from './GuestTabNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Welcome');

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        if (hasSeenOnboarding === 'true') {
          // If returning user, skip Welcome and Onboarding entirely
          setInitialRoute('MainTabs');
        } else {
          // If first time, show Welcome which auto-navigates to Onboarding
          setInitialRoute('Welcome');
        }
      } catch (e) {
        console.error('Failed to read onboarding status', e);
        setInitialRoute('Welcome');
      } finally {
        setIsReady(true);
      }
    };
    
    checkOnboardingStatus();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F5EF' }}>
        <ActivityIndicator size="large" color="#1F5C52" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="GuestTabs" component={GuestTabNavigator} options={{ animation: 'fade' }} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ animation: 'fade' }} />
        <Stack.Screen name="AdminTabs" component={AdminTabNavigator} options={{ animation: 'fade' }} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="UploadPrescription" component={UploadPrescriptionScreen} />
        <Stack.Screen name="BrowseMedicines" component={BrowseMedicinesScreen} />
        <Stack.Screen name="CartCheckout" component={CartCheckoutScreen} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Proceed" component={ProceedScreen} />
        <Stack.Screen name="Alerts" component={AlertsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

