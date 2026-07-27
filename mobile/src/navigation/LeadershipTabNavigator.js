import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import LeadershipDashboardScreen from '../screens/leadership/LeadershipDashboardScreen';
import LeadershipTransactionsScreen from '../screens/leadership/LeadershipTransactionsScreen';
import LeadershipRewardsScreen from '../screens/leadership/LeadershipRewardsScreen';
import LeadershipDoctorsScreen from '../screens/leadership/LeadershipDoctorsScreen';
import LeadershipSupportScreen from '../screens/leadership/LeadershipSupportScreen';

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

export default function LeadershipTabNavigator() {
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
        component={LeadershipDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => <TabIcon iconName={focused ? 'bar-chart' : 'bar-chart-outline'} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="TransactionsTab"
        component={LeadershipTransactionsScreen}
        options={{
          tabBarLabel: 'Transactions',
          tabBarIcon: ({ color, focused }) => <TabIcon iconName={focused ? 'cash' : 'cash-outline'} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="RewardsTab"
        component={LeadershipRewardsScreen}
        options={{
          tabBarLabel: 'Rewards',
          tabBarIcon: ({ color, focused }) => <TabIcon iconName={focused ? 'gift' : 'gift-outline'} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="DoctorsTab"
        component={LeadershipDoctorsScreen}
        options={{
          tabBarLabel: 'Doctors',
          tabBarIcon: ({ color, focused }) => <TabIcon iconName={focused ? 'medical' : 'medical-outline'} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SupportTab"
        component={LeadershipSupportScreen}
        options={{
          tabBarLabel: 'Support',
          tabBarIcon: ({ color, focused }) => <TabIcon iconName={focused ? 'chatbubbles' : 'chatbubbles-outline'} color={color} focused={focused} />,
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
