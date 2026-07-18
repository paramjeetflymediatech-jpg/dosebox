import React, { useEffect, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { rs, rv, rm, spacing, radius, isTablet } from '../../utils/responsive';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('user').then((val) => {
      if (val) setUser(JSON.parse(val));
    });
  }, []);

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
    // { label: 'Dashboard', sub: 'Overview of your account', route: 'HomeTab' },
    { label: 'My Prescriptions', sub: 'View and upload prescriptions', route: 'UserPrescriptions' },
    { label: 'My Consultations', sub: 'View doctor consultations', route: 'UserConsultations' },
    { label: 'Reward Points', sub: 'View your Dosebox tokens', route: 'UserRewards' },
    { label: 'Manage Addresses', sub: 'Manage delivery locations', route: 'UserAddresses' },
    { label: 'My Orders', sub: 'View your order history', route: 'Proceed' },
    { label: 'Personal Information', sub: 'Update your profile details', route: 'UserProfileEdit' },
    { label: 'Account Deletion', sub: 'Request to delete your account data', route: 'DataDeletion' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={[styles.avatar, isTablet && styles.avatarTablet]}>
            <Text style={[styles.avatarText, isTablet && styles.avatarTextTablet]}>
              {initials}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          {user?.doseboxTokens !== undefined && (
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>⭐ {user.doseboxTokens} DoseBox Tokens</Text>
            </View>
          )}
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
              <View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
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
  avatarCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: rv(32),
    marginBottom: rv(12),
  },
  avatar: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    backgroundColor: '#1F5C52',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rv(14),
  },
  avatarTablet: {
    width: rs(100),
    height: rs(100),
    borderRadius: rs(50),
  },
  avatarText: {
    color: '#fff',
    fontSize: rm(28),
    fontWeight: '700',
  },
  avatarTextTablet: { fontSize: rm(36) },
  userName: {
    fontSize: rm(20),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: rv(4),
  },
  userEmail: {
    fontSize: rm(14),
    color: '#64748B',
    marginBottom: rv(12),
  },
  pointsBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: rs(16),
    paddingVertical: rv(6),
    borderRadius: radius.full,
  },
  pointsText: {
    color: '#1F5C52',
    fontWeight: '600',
    fontSize: rm(13),
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
    paddingVertical: rv(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuLabel: {
    fontSize: rm(15),
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: rv(2),
  },
  menuSub: { fontSize: rm(12), color: '#94A3B8' },
  chevron: { fontSize: rm(22), color: '#CBD5E1', fontWeight: '300' },
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
