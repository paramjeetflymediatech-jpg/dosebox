import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius, isTablet } from '../../utils/responsive';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // First load from local storage for instant render
      AsyncStorage.getItem('user').then((val) => {
        if (val) setUser(JSON.parse(val));
      });
      // Then fetch latest from backend
      api.get('/account/profile')
        .then(async (res) => {
          if (res.data?.success && res.data.data) {
            setUser(res.data.data);
            await AsyncStorage.setItem('user', JSON.stringify(res.data.data));
          }
        })
        .catch(err => console.error('Failed to fetch profile', err));
    }, [])
  );

  const performLogout = async () => {
    setShowLogoutModal(false);
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');

    // Clear the root stack and navigate to GuestTabs
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'GuestTabs' }],
      })
    );
  };

  const handleLogoutPress = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        performLogout();
      }
    } else {
      setShowLogoutModal(true);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const menuItems = [
    { label: 'My Prescriptions', route: 'UserPrescriptions', icon: 'document-text', color: '#3b82f6', bgColor: '#eff6ff' },
    { label: 'My Consultations', route: 'UserConsultations', icon: 'medkit', color: '#10b981', bgColor: '#ecfdf5' },
    { label: 'Reward Points', route: 'UserRewards', icon: 'star', color: '#f59e0b', bgColor: '#fffbeb' },
    { label: 'Manage Addresses', route: 'UserAddresses', icon: 'location', color: '#8b5cf6', bgColor: '#f5f3ff' },
    { label: 'My Orders', route: 'Proceed', icon: 'cube', color: '#ec4899', bgColor: '#fdf2f8' },
    { label: 'Personal Information', route: 'UserProfileEdit', icon: 'person', color: '#0ea5e9', bgColor: '#f0f9ff' },
    { label: 'Account Deletion', route: 'DataDeletion', icon: 'trash', color: '#ef4444', bgColor: '#fef2f2' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: rs(12) }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={rs(24)} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
        </View>

        {/* Premium Profile Card */}
        <View style={styles.premiumProfileCard}>
          <View style={styles.profileContentRow}>
            <View style={[styles.avatarPremium, isTablet && styles.avatarTablet]}>
              <Text style={[styles.avatarTextPremium, isTablet && styles.avatarTextTablet]}>
                {initials}
              </Text>
            </View>
            <View style={styles.profileInfoPremium}>
              <Text style={styles.userNamePremium}>{user?.name || 'Guest User'}</Text>
              <Text style={styles.userEmailPremium}>{user?.email || 'Welcome to DoseBox'}</Text>
              {user?.doseboxTokens !== undefined && (
                <View style={styles.tokenBadgePremium}>
                  <Ionicons name="star" size={14} color="#F59E0B" style={{ marginRight: rs(4) }} />
                  <Text style={styles.tokenTextPremium}>{user.doseboxTokens} Tokens</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.editBtnPremium} activeOpacity={0.8} onPress={() => navigation.navigate('UserProfileEdit')}>
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i === menuItems.length - 1 && styles.menuItemLast]}
              activeOpacity={0.6}
              onPress={() => item.route && navigation.navigate(item.route)}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconWrap, { backgroundColor: item.bgColor }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Dosebox v0.0.1</Text>
      </ScrollView>

      {/* Custom Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to sign out of your account?</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={performLogout}>
                <Text style={styles.modalBtnConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingBottom: rv(120) },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: rv(16),
    paddingBottom: rv(12),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: rm(22),
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  premiumProfileCard: {
    backgroundColor: '#1F5C52', // DoseBox primary color
    marginHorizontal: spacing.md,
    marginTop: rv(20),
    marginBottom: rv(20),
    borderRadius: radius['2xl'] || 16,
    padding: rv(20),
    shadowColor: '#1F5C52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  profileContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPremium: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarTextPremium: {
    color: '#1F5C52',
    fontSize: rm(26),
    fontWeight: '800',
  },
  avatarTablet: {
    width: rs(100),
    height: rs(100),
    borderRadius: rs(50),
  },
  avatarTextTablet: { fontSize: rm(36) },
  profileInfoPremium: {
    flex: 1,
    marginLeft: rs(16),
  },
  userNamePremium: {
    fontSize: rm(20),
    fontWeight: '700',
    color: '#fff',
    marginBottom: rv(2),
  },
  userEmailPremium: {
    fontSize: rm(13),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: rv(8),
  },
  tokenBadgePremium: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF08A', // vibrant yellow highlight
    borderWidth: 1,
    borderColor: '#FDE047',
    alignSelf: 'flex-start',
    paddingHorizontal: rs(12),
    paddingVertical: rv(6),
    borderRadius: radius.full,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tokenTextPremium: {
    color: '#92400E', // dark amber/gold for strong contrast
    fontWeight: '800',
    fontSize: rm(13),
  },
  editBtnPremium: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    marginBottom: rv(14),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: rv(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuLabel: {
    fontSize: rm(15),
    fontWeight: '600',
    color: '#0F172A',
  },
  logoutBtn: {
    marginHorizontal: spacing.md,
    marginBottom: rv(12),
    backgroundColor: '#FEF2F2',
    paddingVertical: rv(16),
    borderRadius: radius.md,
    alignItems: 'center',
  },
  logoutText: { color: '#EF4444', fontWeight: '600', fontSize: rm(15) },
  version: {
    textAlign: 'center',
    color: '#CBD5E1',
    fontSize: rm(12),
    marginBottom: rv(24),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: rm(20),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: rv(12),
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: rm(15),
    color: '#475569',
    textAlign: 'center',
    marginBottom: rv(24),
    lineHeight: rv(22),
  },
  modalActions: {
    flexDirection: 'row',
    gap: rv(12),
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: rv(14),
    backgroundColor: '#F1F5F9',
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    color: '#475569',
    fontSize: rm(15),
    fontWeight: '600',
  },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: rv(14),
    backgroundColor: '#EF4444',
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modalBtnConfirmText: {
    color: '#fff',
    fontSize: rm(15),
    fontWeight: '600',
  },
});
