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
import { AlertService } from '../../services/AlertService';

export default function AdminCategoriesScreen({ navigation }) {
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
  
  // Fields for Category
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    sortOrder: '0'
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
        setFormData(prev => ({ ...prev, image: res.data.fileUrl }));
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
      const res = await api.get('/admin/categories');
      if (res.data?.success) {
        let items = res.data.data;
        setData(Array.isArray(items) ? items : []);
      }
    } catch (err) {
      console.log('Error loading Categories:', err);
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
        image: item.image || ''
      });
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setFormData({ name: '', slug: '', description: '', image: '' });
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
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name || '');
      formDataToSend.append('slug', formData.slug || '');
      formDataToSend.append('description', formData.description || '');
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };

      if (isEditing) {
        await api.put(`/admin/categories/${currentId}`, formDataToSend, config);
        AlertService.show({ type: 'success', title: 'Success', message: 'Category updated successfully' });
      } else {
        await api.post('/admin/categories', formDataToSend, config);
        AlertService.show({ type: 'success', title: 'Success', message: 'Category created successfully' });
      }
      setModalVisible(false);
      loadData();
    } catch (err) {
      console.log('Save error:', err);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to save Category' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    AlertService.show({ type: 'warning', title: 'Confirm', message: 'Delete this category?', buttons: [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/admin/categories/${id}`);
          loadData();
        } catch (err) {
          AlertService.show({ type: 'error', title: 'Error', message: 'Failed to delete' });
        }
      }}
    ]});
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.image ? (
        <Image source={{ uri: getFullImageUrl(item.image) }} style={styles.cardImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>{item.name?.[0]}</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>/{item.slug}</Text>
        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenModal(item)}>
          <Text style={styles.actionTextEdit}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
          <Text style={styles.actionTextDelete}>Del</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
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
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1F5C52" />}
          ListEmptyComponent={<Text style={styles.emptyText}>No categories found</Text>}
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

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Category' : 'Add Category'}</Text>
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
                placeholder="Category Name" 
              />
              
              <Text style={styles.label}>Slug *</Text>
              <TextInput 
                style={styles.input} 
                value={formData.slug} 
                onChangeText={(t) => setFormData({...formData, slug: t})} 
                placeholder="category-slug" 
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

              <Text style={styles.label}>Image URL (or Path) *</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput 
                  style={[styles.input, { flex: 1, marginBottom: 0 }]} 
                  value={formData.image} 
                  onChangeText={(t) => setFormData({...formData, image: t})} 
                  placeholder="https://example.com/image.png or upload" 
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
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
    marginHorizontal: spacing.md, marginTop: rv(16), marginBottom: rv(12), paddingHorizontal: spacing.md,
    height: rv(48), borderRadius: radius.full, borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  searchInput: { flex: 1, marginLeft: rs(8), fontSize: rm(15), color: '#0F172A', fontWeight: '500' },
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
