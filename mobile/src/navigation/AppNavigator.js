import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

import SplashScreen from '../screens/auth/SplashScreen';
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
import MedicoTabNavigator from './MedicoTabNavigator';
import LeadershipTabNavigator from './LeadershipTabNavigator';
import GuestTabNavigator from './GuestTabNavigator';

import UserPrescriptionsScreen from '../screens/user/UserPrescriptionsScreen';
import UserConsultationsScreen from '../screens/user/UserConsultationsScreen';
import UserRewardsScreen from '../screens/user/UserRewardsScreen';
import UserAddressesScreen from '../screens/user/UserAddressesScreen';
import UserProfileEditScreen from '../screens/user/UserProfileEditScreen';
import DataDeletionScreen from '../screens/user/DataDeletionScreen';

import CategoriesScreen from '../screens/explore/CategoriesScreen';
import AboutScreen from '../screens/explore/AboutScreen';
import FAQScreen from '../screens/explore/FAQScreen';
import BlogScreen from '../screens/explore/BlogScreen';
import BlogDetailScreen from '../screens/explore/BlogDetailScreen';
import ContactScreen from '../screens/explore/ContactScreen';
import TestimonialScreen from '../screens/explore/TestimonialScreen';
import NewsScreen from '../screens/explore/NewsScreen';
import TermsScreen from '../screens/explore/TermsScreen';
import PrivacyPolicyScreen from '../screens/explore/PrivacyPolicyScreen';
import RefundPolicyScreen from '../screens/explore/RefundPolicyScreen';
import CookiePolicyScreen from '../screens/explore/CookiePolicyScreen';
import SearchScreen from '../screens/explore/SearchScreen';
import MedicineDetailScreen from '../screens/explore/MedicineDetailScreen';

import AdminModulesScreen from '../screens/admin/AdminModulesScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import AdminAppointmentsScreen from '../screens/admin/AdminAppointmentsScreen';
import AdminBannersScreen from '../screens/admin/AdminBannersScreen';
import AdminBlogsScreen from '../screens/admin/AdminBlogsScreen';
import AdminBrandsScreen from '../screens/admin/AdminBrandsScreen';
import AdminCategoriesScreen from '../screens/admin/AdminCategoriesScreen';
import AdminCouponsScreen from '../screens/admin/AdminCouponsScreen';
import AdminDoctorsScreen from '../screens/admin/AdminDoctorsScreen';
import AdminFAQsScreen from '../screens/admin/AdminFAQsScreen';
import AdminGlobalSEOScreen from '../screens/admin/AdminGlobalSEOScreen';
import AdminPrescriptionsScreen from '../screens/admin/AdminPrescriptionsScreen';
import AdminRewardsScreen from '../screens/admin/AdminRewardsScreen';
import AdminSEOScreen from '../screens/admin/AdminSEOScreen';
import AdminSuppliersScreen from '../screens/admin/AdminSuppliersScreen';
import AdminTransactionsScreen from '../screens/admin/AdminTransactionsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminMedicinesScreen from '../screens/admin/AdminMedicinesScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminPrescriptionReviewScreen from '../screens/admin/AdminPrescriptionReviewScreen';
import AdminDataDeletionScreen from '../screens/admin/AdminDataDeletionScreen';
import AdminEnterpriseScreen from '../screens/admin/AdminEnterpriseScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="GuestTabs" component={GuestTabNavigator} options={{ animation: 'fade' }} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ animation: 'fade' }} />
        <Stack.Screen name="AdminTabs" component={AdminTabNavigator} options={{ animation: 'fade' }} />
        <Stack.Screen name="MedicoTabs" component={MedicoTabNavigator} options={{ animation: 'fade' }} />
        <Stack.Screen name="LeadershipTabs" component={LeadershipTabNavigator} options={{ animation: 'fade' }} />
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
        <Stack.Screen name="UserPrescriptions" component={UserPrescriptionsScreen} />
        <Stack.Screen name="UserConsultations" component={UserConsultationsScreen} />
        <Stack.Screen name="UserRewards" component={UserRewardsScreen} />
        <Stack.Screen name="UserAddresses" component={UserAddressesScreen} />
        <Stack.Screen name="UserProfileEdit" component={UserProfileEditScreen} />
        <Stack.Screen name="DataDeletion" component={DataDeletionScreen} />

        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="FAQ" component={FAQScreen} />
        <Stack.Screen name="Blog" component={BlogScreen} />
        <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
        <Stack.Screen name="Contact" component={ContactScreen} />
        <Stack.Screen name="Testimonial" component={TestimonialScreen} />
        <Stack.Screen name="News" component={NewsScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="RefundPolicy" component={RefundPolicyScreen} />
        <Stack.Screen name="CookiePolicy" component={CookiePolicyScreen} />
        <Stack.Screen name="SearchScreen" component={SearchScreen} />
        <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen} />

        {/* Admin Screens */}
        <Stack.Screen name="AdminModules" component={AdminModulesScreen} />
        <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
        <Stack.Screen name="AdminAppointments" component={AdminAppointmentsScreen} />
        <Stack.Screen name="AdminBanners" component={AdminBannersScreen} />
        <Stack.Screen name="AdminBlogs" component={AdminBlogsScreen} />
        <Stack.Screen name="AdminBrands" component={AdminBrandsScreen} />
        <Stack.Screen name="AdminCategories" component={AdminCategoriesScreen} />
        <Stack.Screen name="AdminCoupons" component={AdminCouponsScreen} />
        <Stack.Screen name="AdminDoctors" component={AdminDoctorsScreen} />
        <Stack.Screen name="AdminFAQs" component={AdminFAQsScreen} />
        <Stack.Screen name="AdminGlobalSEO" component={AdminGlobalSEOScreen} />
        <Stack.Screen name="AdminPrescriptions" component={AdminPrescriptionsScreen} />
        <Stack.Screen name="AdminRewards" component={AdminRewardsScreen} />
        <Stack.Screen name="AdminSEO" component={AdminSEOScreen} />
        <Stack.Screen name="AdminSuppliers" component={AdminSuppliersScreen} />
        <Stack.Screen name="AdminTransactions" component={AdminTransactionsScreen} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
        <Stack.Screen name="AdminMedicines" component={AdminMedicinesScreen} />
        <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} />
        <Stack.Screen name="AdminPrescriptionReview" component={AdminPrescriptionReviewScreen} />
        <Stack.Screen name="AdminDataDeletion" component={AdminDataDeletionScreen} />
        <Stack.Screen name="AdminEnterprise" component={AdminEnterpriseScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

