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
          <View style={{ flex: 1, marginRight: rs(8) }}>
            <Text style={styles.cardTitle}>Prescription #{item.id}</Text>
            <Text style={styles.dateText}>
              Uploaded {new Date(item.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
              })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status || 'Pending'}</Text>
          </View>
        </View>

        {(!item.status || item.status.toLowerCase() === 'pending') && (
          <View style={styles.infoBanner}>
            <Ionicons name="time-outline" size={18} color="#B45309" />
            <Text style={styles.infoBannerText}>Our pharmacist is verifying this. We will notify you once medicines are added.</Text>
          </View>
        )}

        {item.status?.toLowerCase() === 'rejected' && (
          <View style={[styles.infoBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
            <Text style={[styles.infoBannerText, { color: '#B91C1C' }]}>This prescription was rejected. Please review notes or upload again.</Text>
          </View>
        )}

        {item.pharmacistNotes ? (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Pharmacist Notes:</Text>
            <Text style={styles.notesText}>{item.pharmacistNotes}</Text>
          </View>
        ) : null}

        {hasDraftItems && (
          <View style={styles.draftItemsContainer}>
            <Text style={styles.draftItemsTitle}>Prescribed Medicines Matched:</Text>
            <View style={styles.draftItemsList}>
              {item.draftCart.items.map((cartItem, idx) => (
                <View key={idx} style={styles.draftItemRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: rs(8) }}>
                    <Ionicons name="checkmark-circle" size={16} color="#0D9488" style={{ marginRight: rs(6) }} />
                    <Text style={styles.draftItemName} numberOfLines={1}>{cartItem.medicine?.name}</Text>
                  </View>
                  <Text style={styles.draftItemQty}>Qty: {cartItem.quantity}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.proceedBtn} onPress={() => handleProceed(item.draftCart, item.id)} activeOpacity={0.8}>
              <Text style={styles.proceedBtnText}>Add to Cart & Checkout</Text>
              <Ionicons name="cart-outline" size={18} color="#fff" style={{ marginLeft: rs(6) }} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.viewBtn} onPress={() => setViewImageUri(getFullImageUrl(item.fileUrl))} activeOpacity={0.7}>
            <Ionicons name="image-outline" size={16} color="#475569" />
            <Text style={styles.viewBtnText}>View Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{top:16, bottom:16, left:16, right:16}}>
          <Ionicons name="arrow-back" size={rs(24)} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Prescriptions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('UploadPrescription')} style={styles.uploadNewBtn} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color="#1F5C52" />
          <Text style={styles.uploadNewText}>Upload New</Text>
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
      <Modal visible={!!viewImageUri} transparent={true} animationType="fade" onRequestClose={() => setViewImageUri(null)}>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: rv(12),
    backgroundColor: '#F8FAFC',
  },
  backBtn: { 
    width: rs(40), 
    height: rs(40), 
    borderRadius: 999, 
    backgroundColor: '#FFFFFF', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: rs(12), 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2 
  },
  headerTitle: { 
    flex: 1, 
    fontSize: rm(22), 
    fontWeight: '800', 
    color: '#0F172A', 
    letterSpacing: -0.5 
  },
  uploadNewBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#EAF4F2', 
    paddingHorizontal: rs(12), 
    paddingVertical: rv(8), 
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(31, 92, 82, 0.15)'
  },
  uploadNewText: { color: '#1F5C52', fontWeight: '700', marginLeft: rs(2), fontSize: rm(12) },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  list: { padding: spacing.md, paddingBottom: rv(100) },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: rv(16),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: rv(12) },
  cardTitle: { fontSize: rm(15), fontWeight: '700', color: '#0F172A', marginBottom: rv(2) },
  dateText: { fontSize: rm(12), color: '#64748B' },
  statusBadge: { paddingHorizontal: rs(10), paddingVertical: rv(4), borderRadius: radius.full },
  statusText: { fontSize: rm(11), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  infoBanner: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFBEB', 
    borderColor: '#FDE68A', 
    borderWidth: 1, 
    padding: spacing.md, 
    borderRadius: radius.lg, 
    marginVertical: rv(10), 
    alignItems: 'flex-start' 
  },
  infoBannerText: { fontSize: rm(12), color: '#B45309', flex: 1, marginLeft: rs(8), lineHeight: rv(18), fontWeight: '500' },
  
  notesContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: rv(12),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  notesLabel: {
    fontSize: rm(12),
    fontWeight: '700',
    color: '#475569',
    marginBottom: rv(4),
  },
  notesText: {
    fontSize: rm(13),
    color: '#64748B',
    lineHeight: rv(18),
  },
  
  draftItemsContainer: { 
    backgroundColor: '#F0FDFA', 
    padding: spacing.md, 
    borderRadius: radius.lg, 
    marginTop: rv(16), 
    borderWidth: 1, 
    borderColor: '#CCFBF1' 
  },
  draftItemsTitle: { fontSize: rm(13), fontWeight: '800', color: '#115E59', marginBottom: rv(10) },
  draftItemsList: {
    marginBottom: rv(6),
  },
  draftItemRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: rv(8), 
    alignItems: 'center' 
  },
  draftItemName: { fontSize: rm(13), color: '#115E59', flex: 1, marginRight: rs(8), fontWeight: '600' },
  draftItemQty: { fontSize: rm(12), color: '#0D9488', fontWeight: '700' },
  
  proceedBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#0D9488', 
    paddingVertical: rv(12), 
    borderRadius: radius.lg, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: rv(10),
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  proceedBtnText: { color: '#fff', fontWeight: '700', fontSize: rm(14) },
  
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: rv(14), 
    paddingTop: rv(12), 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9' 
  },
  viewBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: rs(4), 
    paddingVertical: rv(6),
    paddingHorizontal: rs(10),
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewBtnText: { fontSize: rm(12), fontWeight: '600', color: '#475569' },
  
  deleteBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: rs(4), 
    paddingVertical: rv(6),
    paddingHorizontal: rs(10),
    borderRadius: radius.md,
    backgroundColor: '#FEF2F2',
  },
  deleteBtnText: { fontSize: rm(12), fontWeight: '600', color: '#EF4444' },

  emptyIcon: { fontSize: rm(54), marginBottom: rv(16) },
  emptyTitle: { fontSize: rm(18), fontWeight: '700', color: '#0F172A', marginBottom: rv(8) },
  emptySub: { fontSize: rm(14), color: '#64748B', textAlign: 'center', marginBottom: rv(24), lineHeight: rv(20) },
  primaryBtn: { 
    backgroundColor: '#1F5C52', 
    paddingHorizontal: rs(24), 
    paddingVertical: rv(14), 
    borderRadius: radius.lg,
    shadowColor: '#1F5C52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: rm(15) },
  modalBg: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.95)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: rv(40), right: rs(20), zIndex: 10, padding: rs(10) },
  fullImage: { width: '90%', height: '80%' },
});
