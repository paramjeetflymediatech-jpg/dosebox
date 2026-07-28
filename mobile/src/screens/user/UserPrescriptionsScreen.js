import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Modal, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import { getFullImageUrl } from '../../utils/image';
import { AlertService } from '../../services/AlertService';

export default function UserPrescriptionsScreen({ navigation }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewImageUri, setViewImageUri] = useState(null);
  
  const { addToCart, setVerifiedCart } = useCart();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPrescriptions();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPrescriptions();
    setRefreshing(false);
  };

  const fetchPrescriptions = async () => {
    try {
      const res = await api.get('/prescriptions/customer');
      if (res.data?.success) {
        setPrescriptions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Prescription', 'Are you sure you want to delete this prescription?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const res = await api.delete(`/prescriptions/${id}`);
            if (res.data?.success) {
              setPrescriptions(prev => prev.filter(p => p.id !== id));
            } else {
              AlertService.show({ type: 'error', title: 'Error', message: res.data?.message || 'Failed to delete' });
            }
          } catch (err) {
            AlertService.show({ type: 'error', title: 'Error', message: 'Failed to delete prescription' });
          }
      }},
    ]);
  };

  const handleProceed = (draftCart, prescriptionId) => {
    if (!draftCart || !draftCart.items || draftCart.items.length === 0) return;
    
    const verifiedItems = draftCart.items.map(item => ({
      id: item.medicine.id,
      name: item.medicine.name,
      price: item.medicine.price,
      discountPrice: item.medicine.discountPrice || null,
      qty: item.quantity,
      image: item.medicine.images?.[0] || '',
      prescriptionRequired: item.medicine.requiresPrescription || true,
    }));

    if (verifiedItems.length > 0) {
      setVerifiedCart(verifiedItems, prescriptionId);
      AlertService.show({ type: 'success', title: 'Success', message: 'Verified prescription medicines loaded into cart' });
      navigation.navigate('CartCheckout');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const renderItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const hasDraftItems = item.draftCart && item.draftCart.items && item.draftCart.items.length > 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Prescription #{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status || 'Pending'}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
          })}
        </Text>
        
        {(!item.status || item.status.toLowerCase() === 'pending') && (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={18} color="#0284C7" />
            <Text style={styles.infoBannerText}>Your prescription is being reviewed by our pharmacist. We will notify you once medicines are added.</Text>
          </View>
        )}

        {item.status?.toLowerCase() === 'rejected' && (
          <View style={[styles.infoBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={[styles.infoBannerText, { color: '#B91C1C' }]}>This prescription was rejected. Please review the notes below or upload a clearer image.</Text>
          </View>
        )}

        {item.pharmacistNotes ? <Text style={styles.notesText} numberOfLines={2}>Notes: {item.pharmacistNotes}</Text> : null}
        
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setViewImageUri(getFullImageUrl(item.fileUrl))}>
            <Ionicons name="eye-outline" size={16} color="#0D1B2A" />
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>

        {hasDraftItems && (
          <View style={styles.draftItemsContainer}>
            <Text style={styles.draftItemsTitle}>Medicines Added by Pharmacist:</Text>
            {item.draftCart.items.map((cartItem, idx) => (
              <View key={idx} style={styles.draftItemRow}>
                <Text style={styles.draftItemName} numberOfLines={1}>• {cartItem.medicine?.name}</Text>
                <Text style={styles.draftItemQty}>Qty: {cartItem.quantity}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.proceedBtn} onPress={() => handleProceed(item.draftCart, item.id)}>
              <Text style={styles.proceedBtnText}>Proceed to Order</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{top:20, bottom:20, left:20, right:20}}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Prescriptions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('UploadPrescription')} style={styles.uploadNewBtn}>
          <Ionicons name="add" size={20} color="#1F5C52" />
          <Text style={styles.uploadNewText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1F5C52" />
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={prescriptions.length === 0 ? [styles.list, { flex: 1 }] : styles.list}
          ItemSeparatorComponent={() => <View style={{ height: rv(12) }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1F5C52']} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Prescriptions Found</Text>
              <Text style={styles.emptySub}>Upload a prescription to get started</Text>
              <TouchableOpacity 
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('UploadPrescription')}
              >
                <Text style={styles.primaryBtnText}>Upload Prescription</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Image View Modal */}
      <Modal visible={!!viewImageUri} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setViewImageUri(null)}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {viewImageUri && (
            <Image source={{ uri: viewImageUri }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
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
  backIcon: { fontSize: rm(24), color: '#0F172A', fontWeight: '400' },
  headerTitle: { flex: 1, fontSize: rm(20), fontWeight: '700', color: '#0F172A' },
  uploadNewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF4F2', paddingHorizontal: rs(12), paddingVertical: rv(6), borderRadius: radius.full },
  uploadNewText: { color: '#1F5C52', fontWeight: '600', marginLeft: rs(4), fontSize: rm(12) },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  list: { padding: spacing.md, paddingBottom: rv(100) },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(4) },
  cardTitle: { fontSize: rm(16), fontWeight: '600', color: '#1E293B' },
  statusBadge: { paddingHorizontal: rs(10), paddingVertical: rv(4), borderRadius: radius.full },
  statusText: { fontSize: rm(12), fontWeight: '700', textTransform: 'capitalize' },
  dateText: { fontSize: rm(13), color: '#64748B', marginBottom: rv(8) },
  notesText: { fontSize: rm(14), color: '#475569', marginTop: rv(8), backgroundColor: '#F1F5F9', padding: rs(10), borderRadius: radius.sm },
  
  infoBanner: { flexDirection: 'row', backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', borderWidth: 1, padding: 10, borderRadius: 8, marginTop: 12, alignItems: 'center' },
  infoBannerText: { fontSize: 13, color: '#0369A1', flex: 1, marginLeft: 8, lineHeight: 18 },

  actionsRow: { flexDirection: 'row', gap: rs(12), marginTop: rv(12), paddingTop: rv(12), borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(4), paddingVertical: rv(4) },
  actionText: { fontSize: 13, fontWeight: '600', color: '#0D1B2A', marginLeft: 6 },
  
  draftItemsContainer: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  draftItemsTitle: { fontSize: 13, fontWeight: '700', color: '#1F5C52', marginBottom: 8 },
  draftItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' },
  draftItemName: { fontSize: 13, color: '#334155', flex: 1, marginRight: 8, fontWeight: '500' },
  draftItemQty: { fontSize: 13, color: '#64748B', fontWeight: '600' },

  proceedBtn: { flexDirection: 'row', backgroundColor: '#1F5C52', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  proceedBtnText: { color: '#fff', fontWeight: '600', fontSize: rm(14) },
  emptyIcon: { fontSize: rm(48), marginBottom: rv(16) },
  emptyTitle: { fontSize: rm(18), fontWeight: '700', color: '#1E293B', marginBottom: rv(8) },
  emptySub: { fontSize: rm(14), color: '#64748B', textAlign: 'center', marginBottom: rv(24) },
  primaryBtn: { backgroundColor: '#1F5C52', paddingHorizontal: rs(24), paddingVertical: rv(14), borderRadius: radius.md },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: rm(15) },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: rv(40), right: rs(20), zIndex: 10, padding: rs(10) },
  fullImage: { width: '100%', height: '80%' },
});
