import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

export default function AdminProfileScreen({ navigation }) {
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
    
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'GuestTabs' }],
      })
    );
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'A';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Profile</Text>
      </View>

      <View style={styles.avatarCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Administrator'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'admin@dosebox.com'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>SUPER ADMIN</Text>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuLabel}>Account Settings</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]}>
          <Text style={styles.menuLabel}>Security Logs</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)} activeOpacity={0.7}>
        <Text style={styles.logoutText}>Secure Sign Out</Text>
      </TouchableOpacity>

      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to end your admin session?</Text>
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
  header: {
    paddingHorizontal: spacing.md, paddingTop: rv(16), paddingBottom: rv(12),
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: rm(22), fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  avatarCard: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: rv(40), marginBottom: rv(16) },
  avatar: { width: rs(80), height: rs(80), borderRadius: rs(40), backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', marginBottom: rv(14) },
  avatarText: { color: '#fff', fontSize: rm(28), fontWeight: '700' },
  userName: { fontSize: rm(20), fontWeight: '700', color: '#0F172A', marginBottom: rv(4) },
  userEmail: { fontSize: rm(14), color: '#64748B', marginBottom: rv(12) },
  roleBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: rs(12), paddingVertical: rv(4), borderRadius: radius.full },
  roleText: { color: '#DC2626', fontWeight: '800', fontSize: rm(11), letterSpacing: 1 },
  section: { backgroundColor: '#fff', borderRadius: radius.lg, marginHorizontal: spacing.md, marginBottom: rv(24), elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: {height:1, width:0} },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: rv(18), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuItemLast: { borderBottomWidth: 0 },
  menuLabel: { fontSize: rm(15), fontWeight: '500', color: '#0F172A' },
  chevron: { fontSize: rm(22), color: '#CBD5E1', fontWeight: '300' },
  logoutBtn: { marginHorizontal: spacing.md, backgroundColor: '#FEF2F2', paddingVertical: rv(16), borderRadius: radius.md, alignItems: 'center' },
  logoutText: { color: '#EF4444', fontWeight: '600', fontSize: rm(15) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalContent: { backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.xl, width: '100%', maxWidth: 400, elevation: 8 },
  modalTitle: { fontSize: rm(20), fontWeight: '700', color: '#0F172A', marginBottom: rv(12), textAlign: 'center' },
  modalMessage: { fontSize: rm(15), color: '#475569', textAlign: 'center', marginBottom: rv(24), lineHeight: rv(22) },
  modalActions: { flexDirection: 'row', gap: rv(12) },
  modalBtnCancel: { flex: 1, paddingVertical: rv(14), backgroundColor: '#F1F5F9', borderRadius: radius.md, alignItems: 'center' },
  modalBtnCancelText: { color: '#475569', fontSize: rm(15), fontWeight: '600' },
  modalBtnConfirm: { flex: 1, paddingVertical: rv(14), backgroundColor: '#EF4444', borderRadius: radius.md, alignItems: 'center' },
  modalBtnConfirmText: { color: '#fff', fontSize: rm(15), fontWeight: '600' },
});
