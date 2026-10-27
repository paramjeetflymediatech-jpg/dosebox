import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Modal, TextInput, Alert, RefreshControl, ScrollView, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import Pagination from '../../components/admin/Pagination';
import AdminListControls from '../../components/admin/AdminListControls';
import { AlertService } from '../../services/AlertService';
import { getFullImageUrl } from '../../utils/image';
import { calculatePapBenefit } from '../../utils/papHelper';

export default function AdminOrdersScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('date_desc');
  const [showSortModal, setShowSortModal] = useState(false);

  let filteredData = data.filter(item => {
    if (!item || typeof item !== 'object') return false;
    const matchesSearch = Object.values(item).some(val => val !== null && val !== undefined && String(val).toLowerCase().includes(searchQuery.toLowerCase()));
    let matchesStatus = true;
    if (statusFilter === 'PAP') {
      matchesStatus = (item.items || []).some(prod => calculatePapBenefit(prod.quantity, prod.medicine?.papOffer).freeUnits > 0);
    } else if (statusFilter !== 'All') {
      matchesStatus = item.status === statusFilter;
    }
    return matchesSearch && matchesStatus;
  });

  if (sortOrder === 'date_desc') {
    filteredData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortOrder === 'date_asc') {
    filteredData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sortOrder === 'amount_desc') {
    filteredData.sort((a, b) => (b.finalAmount || b.totalAmount || 0) - (a.finalAmount || a.totalAmount || 0));
  } else if (sortOrder === 'amount_asc') {
    filteredData.sort((a, b) => (a.finalAmount || a.totalAmount || 0) - (b.finalAmount || b.totalAmount || 0));
  }
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [previewRx, setPreviewRx] = useState(null);

  const loadData = async () => {
    try {
      const res = await api.get('/orders');
      if (res.data?.success) {
        let items = res.data.data;
        if (!items) {
          const keys = Object.keys(res.data);
          const arrayKey = keys.find(k => Array.isArray(res.data[k]));
          if (arrayKey) items = res.data[arrayKey];
        }
        setData(Array.isArray(items) ? items : []);
      }
    } catch (err) {
      console.log('Error loading Orders:', err);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to load Orders' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenModal = (item = null) => {
    setIsEditing(!!item);
    setCurrentId(item ? item.id : null);
    setFormData({
      status: item ? (item.status !== undefined ? String(item.status) : '') : '',
      paymentStatus: item ? (item.paymentStatus !== undefined ? String(item.paymentStatus) : '') : '',
      trackingNumber: item ? (item.trackingNumber !== undefined ? String(item.trackingNumber) : '') : '',
      prescription: item ? item.prescription : null,
      user: item ? item.user : null,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEditing && currentId) {
        await api.put('/orders/' + currentId, formData);
      } else {
        await api.post('/orders', formData);
      }
      setModalVisible(false);
      loadData();
    } catch (err) {
      console.log('Failed to save Orders:', err);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to save Orders' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    AlertService.show({ type: 'warning', title: 'Delete', message: 'Are you sure you want to delete this item?', buttons: [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete('/orders/' + id);
            setData(data.filter(item => item.id !== id));
          } catch (err) {
            AlertService.show({ type: 'error', title: 'Error', message: 'Failed to delete item' });
          }
        } 
      }
    ]});
  };

  const renderItem = ({ item }) => {
    const formattedDate = new Date(item.createdAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const totalFreeUnits = (item.items || []).reduce((acc, prod) => {
      const b = calculatePapBenefit(prod.quantity, prod.medicine?.papOffer);
      return acc + (b.freeUnits || 0);
    }, 0);

    return (
      <View style={[styles.card, { flexDirection: 'column', alignItems: 'stretch' }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={[styles.cardTitle, {marginBottom: 0}]}>{"Order #" + item.id}</Text>
            {totalFreeUnits > 0 && (
              <View style={styles.adminPapBadge}>
                <Ionicons name="gift" size={rs(10)} color="#7E22CE" />
                <Text style={styles.adminPapBadgeText}>+{totalFreeUnits} Free PAP</Text>
              </View>
            )}
          </View>
          <View style={{backgroundColor: item.status === 'Delivered' ? '#DCFCE7' : '#FEF9C3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12}}>
            <Text style={{fontSize: 12, color: item.status === 'Delivered' ? '#166534' : '#854D0E', fontWeight: '700'}}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <Text style={[styles.cardSubtitle, { color: '#334155' }]}>
            <Text style={{fontWeight: '700', color: '#0F172A'}}>Customer:</Text> {item.user?.name || 'Guest'}
          </Text>
          <Text style={[styles.cardSubtitle, { marginTop: 4, color: '#334155' }]}>
            <Text style={{fontWeight: '700', color: '#0F172A'}}>Date:</Text> {formattedDate}
          </Text>
          <Text style={[styles.cardSubtitle, { marginTop: 4, color: '#334155' }]}>
            <Text style={{fontWeight: '700', color: '#0F172A'}}>Payment:</Text> {item.paymentMethod || 'N/A'} ({item.paymentStatus || 'Unpaid'})
          </Text>
          <Text style={[styles.cardSubtitle, { marginTop: 6, color: '#0284C7', fontWeight: '700', fontSize: 16 }]}>
            {"Total: ₹" + (item.finalAmount || item.totalAmount || 0)}
          </Text>
        </View>

        {/* Packaging instruction alert card for admin packaging team */}
        {totalFreeUnits > 0 && (
          <View style={styles.adminPapAlertBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="gift" size={rs(15)} color="#7E22CE" />
              <Text style={styles.adminPapAlertTitle}>PACKAGING INSTRUCTION: PAP BONUS</Text>
            </View>
            <Text style={styles.adminPapAlertDesc}>Pack +{totalFreeUnits} extra complimentary unit(s) under PAP:</Text>
            {item.items?.map((prod) => {
              const b = calculatePapBenefit(prod.quantity, prod.medicine?.papOffer);
              if (!b.freeUnits) return null;
              return (
                <View key={prod.id} style={styles.adminPapItemLine}>
                  <Text style={styles.adminPapItemName} numberOfLines={1}>{prod.medicine?.name || 'Item'}</Text>
                  <Text style={styles.adminPapItemBreakdown}>
                    Billed: {prod.quantity} + <Text style={{color: '#7E22CE', fontWeight: 'bold'}}>PAP Free: +{b.freeUnits}</Text> = <Text style={{color: '#166534', fontWeight: 'bold'}}>Total: {prod.quantity + b.freeUnits} to Pack</Text>
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Prescription Status / Thumbnail Card */}
        {item.prescription ? (
          <View style={styles.rxCard}>
            <View style={styles.rxHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Ionicons name="document-text" size={rs(16)} color="#1F5C52" />
                <Text style={styles.rxTitle}>Prescription #{item.prescription.id}</Text>
              </View>
              <View style={[
                styles.rxStatusBadge, 
                { backgroundColor: item.prescription.status === 'Approved' ? '#DCFCE7' : item.prescription.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7' }
              ]}>
                <Text style={[
                  styles.rxStatusText, 
                  { color: item.prescription.status === 'Approved' ? '#166534' : item.prescription.status === 'Rejected' ? '#DC2626' : '#B45309' }
                ]}>
                  {item.prescription.status || 'Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.rxBody}>
              {(() => {
                const rxUrl = getFullImageUrl(item.prescription.fileUrl);
                return (
                  <>
                    {rxUrl ? (
                      <TouchableOpacity 
                        style={styles.rxThumbWrap} 
                        activeOpacity={0.8}
                        onPress={() => setPreviewRx({ id: item.prescription.id, url: rxUrl, userName: item.user?.name, status: item.prescription.status })}
                      >
                        <Image source={{ uri: rxUrl }} style={styles.rxThumb} resizeMode="cover" />
                        <View style={styles.rxThumbOverlay}>
                          <Ionicons name="expand" size={rs(12)} color="#FFF" />
                        </View>
                      </TouchableOpacity>
                    ) : null}

                    <View style={{ flex: 1, justifyContent: 'center' }}>
                      <Text style={styles.rxInfoText}>Doctor Rx uploaded by user</Text>
                      <TouchableOpacity 
                        style={styles.rxViewBtn}
                        onPress={() => setPreviewRx({ id: item.prescription.id, url: rxUrl, userName: item.user?.name, status: item.prescription.status })}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="eye-outline" size={rs(13)} color="#1F5C52" />
                        <Text style={styles.rxViewBtnText}>View Prescription</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                );
              })()}
            </View>
          </View>
        ) : (
          <View style={styles.otcBadge}>
            <Ionicons name="shield-checkmark-outline" size={rs(14)} color="#64748B" />
            <Text style={styles.otcBadgeText}>OTC Order (No prescription required)</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#E0F2FE'}]} onPress={() => handleOpenModal(item)}>
            <Ionicons name="pencil-outline" size={rm(18)} color="#0284C7" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#FEE2E2'}]} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={rm(18)} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Ionicons name="arrow-back" size={rs(24)} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={{ width: rm(24) }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1F5C52" />
        </View>
      ) : (
        <>
          <AdminListControls
            searchQuery={searchQuery}
            onSearchChange={(text) => { setSearchQuery(text); setCurrentPage(1); }}
            filterOptions={[
              { id: 'All', label: 'All Statuses' },
              { id: 'PAP', label: '🎁 PAP Orders' },
              { id: 'Pending', label: 'Pending' },
              { id: 'Confirmed', label: 'Confirmed' },
              { id: 'Shipped', label: 'Shipped' },
              { id: 'Out For Delivery', label: 'Out For Delivery' },
              { id: 'Delivered', label: 'Delivered' },
              { id: 'Cancelled', label: 'Cancelled' },
            ]}
            filterValue={statusFilter}
            onFilterChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
            sortOptions={[
              { id: 'date_desc', label: 'Newest First' },
              { id: 'date_asc', label: 'Oldest First' },
              { id: 'amount_desc', label: 'Amount (High to Low)' },
              { id: 'amount_asc', label: 'Amount (Low to High)' },
            ]}
            sortValue={sortOrder}
            onSortChange={(val) => { setSortOrder(val); setCurrentPage(1); }}
          />

          <FlatList
          data={paginatedData}
            keyExtractor={item => item.id ? item.id.toString() : Math.random().toString()}
            contentContainerStyle={styles.listContent}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No orders found.</Text>
              </View>
            }
          ListFooterComponent={
            <Pagination 
              currentPage={currentPage}
              totalItems={typeof filteredData !== 'undefined' ? filteredData.length : data.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          }
          />
        </>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => handleOpenModal()} activeOpacity={0.8}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit' : 'Add'} Orders</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              {formData.prescription ? (
                <View style={styles.modalRxBox}>
                  <Text style={styles.fieldLabel}>Uploaded Prescription (Rx)</Text>
                  <View style={styles.modalRxInner}>
                    {(() => {
                      const rxUrl = getFullImageUrl(formData.prescription.fileUrl);
                      return (
                        <>
                          {rxUrl ? (
                            <TouchableOpacity 
                              style={styles.modalRxThumbWrap}
                              activeOpacity={0.8}
                              onPress={() => setPreviewRx({ id: formData.prescription.id, url: rxUrl, userName: formData.user?.name, status: formData.prescription.status })}
                            >
                              <Image source={{ uri: rxUrl }} style={styles.modalRxThumb} resizeMode="cover" />
                              <View style={styles.modalRxOverlay}>
                                <Ionicons name="expand" size={rs(14)} color="#FFF" />
                              </View>
                            </TouchableOpacity>
                          ) : null}
                          <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Text style={styles.modalRxTitle}>Rx #{formData.prescription.id}</Text>
                            <Text style={styles.modalRxSub}>Status: {formData.prescription.status || 'Pending'}</Text>
                            <TouchableOpacity 
                              style={styles.modalRxBtn}
                              onPress={() => setPreviewRx({ id: formData.prescription.id, url: rxUrl, userName: formData.user?.name, status: formData.prescription.status })}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="eye-outline" size={rs(13)} color="#1F5C52" />
                              <Text style={styles.modalRxBtnText}>View Full Prescription</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      );
                    })()}
                  </View>
                </View>
              ) : null}

              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>Order Status *</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {['Pending', 'Confirmed', 'Prescription Review', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled'].map(s => (
                    <TouchableOpacity 
                      key={s}
                      style={[styles.statusPill, formData.status === s ? styles.statusPillActive : null]}
                      onPress={() => setFormData({...formData, status: s})}
                    >
                      <Text style={[styles.statusPillText, formData.status === s ? styles.statusPillTextActive : null]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>Payment Status *</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {['Unpaid', 'Paid', 'Failed'].map(s => (
                    <TouchableOpacity 
                      key={s}
                      style={[styles.statusPill, formData.paymentStatus === s ? styles.statusPillActive : null]}
                      onPress={() => setFormData({...formData, paymentStatus: s})}
                    >
                      <Text style={[styles.statusPillText, formData.paymentStatus === s ? styles.statusPillTextActive : null]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>Tracking Number</Text>
                <TextInput
                  style={[styles.input, null]}
                  value={String(formData.trackingNumber || '')}
                  onChangeText={txt => setFormData({...formData, trackingNumber: txt})}
                  placeholder="Enter tracking number"
                  placeholderTextColor="#94A3B8"
                  multiline={false}
                  numberOfLines={1}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full-Screen Doctor's Prescription Lightbox Modal */}
      <Modal visible={!!previewRx} transparent animationType="fade" onRequestClose={() => setPreviewRx(null)}>
        <View style={styles.imageModalOverlay}>
          <SafeAreaView style={styles.imageModalContainer}>
            <View style={styles.imageModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.imageModalTitle}>Doctor's Prescription</Text>
                <Text style={styles.imageModalSub}>
                  Rx #{previewRx?.id} • {previewRx?.userName || 'Customer'} ({previewRx?.status || 'Pending'})
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.imageModalClose}
                onPress={() => setPreviewRx(null)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Ionicons name="close" size={rs(24)} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.imageModalBody}>
              {previewRx?.url ? (
                <Image 
                  source={{ uri: previewRx.url }} 
                  style={styles.fullPrescriptionImage} 
                  resizeMode="contain" 
                />
              ) : (
                <Text style={{ color: '#94A3B8', fontSize: rm(15) }}>No image preview available</Text>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
    marginHorizontal: spacing.md, marginTop: rv(16), marginBottom: rv(12), paddingHorizontal: spacing.md,
    height: rv(48), borderRadius: radius.full, borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  searchInput: { flex: 1, marginLeft: rs(8), fontSize: rm(15), color: '#0F172A', fontWeight: '500' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: spacing.md, paddingTop: rv(12), paddingBottom: rv(14),
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backButton: { padding: rv(4) },
  backIcon: { fontSize: rm(24), color: '#0F172A', fontWeight: '300' },
  headerTitle: { fontSize: rm(20), fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.md, paddingBottom: rv(100) },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    borderRadius: radius.md, padding: spacing.md, marginBottom: rv(12),
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1
  },
  cardBody: { flex: 1, paddingRight: rv(12) },
  cardTitle: { fontSize: rm(16), fontWeight: '700', color: '#0F172A', marginBottom: rv(4) },
  cardSubtitle: { fontSize: rm(14), color: '#64748B', lineHeight: rv(20) },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: rv(8) },
  actionBtn: { padding: rv(8), backgroundColor: '#F1F5F9', borderRadius: radius.sm },
  actionTextEdit: { fontSize: rm(16) },
  actionTextDelete: { fontSize: rm(16) },
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: rv(60) },
  emptyIcon: { fontSize: rm(48), marginBottom: rv(12) },
  emptyText: { fontSize: rm(16), color: '#64748B', fontWeight: '500' },
  fab: {
    position: 'absolute', bottom: rv(24), right: rv(24),
    width: rv(56), height: rv(56), borderRadius: rv(28), backgroundColor: '#1F5C52',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1F5C52', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6
  },
  fabIcon: { color: '#fff', fontSize: rm(32), fontWeight: '300', marginTop: -rv(4) },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: rm(18), fontWeight: '700', color: '#0F172A' },
  closeIcon: { fontSize: rm(20), color: '#64748B' },
  formScroll: { padding: spacing.lg },
  fieldBox: { marginBottom: rv(16) },
  fieldLabel: { fontSize: rm(13), fontWeight: '600', color: '#475569', textTransform: 'uppercase', marginBottom: rv(8) },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.md, paddingHorizontal: rv(16), paddingVertical: rv(14), fontSize: rm(15), color: '#0F172A' },
  textArea: { height: rv(100), textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', padding: spacing.lg, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: rv(12) },
  cancelBtn: { flex: 1, paddingVertical: rv(16), backgroundColor: '#F1F5F9', borderRadius: radius.md, alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontWeight: '600', fontSize: rm(15) },
  saveBtn: { flex: 1, paddingVertical: rv(16), backgroundColor: '#1F5C52', borderRadius: radius.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: rm(15) },
  statusPill: { paddingHorizontal: rs(16), paddingVertical: rv(8), borderRadius: radius.full, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  statusPillActive: { backgroundColor: '#EAF4F2', borderColor: '#1F5C52' },
  statusPillText: { fontSize: rm(13), color: '#64748B', fontWeight: '600' },
  statusPillTextActive: { color: '#1F5C52', fontWeight: '700' },

  // Rx Card Styles
  rxCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: 12,
  },
  rxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rxTitle: {
    fontSize: rm(13),
    fontWeight: '700',
    color: '#166534',
  },
  rxStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  rxStatusText: {
    fontSize: rm(11),
    fontWeight: '700',
  },
  rxBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
  },
  rxThumbWrap: {
    width: rs(50),
    height: rs(64),
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  rxThumb: {
    width: '100%',
    height: '100%',
  },
  rxThumbOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    padding: 2,
  },
  rxInfoText: {
    fontSize: rm(12),
    color: '#475569',
    marginBottom: 6,
  },
  rxViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  rxViewBtnText: {
    fontSize: rm(12),
    fontWeight: '700',
    color: '#166534',
  },

  // OTC Badge
  otcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    marginBottom: 12,
  },
  otcBadgeText: {
    fontSize: rm(12),
    color: '#64748B',
    fontWeight: '500',
  },

  // Modal Rx Box
  modalRxBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: rv(16),
  },
  modalRxInner: {
    flexDirection: 'row',
    gap: rs(12),
    alignItems: 'center',
    marginTop: 6,
  },
  modalRxThumbWrap: {
    width: rs(64),
    height: rs(80),
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    position: 'relative',
  },
  modalRxThumb: {
    width: '100%',
    height: '100%',
  },
  modalRxOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 3,
  },
  modalRxTitle: {
    fontSize: rm(14),
    fontWeight: '700',
    color: '#0F172A',
  },
  modalRxSub: {
    fontSize: rm(12),
    color: '#64748B',
    marginTop: 2,
    marginBottom: 6,
  },
  modalRxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  modalRxBtnText: {
    fontSize: rm(12),
    fontWeight: '700',
    color: '#166534',
  },

  // Full-screen Image Modal Lightbox
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  imageModalContainer: {
    flex: 1,
  },
  imageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: rv(12),
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  imageModalTitle: {
    fontSize: rm(17),
    fontWeight: '700',
    color: '#FFF',
  },
  imageModalSub: {
    fontSize: rm(13),
    color: '#94A3B8',
    marginTop: 2,
  },
  imageModalClose: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 20,
  },
  imageModalBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  fullPrescriptionImage: {
    width: '100%',
    height: '100%',
  },
  adminPapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: rs(6),
    paddingVertical: rv(2),
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#D8B4FE',
  },
  adminPapBadgeText: {
    fontSize: rm(10),
    fontWeight: '800',
    color: '#7E22CE',
  },
  adminPapAlertBox: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#D8B4FE',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: 12,
  },
  adminPapAlertTitle: {
    fontSize: rm(11),
    fontWeight: '800',
    color: '#6B21A8',
    letterSpacing: 0.5,
  },
  adminPapAlertDesc: {
    fontSize: rm(11),
    color: '#7E22CE',
    fontWeight: '600',
    marginBottom: 6,
  },
  adminPapItemLine: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xs,
    paddingHorizontal: rs(8),
    paddingVertical: rv(4),
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: '#E9D5FF',
  },
  adminPapItemName: {
    fontSize: rm(12),
    fontWeight: '700',
    color: '#1E1B4B',
  },
  adminPapItemBreakdown: {
    fontSize: rm(11),
    color: '#475569',
    marginTop: 2,
  },
});
