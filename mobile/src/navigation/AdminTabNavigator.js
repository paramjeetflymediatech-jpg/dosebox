import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Package, Pill } from 'lucide-react-native';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminMedicinesScreen from '../screens/admin/AdminMedicinesScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1F5C52',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        }
      }}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={AdminDashboardScreen} 
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard size={20} color={color} />,
        }}
      />
      <Tab.Screen 
        name="OrdersTab" 
        component={AdminOrdersScreen} 
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color }) => <Package size={20} color={color} />,
        }}
      />
      <Tab.Screen 
        name="MedicinesTab" 
        component={AdminMedicinesScreen} 
        options={{
          tabBarLabel: 'Medicines',
          tabBarIcon: ({ color }) => <Pill size={20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
