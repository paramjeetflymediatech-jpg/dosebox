import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Ionicons from 'react-native-vector-icons/Ionicons';

import HomeScreen from '../screens/user/HomeScreen';
import BrowseMedicinesScreen from '../screens/user/BrowseMedicinesScreen';
import CartCheckoutScreen from '../screens/user/CartCheckoutScreen';
import ProceedScreen from '../screens/user/ProceedScreen';
import ProfileScreen from '../screens/user/ProfileScreen';

import { rs, rv, rm, TAB_BAR_HEIGHT } from '../utils/responsive';

const Tab = createBottomTabNavigator();

const ACTIVE_COLOR = '#0852A1';
const INACTIVE_COLOR = '#6B7280';

function TabIcon({ iconName, color, focused }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={iconName} size={rs(22)} color={color} />
    </View>
  );
}

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  // Height accounts for safe-area bottom (gesture bar on Android / home bar on iOS)
  const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarButton: (props) => <TouchableOpacity {...props} activeOpacity={1} />,
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
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="AlertTab"
        component={require('../screens/user/AlertsScreen').default}
        options={{
          tabBarLabel: 'Alert',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName={focused ? 'notifications' : 'notifications-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName={focused ? 'person' : 'person-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={BrowseMedicinesScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName={focused ? 'compass' : 'compass-outline'} color={color} focused={focused} />
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
    // elevation: 16,
    // Ensure it sits above Android gesture navigation bar
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
    backgroundColor: '#E8F0FE',
  },
});
