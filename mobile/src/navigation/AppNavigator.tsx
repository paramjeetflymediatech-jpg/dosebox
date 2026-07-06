import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import UploadPrescriptionScreen from '../screens/UploadPrescriptionScreen';
import BrowseMedicinesScreen from '../screens/BrowseMedicinesScreen';
import CartCheckoutScreen from '../screens/CartCheckoutScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="UploadPrescription" component={UploadPrescriptionScreen} />
        <Stack.Screen name="BrowseMedicines" component={BrowseMedicinesScreen} />
        <Stack.Screen name="CartCheckout" component={CartCheckoutScreen} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
