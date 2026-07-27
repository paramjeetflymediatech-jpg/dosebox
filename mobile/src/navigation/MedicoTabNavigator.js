import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import MedicoDashboardScreen from '../screens/medico/MedicoDashboardScreen';
import MedicoOrdersScreen from '../screens/medico/MedicoOrdersScreen';
import MedicoMedicinesScreen from '../screens/medico/MedicoMedicinesScreen';
import MedicoPrescriptionsScreen from '../screens/medico/MedicoPrescriptionsScreen';
import ContentReviewScreen from '../screens/medico/ContentReviewScreen';

import { rs, rv, rm, TAB_BAR_HEIGHT } from '../utils/responsive';

const Tab = createBottomTabNavigator();

const ACTIVE_COLOR = '#1F5C52';
const INACTIVE_COLOR = '#94A3B8';

function TabIcon({ iconName, color, focused }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={iconName} size={rs(22)} color={color} />
    </View>
  );
}

export default function MedicoTabNavigator() {
  const insets = useSafeAreaInsets();
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
        name="DashboardTab"
        component={MedicoDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => <TabIcon iconName={focused ? 'grid' : 'grid-outline'} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={MedicoOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, focused }) => <TabIcon iconName={focused ? 'cube' : 'cube-outline'} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MedicinesTab"
        component={MedicoMedicinesScreen}
        options={{
          tabBarLabel: 'Medicines',
          tabBarIcon: ({ color, focused }) => <TabIcon iconName={focused ? 'medkit' : 'medkit-outline'} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="PrescriptionsTab"
        component={MedicoPrescriptionsScreen}
        options={{
          tabBarLabel: 'Rx Review',
          tabBarIcon: ({ color, focused }) => <TabIcon iconName={focused ? 'document-text' : 'document-text-outline'} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ContentReviewTab"
        component={ContentReviewScreen}
        options={{
          tabBarLabel: 'QC Hub',
          tabBarIcon: ({ color, focused }) => <TabIcon iconName={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} color={color} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9',
    paddingTop: rv(6), shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06, shadowRadius: 8, position: 'absolute', left: 0, right: 0, bottom: 0,
  },
  tabLabel: { fontSize: rm(11), fontWeight: '500', letterSpacing: 0.1 },
  tabItem: { paddingVertical: rv(2) },
  iconWrap: { width: rs(38), height: rs(38), borderRadius: rs(10), alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: '#EAF4F2' },
});
