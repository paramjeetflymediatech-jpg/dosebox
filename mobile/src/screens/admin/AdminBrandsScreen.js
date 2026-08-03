import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Modal, TextInput, Alert, RefreshControl,
  ScrollView, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import Pagination from '../../components/admin/Pagination';
import { getFullImageUrl } from '../../utils/image';
import AdminListControls from '../../components/admin/AdminListControls';
import { AlertService } from '../../services/AlertService';

export default function AdminBrandsScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('date_desc');

  let filteredData = data.filter(item => {
    if (!item || typeof item !== 'object') return false;
    return Object.values(item).some(val => val !== null && val !== undefined && String(val).toLowerCase().includes(searchQuery.toLowerCase()));
  });

  if (sortOrder === 'date_desc') {
    filteredData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortOrder === 'date_asc') {
    filteredData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sortOrder === 'name_asc') {
    filteredData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (sortOrder === 'name_desc') {
    filteredData.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  }
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // Fields for Brand
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: ''
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (result.didCancel || !result.assets) return;
      
      const asset = result.assets[0];
      const form = new FormData();
      form.append('file', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'upload.jpg',
      });

      setUploadingImage(true);
      const res = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (res.data?.success) {
        setFormData(prev => ({ ...prev, logo: res.data.fileUrl }));
      } else {
        AlertService.show({ type: 'error', title: 'Error', message: res.data?.message || 'Failed to upload image' });
      }
    } catch (e) {
      console.log('Upload error:', e);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to upload image' });
    } finally {
      setUploadingImage(false);
    }
  };

  const loadData = async () => {
    try {
      const res = await api.get('/admin/brands');
      if (res.data?.success) {
        let items = res.data.data;
        setData(Array.isArray(items) ? items : []);
      }
    } catch (err) {
      console.log('Error loading Brands:', err);
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
    if (item) {
      setIsEditing(true);
      setCurrentId(item.id);
      setFormData({
        name: item.name || '',
        slug: item.slug || '',
        description: item.description || '',
        logo: item.logo || ''
      });
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setFormData({ name: '', slug: '', description: '', logo: '' });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      AlertService.show({ type: 'error', title: 'Error', message: 'Name and Slug are required' });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...formData };
      
      if (isEditing) {
        await api.put(`/admin/brands/${currentId}`, payload);
        AlertService.show({ type: 'success', title: 'Success', message: 'Brand updated successfully' });
      } else {
        await api.post('/admin/brands', payload);
        AlertService.show({ type: 'success', title: 'Success', message: 'Brand created successfully' });
      }
      setModalVisible(false);
      loadData();
    } catch (err) {
      console.log('Save error:', err);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to save Brand' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    AlertService.show({ type: 'warning', title: 'Confirm', message: 'Delete this brand?', buttons: [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/admin/brands/${id}`);
          loadData();
        } catch (err) {
          AlertService.show({ type: 'error', title: 'Error', message: 'Failed to delete' });
        }
      }}
    ]});
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { flexDirection: 'column', alignItems: 'stretch' }]}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
        {item.logo ? (
          <Image source={{ uri: getFullImageUrl(item.logo) }} style={styles.cardImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>{item.name?.[0]}</Text>
          </View>
        )}
        <View style={{flex: 1, paddingLeft: 12}}>
          <Text style={[styles.cardTitle, {marginBottom: 2}]}>{item.name}</Text>
          <Text style={[styles.cardSubtitle, {color: '#64748B', fontSize: 13}]}>/{item.slug}</Text>
        </View>
      </View>
      
      <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 12 }}>
        <Text style={{fontWeight: '700', color: '#0F172A', marginBottom: 4}}>Description:</Text>
        <Text style={[styles.cardDesc, { color: '#334155', marginTop: 0 }]} numberOfLines={3}>
          {item.description || 'No description provided.'}
        </Text>
      </View>

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rs(24)} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Brands</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
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
        filterOptions={[]}
        filterValue={''}
        onFilterChange={() => {}}
        sortOptions={[
          { id: 'date_desc', label: 'Newest First' },
          { id: 'date_asc', label: 'Oldest First' },
          { id: 'name_asc', label: 'Name (A-Z)' },
          { id: 'name_desc', label: 'Name (Z-A)' },
        ]}
        sortValue={sortOrder}
        onSortChange={(val) => { setSortOrder(val); setCurrentPage(1); }}
      />

        <FlatList
          data={paginatedData}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#086367']} />
          }
          ListFooterComponent={
            <Pagination 
              currentPage={currentPage}
              totalItems={filteredData.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No brands found</Text>}
        />
        </>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Brand' : 'Add Brand'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Name *</Text>
              <TextInput 
                style={styles.input} 
                value={formData.name} 
                onChangeText={(t) => setFormData({...formData, name: t, slug: t.toLowerCase().replace(/[^a-z0-9]+/g, '-')})} 
                placeholder="Brand Name" 
              />
              
              <Text style={styles.label}>Slug *</Text>
              <TextInput 
                style={styles.input} 
                value={formData.slug} 
                onChangeText={(t) => setFormData({...formData, slug: t})} 
                placeholder="brand-slug" 
                autoCapitalize="none"
              />
              
              <Text style={styles.label}>Description</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                value={formData.description} 
                onChangeText={(t) => setFormData({...formData, description: t})} 
                placeholder="Short description" 
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Logo URL (or Path) *</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput 
                  style={[styles.input, { flex: 1, marginBottom: 0 }]} 
                  value={formData.logo} 
                  onChangeText={(t) => setFormData({...formData, logo: t})} 
                  placeholder="https://example.com/logo.png or upload" 
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={{ marginLeft: spacing.sm, padding: rv(12), backgroundColor: '#1F5C52', borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' }}
                  onPress={handlePickImage}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="cloud-upload-outline" size={rm(20)} color="#fff" />}
                </TouchableOpacity>
              </View>
              <View style={{marginBottom: rv(12)}} />
              
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
              <View style={{height: 40}} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: rv(12), backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { padding: rv(8) },
  backIcon: { fontSize: rm(28), color: '#0F172A', lineHeight: rm(32) },
  headerTitle: { fontSize: rm(18), fontWeight: '700', color: '#0F172A' },
  addButton: { padding: rv(8), backgroundColor: '#E0F2FE', borderRadius: radius.full, width: rs(36), height: rs(36), alignItems: 'center', justifyContent: 'center' },
  addIcon: { color: '#0284C7', fontSize: rm(20), fontWeight: '700', lineHeight: rm(22) },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: spacing.md, paddingBottom: rv(80) },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: rv(40) },
  
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, marginBottom: rv(12), flexDirection: 'row', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: {width:0,height:2} },
  cardImage: { width: rs(60), height: rs(60), borderRadius: radius.md, backgroundColor: '#F1F5F9', marginRight: spacing.md },
  placeholderImage: { width: rs(60), height: rs(60), borderRadius: radius.md, backgroundColor: '#E2E8F0', marginRight: spacing.md, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: rm(24), fontWeight: '700', color: '#94A3B8' },
  cardContent: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: rm(16), fontWeight: '700', color: '#0F172A', marginBottom: rv(2) },
  cardSubtitle: { fontSize: rm(13), color: '#3B82F6', marginBottom: rv(4) },
  cardDesc: { fontSize: rm(12), color: '#64748B' },
  cardActions: { justifyContent: 'space-between', paddingLeft: spacing.sm },
  actionBtn: { paddingVertical: rv(6), paddingHorizontal: rs(10), backgroundColor: '#F1F5F9', borderRadius: radius.sm, marginBottom: rv(8), alignItems: 'center' },
  actionTextEdit: { color: '#0284C7', fontSize: rm(12), fontWeight: '600' },
  actionTextDelete: { color: '#EF4444', fontSize: rm(12), fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: rm(18), fontWeight: '700', color: '#0F172A' },
  closeIcon: { fontSize: rm(20), color: '#64748B', padding: rv(4) },
  modalBody: { padding: spacing.lg },
  label: { fontSize: rm(14), fontWeight: '600', color: '#334155', marginBottom: rv(6), marginTop: rv(12) },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: rv(12), fontSize: rm(15), color: '#0F172A' },
  textArea: { minHeight: rv(80), textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#1F5C52', paddingVertical: rv(16), borderRadius: radius.md, alignItems: 'center', marginTop: rv(24) },
  saveBtnText: { color: '#fff', fontSize: rm(16), fontWeight: '700' },
});
