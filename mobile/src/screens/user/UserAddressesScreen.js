import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import { AlertService } from '../../services/AlertService';
import Geolocation from '@react-native-community/geolocation';
import PermissionsService from '../../services/PermissionsService';

export default function UserAddressesScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // Form states
  const [form, setForm] = useState({
    title: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    isDefault: false
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/account/addresses');
      if (res.data?.success) {
        setAddresses(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchLocation = async () => {
    const hasPermission = await PermissionsService.requestLocationPermission();
    if (!hasPermission) return;

    setFetchingLocation(true);
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: {
              'User-Agent': 'DoseboxApp/1.0',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            setForm(prev => ({
              ...prev,
              street: addr.road || addr.suburb || addr.neighbourhood || prev.street,
              city: addr.city || addr.town || addr.village || addr.county || prev.city,
              state: addr.state || prev.state,
              zipCode: addr.postcode || prev.zipCode,
              country: addr.country || prev.country
            }));
            AlertService.show({ type: 'success', title: 'Location Found', message: 'Address fields have been auto-filled.' });
          }
        } catch (err) {
          console.error('Geocoding error:', err);
          AlertService.show({ type: 'error', title: 'Error', message: 'Failed to reverse geocode location.' });
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === 2) {
          AlertService.show({ type: 'error', title: 'GPS Disabled', message: 'Please turn on Location (GPS) in your phone settings.' });
        } else {
          AlertService.show({ type: 'error', title: 'Error', message: 'Failed to get current position. Make sure GPS is enabled.' });
        }
        setFetchingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleAddPress = () => {
    setForm({ title: '', street: '', city: '', state: '', zipCode: '', country: 'India', isDefault: false });
    setEditingId(null);
    setModalVisible(true);
  };

  const handleEditPress = (address) => {
    setForm({
      title: address.title || '',
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      country: address.country || 'India',
      isDefault: address.isDefault || false
    });
    setEditingId(address.id);
    setModalVisible(true);
  };

  const handleDeletePress = (id) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAddress(id) }
    ]);
  };

  const deleteAddress = async (id) => {
    try {
      setLoading(true);
      const res = await api.delete(`/account/addresses/${id}`);
      if (res.data?.success) {
        AlertService.show({ type: 'success', title: 'Deleted', message: 'Address deleted successfully.' });
        fetchAddresses();
      }
    } catch (error) {
      console.error('Delete error:', error);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to delete address.' });
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.street || !form.city || !form.state || !form.zipCode) {
      AlertService.show({ type: 'error', title: 'Missing Fields', message: 'Please fill in all required fields.' });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const res = await api.put(`/account/addresses/${editingId}`, form);
        if (res.data?.success) {
          AlertService.show({ type: 'success', title: 'Success', message: 'Address updated successfully.' });
          setModalVisible(false);
          fetchAddresses();
        }
      } else {
        const res = await api.post('/account/addresses', form);
        if (res.data?.success) {
          AlertService.show({ type: 'success', title: 'Success', message: 'Address added successfully.' });
          setModalVisible(false);
          fetchAddresses();
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to save address.' });
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="location" size={20} color="#0c888d" style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>{item.title || 'Address'}</Text>
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => handleEditPress(item)} style={styles.iconBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="create-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeletePress(item.id)} style={styles.iconBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.addressText}>{item.street}</Text>
        <Text style={styles.addressText}>{item.city}, {item.state} {item.zipCode}</Text>
        {item.country ? <Text style={styles.addressText}>{item.country}</Text> : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{top:20, bottom:20, left:20, right:20}}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Addresses</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0c888d" />
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="map-outline" size={48} color="#94a3b8" style={{marginBottom: 16}} />
          <Text style={styles.emptyTitle}>No Addresses Found</Text>
          <Text style={styles.emptySub}>You haven't saved any delivery addresses yet.</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: rv(12) }} />}
        />
      )}
      
      <TouchableOpacity style={styles.fab} onPress={handleAddPress} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Address' : 'Add New Address'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              
              <TouchableOpacity 
                style={styles.locationFetchBtn} 
                onPress={handleFetchLocation} 
                disabled={fetchingLocation}
                activeOpacity={0.7}
              >
                {fetchingLocation ? (
                  <ActivityIndicator color="#0c888d" size="small" />
                ) : (
                  <>
                    <Ionicons name="locate" size={18} color="#0c888d" style={{marginRight: 6}} />
                    <Text style={styles.locationFetchText}>Use Current Location</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Title (e.g. Home, Office)</Text>
              <TextInput style={styles.input} value={form.title} onChangeText={t => setForm({...form, title: t})} placeholder="Home" />

              <Text style={styles.label}>Street Address</Text>
              <TextInput style={styles.input} value={form.street} onChangeText={t => setForm({...form, street: t})} placeholder="123 Main St" multiline />

              <View style={{flexDirection: 'row', gap: 12}}>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>City</Text>
                  <TextInput style={styles.input} value={form.city} onChangeText={t => setForm({...form, city: t})} placeholder="City" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>State</Text>
                  <TextInput style={styles.input} value={form.state} onChangeText={t => setForm({...form, state: t})} placeholder="State" />
                </View>
              </View>

              <View style={{flexDirection: 'row', gap: 12}}>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>ZIP Code</Text>
                  <TextInput style={styles.input} value={form.zipCode} onChangeText={t => setForm({...form, zipCode: t})} placeholder="123456" keyboardType="numeric" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>Country</Text>
                  <TextInput style={styles.input} value={form.country} onChangeText={t => setForm({...form, country: t})} placeholder="India" />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.checkboxRow} 
                activeOpacity={0.7} 
                onPress={() => setForm({...form, isDefault: !form.isDefault})}
              >
                <Ionicons name={form.isDefault ? "checkbox" : "square-outline"} size={22} color={form.isDefault ? "#0c888d" : "#94a3b8"} />
                <Text style={styles.checkboxText}>Set as default delivery address</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Address</Text>}
              </TouchableOpacity>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: rv(16),
    paddingBottom: rv(12),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { marginRight: rs(16), padding: rs(4) },
  headerTitle: { fontSize: rm(20), fontWeight: '700', color: '#0F172A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  list: { padding: spacing.md, paddingBottom: rv(100) },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(8) },
  cardTitle: { fontSize: rm(16), fontWeight: '700', color: '#1E293B' },
  defaultBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: rs(8), paddingVertical: rv(2), borderRadius: radius.sm, borderWidth: 1, borderColor: '#DCFCE7', marginLeft: rs(8) },
  defaultText: { fontSize: rm(10), fontWeight: '600', color: '#16A34A' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 4 },
  addressText: { fontSize: rm(14), color: '#475569', marginBottom: rv(4), lineHeight: rv(20) },
  emptyTitle: { fontSize: rm(18), fontWeight: '700', color: '#1E293B', marginBottom: rv(8) },
  emptySub: { fontSize: rm(14), color: '#64748B', textAlign: 'center', marginBottom: rv(24) },
  fab: {
    position: 'absolute',
    bottom: rv(24),
    right: rs(24),
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    backgroundColor: '#0c888d',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0c888d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(16) },
  modalTitle: { fontSize: rm(18), fontWeight: '700', color: '#1E293B' },
  closeBtn: { padding: rs(4) },
  modalScroll: { paddingBottom: rv(32) },
  label: { fontSize: rm(13), fontWeight: '600', color: '#475569', marginBottom: rv(6), marginTop: rv(12) },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.md, padding: rs(12), fontSize: rm(14), color: '#1E293B' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: rv(20), marginBottom: rv(24) },
  checkboxText: { fontSize: rm(14), color: '#334155', marginLeft: rs(8), fontWeight: '500' },
  saveBtn: { backgroundColor: '#0c888d', padding: rv(16), borderRadius: radius.lg, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: rm(16), fontWeight: '700' },
  locationFetchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6FFFA', paddingVertical: rv(12), borderRadius: radius.md, marginBottom: rv(16), borderWidth: 1, borderColor: '#B2EBE3' },
  locationFetchText: { color: '#0c888d', fontSize: rm(14), fontWeight: '600' }
});
