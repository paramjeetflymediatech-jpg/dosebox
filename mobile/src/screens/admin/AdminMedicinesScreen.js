import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useState, useEffect, useRef } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Modal, TextInput, Alert, RefreshControl,
  ScrollView, Switch, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import Pagination from '../../components/admin/Pagination';

export default function AdminMedicinesScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredData = data.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(searchQuery.toLowerCase())));
  const [currentPage, setCurrentPage] = useState(1);
  const flatListRef = useRef(null);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };
  const itemsPerPage = 10;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Selector modals
  const [showCatSelector, setShowCatSelector] = useState(false);
  const [showBrandSelector, setShowBrandSelector] = useState(false);

  const loadData = async () => {
    try {
      // Load Medicines with a high limit to get all for admin
      const res = await api.get('/medicines?limit=1000');
      if (res.data?.success) {
        let items = res.data.data;
        setData(Array.isArray(items) ? items : []);
      }
      
      // Load Dropdown data silently
      const catRes = await api.get('/admin/categories');
      if (catRes.data?.data) setCategories(catRes.data.data);
      
      const brandRes = await api.get('/admin/brands');
      if (brandRes.data?.data) setBrands(brandRes.data.data);

    } catch (err) {
      console.log('Error loading Medicines:', err);
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

  const getEmptyForm = () => ({
    name: '', genericName: '', brandId: '', manufacturer: '',
    composition: '', dosage: '', packSize: '', description: '',
    sideEffects: '', storageInstructions: '', papOffer: '',
    prescriptionRequired: false, price: '0', discountPrice: '0',
    stock: '0', categoryId: '', supplierId: '', images: '',
    sections: []
  });

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
        setFormData(prev => ({ ...prev, images: res.data.fileUrl }));
      } else {
        setTimeout(() => Alert.alert('Error', res.data?.message || 'Failed to upload image'), 100);
      }
    } catch (e) {
      console.log('Upload error:', e);
      setTimeout(() => Alert.alert('Error', 'Failed to upload image'), 100);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenModal = async (item = null) => {
    if (item) {
      setIsEditing(true);
      setCurrentId(item.id);
      setFormData({
        name: item.name || '',
        genericName: item.genericName || '',
        brandId: item.brandId ? item.brandId.toString() : '',
        manufacturer: item.manufacturer || '',
        composition: item.composition || '',
        dosage: item.dosage || '',
        packSize: item.packSize || '',
        description: item.description || '',
        sideEffects: item.sideEffects || '',
        storageInstructions: item.storageInstructions || '',
        papOffer: item.papOffer || '',
        prescriptionRequired: !!item.prescriptionRequired,
        price: item.price ? item.price.toString() : '0',
        discountPrice: item.discountPrice ? item.discountPrice.toString() : '0',
        stock: item.stock ? item.stock.toString() : '0',
        categoryId: item.categoryId ? item.categoryId.toString() : '',
        supplierId: item.supplierId ? item.supplierId.toString() : '',
        images: item.images || '',
        sections: item.sections || []
      });
      setModalVisible(true);

      try {
        const res = await api.get(`/medicines/${item.id}`);
        if (res.data?.success && res.data?.data) {
           const fullData = res.data.data;
           setFormData(prev => ({
             ...prev,
             sections: fullData.sections || []
           }));
        }
      } catch (err) {
        console.log('Error fetching detailed medicine data:', err);
      }
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setFormData(getEmptyForm());
      setModalVisible(true);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.genericName || !formData.categoryId || !formData.brandId || !formData.price) {
      setTimeout(() => Alert.alert('Error', 'Please fill all required fields (*)'), 100);
      return;
    }
    setSaving(true);
    try {
      const payload = { ...formData };
      payload.price = parseFloat(payload.price) || 0;
      payload.discountPrice = parseFloat(payload.discountPrice) || 0;
      payload.stock = parseInt(payload.stock) || 0;
      payload.categoryId = parseInt(payload.categoryId) || null;
      payload.brandId = parseInt(payload.brandId) || null;
      payload.supplierId = parseInt(payload.supplierId) || null;
      
      if (isEditing) {
        await api.put(`/medicines/${currentId}`, payload);
        Alert.alert('Success', 'Medicine updated successfully');
      } else {
        await api.post('/medicines', payload);
        Alert.alert('Success', 'Medicine created successfully');
      }
      setModalVisible(false);
      loadData();
    } catch (err) {
      console.log('Save error:', err);
      setTimeout(() => Alert.alert('Error', 'Failed to save Medicine'), 100);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Confirm', 'Delete this medicine?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/medicines/${id}`);
          loadData();
        } catch (err) {
          setTimeout(() => Alert.alert('Error', 'Failed to delete'), 100);
        }
      }}
    ]);
  };

  const renderItem = ({ item }) => {
    const brandName = item.brand?.name || 'Unknown Brand';
    const categoryName = item.categoryDetail?.name || 'Uncategorized';
    
    return (
      <View style={[styles.card, { flexDirection: 'column', alignItems: 'stretch' }]}>
        <View style={{flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12}}>
          <View style={[styles.imageContainer, { width: rv(56), height: rv(56), borderRadius: 8, backgroundColor: '#F1F5F9' }]}>
            {item.images ? (
               <Image source={{uri: item.images.startsWith('http') ? item.images : `http://10.0.2.2:3000${item.images}`}} style={[styles.itemImage, {width: '100%', height: '100%', borderRadius: 8}]} resizeMode="cover" />
            ) : (
               <Ionicons name="medical-outline" size={32} color="#CBD5E1" />
            )}
          </View>
          <View style={{flex: 1, paddingLeft: rs(12)}}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={[styles.cardTitle, { flex: 1, marginBottom: 2 }]} numberOfLines={2}>{item.name}</Text>
              {item.prescriptionRequired && (
                <View style={[styles.badge, { marginLeft: 8 }]}>
                  <Text style={styles.badgeText}>Rx Required</Text>
                </View>
              )}
            </View>
            <Text style={[styles.cardSubtitle, { color: '#64748B', fontSize: 13 }]} numberOfLines={1}>{item.genericName || 'No Generic Name'}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <Text style={[styles.cardSubtitle, { color: '#334155' }]} numberOfLines={1}>
            <Text style={{fontWeight: '700', color: '#0F172A'}}>Brand/Cat:</Text> {brandName} / {categoryName}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={[styles.cardSubtitle, { color: '#0284C7', fontWeight: '700', fontSize: 15 }]}>
              ₹{item.price}
            </Text>
            <Text style={[styles.cardSubtitle, { color: item.stock > 0 ? '#166534' : '#DC2626', fontWeight: '600' }]}>
              Stock: {item.stock}
            </Text>
          </View>
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medicines</Text>
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
          ref={flatListRef}
          data={paginatedData}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1F5C52" />}
          ListEmptyComponent={<Text style={styles.emptyText}>No medicines found</Text>}
          ListFooterComponent={
            <Pagination 
              currentPage={currentPage}
              totalItems={typeof filteredData !== 'undefined' ? filteredData.length : data.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          }
        />
        </>
      )}

      {/* Main Form Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Medicine' : 'Add Medicine'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              
              <Text style={styles.sectionTitle}>Product Image</Text>
              <View style={styles.imageUploadWrapper}>
                <View style={styles.imagePreviewBox}>
                  {formData.images ? (
                    <Image source={{uri: formData.images.startsWith('http') ? formData.images : `http://10.0.2.2:3000${formData.images}`}} style={styles.previewImage} resizeMode="contain" />
                  ) : (
                    <Ionicons name="image-outline" size={40} color="#ccc" />
                  )}
                </View>
                <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage} disabled={uploadingImage}>
                  {uploadingImage ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.uploadBtnText}>Upload Image</Text>}
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Basic Info</Text>
              <Text style={styles.label}>Name *</Text>
              <TextInput style={styles.input} value={formData.name} onChangeText={(t) => setFormData({...formData, name: t})} placeholder="Paracetamol 500mg" />
              
              <Text style={styles.label}>Generic Name *</Text>
              <TextInput style={styles.input} value={formData.genericName} onChangeText={(t) => setFormData({...formData, genericName: t})} placeholder="Paracetamol" />

              <Text style={styles.label}>Manufacturer</Text>
              <TextInput style={styles.input} value={formData.manufacturer} onChangeText={(t) => setFormData({...formData, manufacturer: t})} />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Price (Rs) *</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={formData.price} onChangeText={(t) => setFormData({...formData, price: t})} />
                </View>
                <View style={{width: 12}} />
                <View style={styles.flex1}>
                  <Text style={styles.label}>Discount (Rs)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={formData.discountPrice} onChangeText={(t) => setFormData({...formData, discountPrice: t})} />
                </View>
              </View>

              <Text style={styles.sectionTitle}>Classification</Text>
              <Text style={styles.label}>Category *</Text>
              <TouchableOpacity style={styles.selectorBtn} onPress={() => setShowCatSelector(true)}>
                <Text style={styles.selectorText}>
                  {categories.find(c => c.id.toString() === formData.categoryId)?.name || 'Select Category...'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Brand *</Text>
              <TouchableOpacity style={styles.selectorBtn} onPress={() => setShowBrandSelector(true)}>
                <Text style={styles.selectorText}>
                  {brands.find(b => b.id.toString() === formData.brandId)?.name || 'Select Brand...'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Medical Details</Text>
              <Text style={styles.label}>Composition</Text>
              <TextInput style={styles.input} value={formData.composition} onChangeText={(t) => setFormData({...formData, composition: t})} />
              
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Dosage</Text>
                  <TextInput style={styles.input} value={formData.dosage} onChangeText={(t) => setFormData({...formData, dosage: t})} placeholder="500mg" />
                </View>
                <View style={{width: 12}} />
                <View style={styles.flex1}>
                  <Text style={styles.label}>Pack Size</Text>
                  <TextInput style={styles.input} value={formData.packSize} onChangeText={(t) => setFormData({...formData, packSize: t})} placeholder="10 Tablets" />
                </View>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Prescription Required?</Text>
                <Switch 
                  value={formData.prescriptionRequired} 
                  onValueChange={(v) => setFormData({...formData, prescriptionRequired: v})} 
                  trackColor={{ false: "#E2E8F0", true: "#34D399" }}
                  thumbColor={formData.prescriptionRequired ? "#059669" : "#94A3B8"}
                />
              </View>

              <Text style={styles.sectionTitle}>Dynamic Sections (Uses, FAQs, etc.)</Text>
              {formData.sections && formData.sections.map((sec, idx) => (
                <View key={idx} style={{ backgroundColor: '#F1F5F9', padding: spacing.md, borderRadius: radius.md, marginBottom: rv(12) }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(8) }}>
                    <Text style={{ fontWeight: '700', color: '#0F172A' }}>Section {idx + 1}</Text>
                    <TouchableOpacity onPress={() => {
                      const newSections = [...formData.sections];
                      newSections.splice(idx, 1);
                      setFormData({...formData, sections: newSections});
                    }}>
                      <Text style={{ color: '#EF4444', fontWeight: '600' }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.label, { marginTop: 0 }]}>Title</Text>
                  <TextInput 
                    style={styles.input} 
                    value={sec.title} 
                    onChangeText={(t) => {
                      const newSections = [...formData.sections];
                      newSections[idx].title = t;
                      setFormData({...formData, sections: newSections});
                    }} 
                    placeholder="e.g. Uses" 
                  />
                  <Text style={styles.label}>Content (HTML)</Text>
                  <TextInput 
                    style={[styles.input, { minHeight: rv(100), textAlignVertical: 'top' }]} 
                    value={sec.content} 
                    onChangeText={(t) => {
                      const newSections = [...formData.sections];
                      newSections[idx].content = t;
                      setFormData({...formData, sections: newSections});
                    }} 
                    placeholder="<p>Content goes here...</p>" 
                    multiline 
                  />
                </View>
              ))}
              <TouchableOpacity 
                style={{ backgroundColor: '#E0F2FE', paddingVertical: rv(12), borderRadius: radius.md, alignItems: 'center', marginBottom: rv(16) }} 
                onPress={() => {
                   const newSections = [...(formData.sections || [])];
                   newSections.push({ title: '', content: '', sortOrder: newSections.length + 1 });
                   setFormData({...formData, sections: newSections});
                }}
              >
                <Text style={{ color: '#0284C7', fontWeight: '700' }}>+ Add Section</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Inventory</Text>
              <Text style={styles.label}>Initial Stock</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={formData.stock} onChangeText={(t) => setFormData({...formData, stock: t})} />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Medicine</Text>}
              </TouchableOpacity>
              <View style={{height: 60}} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Selector Modal */}
      <Modal visible={showCatSelector} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.selectorModal}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <FlatList 
              data={categories}
              keyExtractor={i => i.id.toString()}
              renderItem={({item}) => (
                <TouchableOpacity style={styles.selectorItem} onPress={() => { setFormData({...formData, categoryId: item.id.toString()}); setShowCatSelector(false); }}>
                  <Text style={styles.selectorItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowCatSelector(false)}><Text>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Brand Selector Modal */}
      <Modal visible={showBrandSelector} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.selectorModal}>
            <Text style={styles.modalTitle}>Select Brand</Text>
            <FlatList 
              data={brands}
              keyExtractor={i => i.id.toString()}
              renderItem={({item}) => (
                <TouchableOpacity style={styles.selectorItem} onPress={() => { setFormData({...formData, brandId: item.id.toString()}); setShowBrandSelector(false); }}>
                  <Text style={styles.selectorItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowBrandSelector(false)}><Text>Cancel</Text></TouchableOpacity>
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
  cardContent: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: rm(16), fontWeight: '700', color: '#0F172A', marginBottom: rv(2) },
  cardSubtitle: { fontSize: rm(13), color: '#64748B', marginBottom: rv(4) },
  cardDesc: { fontSize: rm(13), color: '#10B981', fontWeight: '600', marginBottom: rv(6) },
  badge: { backgroundColor: '#FEE2E2', alignSelf: 'flex-start', paddingHorizontal: rs(8), paddingVertical: rv(2), borderRadius: radius.sm },
  badgeText: { fontSize: rm(10), color: '#EF4444', fontWeight: '700' },
  
  cardActions: { justifyContent: 'space-between', paddingLeft: spacing.sm },
  actionBtn: { paddingVertical: rv(6), paddingHorizontal: rs(10), backgroundColor: '#F1F5F9', borderRadius: radius.sm, marginBottom: rv(8), alignItems: 'center' },
  actionTextEdit: { color: '#0284C7', fontSize: rm(12), fontWeight: '600' },
  actionTextDelete: { color: '#EF4444', fontSize: rm(12), fontWeight: '600' },
  imageContainer: {
    width: rs(60),
    height: rs(60),
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  imageUploadWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rv(16),
  },
  imagePreviewBox: {
    width: rs(80),
    height: rs(80),
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: rs(16),
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  uploadBtn: {
    backgroundColor: '#1F5C52',
    paddingHorizontal: rs(16),
    paddingVertical: rv(8),
    borderRadius: radius.sm,
  },
  uploadBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: rm(18), fontWeight: '700', color: '#0F172A' },
  closeIcon: { fontSize: rm(20), color: '#64748B', padding: rv(4) },
  modalBody: { padding: spacing.lg },
  
  sectionTitle: { fontSize: rm(16), fontWeight: '700', color: '#0284C7', marginTop: rv(24), marginBottom: rv(8), borderBottomWidth: 1, borderBottomColor: '#E0F2FE', paddingBottom: rv(4) },
  label: { fontSize: rm(13), fontWeight: '600', color: '#475569', marginBottom: rv(6), marginTop: rv(12) },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: rv(10), fontSize: rm(15), color: '#0F172A' },
  selectorBtn: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: rv(14) },
  selectorText: { fontSize: rm(15), color: '#0F172A' },
  
  row: { flexDirection: 'row' },
  flex1: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: rv(16), padding: spacing.md, backgroundColor: '#F8FAFC', borderRadius: radius.md, borderWidth: 1, borderColor: '#E2E8F0' },

  saveBtn: { backgroundColor: '#1F5C52', paddingVertical: rv(16), borderRadius: radius.md, alignItems: 'center', marginTop: rv(32) },
  saveBtnText: { color: '#fff', fontSize: rm(16), fontWeight: '700' },

  selectorModal: { backgroundColor: '#fff', margin: spacing.xl, borderRadius: radius.lg, padding: spacing.lg, maxHeight: '60%' },
  selectorItem: { paddingVertical: rv(14), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  selectorItemText: { fontSize: rm(16), color: '#0F172A' },
  modalBtnCancel: { marginTop: rv(16), padding: rv(12), alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: radius.md }
});
