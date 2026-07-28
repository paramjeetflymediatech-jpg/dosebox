import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-native-native-stack/native';
import { CommonActions as NavigationActions } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import { AlertService } from '../../services/AlertService';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

export default function MedicoProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
  });

  const fetchProfile = async () => {
    try {
      const res = await api.get('/account/profile');
      if (res.data?.success) {
        setUser(res.data.data);
        await AsyncStorage.setItem('user', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.log('Failed to fetch medico profile:', err);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem('user').then((val) => {
      if (val) setUser(JSON.parse(val));
    });
    fetchProfile();
  }, []);

  const handleOpenEditModal = () => {
    setEditForm({
      name: user?.name || '',
      phone: user?.phone || '',
      currentPassword: '',
      newPassword: '',
    });
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      AlertService.show({ type: 'error', title: 'Validation Error', message: 'Name is required' });
      return;
    }
    
    if (editForm.newPassword && !editForm.currentPassword) {
      AlertService.show({ type: 'error', title: 'Validation Error', message: 'Please enter your current password to set a new one.' });
      return;
    }

    setSavingProfile(true);
    try {
      const res = await api.put('/account/profile', {
        name: editForm.name,
        phone: editForm.phone,
        currentPassword: editForm.currentPassword || undefined,
        newPassword: editForm.newPassword || undefined,
      });

      if (res.data?.success) {
        AlertService.show({ type: 'success', title: 'Success', message: 'Profile updated successfully' });
        setEditModalVisible(false);
        fetchProfile();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      AlertService.show({ type: 'error', title: 'Error', message: msg });
    } finally {
      setSavingProfile(false);
    }
  };

  const performLogout = async () => {
    setShowLogoutModal(false);
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    
    navigation.dispatch(
      NavigationActions.reset({
        index: 0,
        routes: [{ name: 'GuestTabs' }],
      })
    );
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'M';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="arrow-back" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medico Hub</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Floating Profile Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={rs(12)} color="#fff" />
            </View>
          </View>
          
          <Text style={styles.userName}>{user?.name || 'Medico Specialist'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          
          <View style={{ flexDirection: 'row', gap: rs(8), alignItems: 'center' }}>
            <View style={styles.roleBadge}>
              <Ionicons name="medical" size={rs(12)} color="#0D9488" />
              <Text style={styles.roleText}>MEDICO</Text>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={handleOpenEditModal} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={rs(12)} color="#0D9488" />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System Information Section */}
        <Text style={styles.sectionHeader}>System Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="cube-outline" size={20} color="#0EA5E9" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>App Version</Text>
              <Text style={styles.infoValue}>v1.0.0 (Build 42)</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.infoIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="pulse-outline" size={20} color="#16A34A" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>API Status</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6) }}>
                <View style={styles.pulseDot} />
                <Text style={[styles.infoValue, { color: '#16A34A' }]}>All Systems Operational</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={rs(20)} color="#EF4444" style={{ marginRight: rs(8) }} />
          <Text style={styles.logoutText}>Secure Sign Out</Text>
        </TouchableOpacity>
        
        <View style={{ height: rv(40) }} />
      </ScrollView>

      {/* Logout Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Ionicons name="exit-outline" size={rs(32)} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to securely end your session?</Text>
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

      {/* Profile Edit Sliding Bottom Sheet (represented as Modal) */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBottomContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={rm(18)} color="#94A3B8" style={{ marginRight: rs(8) }} />
                <TextInput
                  style={styles.textInput}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                  placeholder="Full name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputBox}>
                <Ionicons name="call-outline" size={rm(18)} color="#94A3B8" style={{ marginRight: rs(8) }} />
                <TextInput
                  style={styles.textInput}
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                  placeholder="Phone number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.divider} />
              <Text style={styles.sectionSubTitle}>Change Password (Optional)</Text>

              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={rm(18)} color="#94A3B8" style={{ marginRight: rs(8) }} />
                <TextInput
                  style={styles.textInput}
                  value={editForm.currentPassword}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, currentPassword: text }))}
                  placeholder="Current password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                />
              </View>

              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-open-outline" size={rm(18)} color="#94A3B8" style={{ marginRight: rs(8) }} />
                <TextInput
                  style={styles.textInput}
                  value={editForm.newPassword}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, newPassword: text }))}
                  placeholder="New password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.saveProfileBtn} onPress={handleSaveProfile} disabled={savingProfile} activeOpacity={0.8}>
                {savingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveProfileBtnText}>Save Updates</Text>}
              </TouchableOpacity>
              <View style={{ height: rv(30) }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: rv(12), paddingBottom: rv(16),
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
  },
  backButton: { padding: rv(4) },
  backIcon: { fontSize: rm(24), color: '#0F172A', fontWeight: '300' },
  headerTitle: { fontSize: rm(20), fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing['2xl'] || 32 },
  
  avatarCard: {
    backgroundColor: '#fff',
    borderRadius: radius['2xl'] || 16,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: rv(20),
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    marginBottom: rv(32),
  },
  avatarContainer: { position: 'relative', marginBottom: rv(16) },
  avatar: {
    width: rs(90), height: rs(90), borderRadius: rs(45),
    backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: '#fff'
  },
  avatarText: { color: '#fff', fontSize: rm(32), fontWeight: '800' },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#10B981', width: rs(26), height: rs(26), borderRadius: rs(13),
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff'
  },
  userName: { fontSize: rm(22), fontWeight: '800', color: '#0F172A', marginBottom: rv(4) },
  userEmail: { fontSize: rm(15), color: '#64748B', marginBottom: rv(16) },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#CCFBF1',
    paddingHorizontal: rs(14), paddingVertical: rv(6), borderRadius: radius.full, gap: rs(4)
  },
  roleText: { color: '#0D9488', fontWeight: '800', fontSize: rm(12), letterSpacing: 0.5 },
  
  sectionHeader: { fontSize: rm(16), fontWeight: '700', color: '#475569', marginBottom: rv(12), marginLeft: rs(4) },
  infoCard: {
    backgroundColor: '#fff', borderRadius: radius.xl, paddingHorizontal: spacing.lg,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { height: 2, width: 0 },
    marginBottom: rv(32)
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: rv(16),
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
  },
  infoIconBox: {
    width: rs(40), height: rs(40), borderRadius: rs(12), backgroundColor: '#E0F2FE',
    alignItems: 'center', justifyContent: 'center', marginRight: rs(16)
  },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: rm(13), color: '#64748B', fontWeight: '500', marginBottom: rv(2) },
  infoValue: { fontSize: rm(15), color: '#0F172A', fontWeight: '600' },
  pulseDot: { width: rs(8), height: rs(8), borderRadius: rs(4), backgroundColor: '#10B981' },
  
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF2F2', paddingVertical: rv(16), borderRadius: radius.xl,
    borderWidth: 1, borderColor: '#FECACA'
  },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: rm(16) },
  
  editBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF4F2',
    paddingHorizontal: rs(14), paddingVertical: rv(6), borderRadius: radius.full, gap: rs(4)
  },
  editBtnText: { color: '#0D9488', fontWeight: '800', fontSize: rm(12) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end', alignItems: 'stretch' },
  modalContent: { backgroundColor: '#fff', borderRadius: radius['2xl'] || 16, padding: spacing.xl, alignSelf: 'center', width: '90%', maxWidth: 400, alignItems: 'center', elevation: 12, marginBottom: 'auto', marginTop: 'auto' },
  modalBottomContent: { backgroundColor: '#fff', borderTopLeftRadius: radius['2xl'] || 16, borderTopRightRadius: radius['2xl'] || 16, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitleText: { fontSize: rm(18), fontWeight: '700', color: '#0F172A' },
  modalBody: { padding: spacing.lg },
  inputLabel: { fontSize: rm(13), fontWeight: '600', color: '#64748B', marginBottom: rv(6), marginTop: rv(12) },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.md, paddingHorizontal: rs(12), height: rv(48) },
  textInput: { flex: 1, fontSize: rm(15), color: '#0F172A', paddingVertical: 0 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: rv(20) },
  sectionSubTitle: { fontSize: rm(15), fontWeight: '700', color: '#0F172A', marginBottom: rv(4) },
  saveProfileBtn: { backgroundColor: '#1F5C52', paddingVertical: rv(14), borderRadius: radius.md, alignItems: 'center', marginTop: rv(24) },
  saveProfileBtnText: { color: '#fff', fontSize: rm(16), fontWeight: '700' },
  modalIconBox: { width: rs(64), height: rs(64), borderRadius: rs(32), backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: rv(16) },
  modalTitle: { fontSize: rm(22), fontWeight: '800', color: '#0F172A', marginBottom: rv(8), textAlign: 'center' },
  modalMessage: { fontSize: rm(15), color: '#475569', textAlign: 'center', marginBottom: rv(24), lineHeight: rv(22) },
  modalActions: { flexDirection: 'row', gap: rv(12), width: '100%' },
  modalBtnCancel: { flex: 1, paddingVertical: rv(14), backgroundColor: '#F1F5F9', borderRadius: radius.xl, alignItems: 'center' },
  modalBtnCancelText: { color: '#475569', fontSize: rm(16), fontWeight: '700' },
  modalBtnConfirm: { flex: 1, paddingVertical: rv(14), backgroundColor: '#EF4444', borderRadius: radius.xl, alignItems: 'center' },
  modalBtnConfirmText: { color: '#fff', fontSize: rm(16), fontWeight: '700' },
});
