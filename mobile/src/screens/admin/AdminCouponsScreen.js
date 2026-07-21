import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Modal, TextInput, Alert, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import Pagination from '../../components/admin/Pagination';
import { AlertService } from '../../services/AlertService';

export default function AdminCouponsScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredData = data.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(searchQuery.toLowerCase())));
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

  const loadData = async () => {
    try {
      const res = await api.get('/admin/coupons');
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
      console.log('Error loading Coupons:', err);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to load Coupons' });
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
      code: item ? (item.code !== undefined ? String(item.code) : '') : '',
      discountValue: item ? (item.discountValue !== undefined ? String(item.discountValue) : '') : '',
      description: item ? (item.description !== undefined ? String(item.description) : '') : '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEditing && currentId) {
        await api.put('/admin/coupons/' + currentId, formData);
      } else {
        await api.post('/admin/coupons', formData);
      }
      setModalVisible(false);
      loadData();
    } catch (err) {
      console.log('Failed to save Coupons:', err);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to save Coupons' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    AlertService.show({ type: 'warning', title: 'Delete', message: 'Are you sure you want to delete this item?', buttons: [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete('/admin/coupons/' + id);
            setData(data.filter(item => item.id !== id));
          } catch (err) {
            AlertService.show({ type: 'error', title: 'Error', message: 'Failed to delete item' });
          }
        } 
      }
    ]});
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.code || 'Untitled'}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={2}>
          {item.description || "Discount: " + item.discountValue || 'No description available'}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenModal(item)}>
          <Ionicons name="pencil-outline" size={rm(18)} color="#0284C7" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={rm(18)} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coupons</Text>
        <View style={{ width: rm(24) }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1F5C52" />
        </View>
      ) : (
        <>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={rs(20)} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setCurrentPage(1);
          }}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={rs(20)} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
          data={paginatedData}
          keyExtractor={item => item.id ? item.id.toString() : Math.random().toString()}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No coupons found.</Text>
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
              <Text style={styles.modalTitle}>{isEditing ? 'Edit' : 'Add'} Coupons</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={[{}]} 
              keyExtractor={() => 'form'}
              contentContainerStyle={styles.formScroll}
              renderItem={() => (
                <View>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>Coupon Code *</Text>
                <TextInput
                  style={[styles.input, null]}
                  value={String(formData.code || '')}
                  onChangeText={txt => setFormData({...formData, code: txt})}
                  placeholder="Enter coupon code"
                  placeholderTextColor="#94A3B8"
                  multiline={false}
                  numberOfLines={1}
                />
              </View>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>Discount Value *</Text>
                <TextInput
                  style={[styles.input, null]}
                  value={String(formData.discountValue || '')}
                  onChangeText={txt => setFormData({...formData, discountValue: txt})}
                  placeholder="Enter discount value"
                  placeholderTextColor="#94A3B8"
                  multiline={false}
                  numberOfLines={1}
                />
              </View>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={String(formData.description || '')}
                  onChangeText={txt => setFormData({...formData, description: txt})}
                  placeholder="Enter description"
                  placeholderTextColor="#94A3B8"
                  multiline={true}
                  numberOfLines={4}
                />
              </View>
                </View>
              )}
            />

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
});
