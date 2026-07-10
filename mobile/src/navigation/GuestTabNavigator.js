import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, User } from 'lucide-react-native';

import HomeScreen from '../screens/user/HomeScreen';
import BrowseMedicinesScreen from '../screens/user/BrowseMedicinesScreen';
import LoginScreen from '../screens/auth/LoginScreen';

import { rs, rv, rm, TAB_BAR_HEIGHT } from '../utils/responsive';

const Tab = createBottomTabNavigator();

const ACTIVE_COLOR = '#1F5C52';
const INACTIVE_COLOR = '#94A3B8';

function TabIcon({ IconComponent, color, focused }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <IconComponent size={rs(22)} color={color} />
    </View>
  );
}

export default function GuestTabNavigator() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: insets.bottom + rv(6),
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name="GuestHome"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={Home} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="GuestExplore"
        component={BrowseMedicinesScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={Search} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="GuestLogin"
        component={LoginScreen}
        options={{
          tabBarLabel: 'Login',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={User} color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: rv(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 16,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabLabel: {
    fontSize: rm(11),
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  tabItem: {
    paddingVertical: rv(2),
  },
  iconWrap: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#EAF4F2',
  },
});
