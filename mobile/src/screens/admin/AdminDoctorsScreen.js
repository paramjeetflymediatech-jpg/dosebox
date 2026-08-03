import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Modal, TextInput, RefreshControl, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import Pagination from '../../components/admin/Pagination';
import { AlertService } from '../../services/AlertService';
import { launchImageLibrary } from 'react-native-image-picker';

export default function AdminDoctorsScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredData = data.filter(item =>
    [item.name, item.specialization].some(val =>
      String(val || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
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
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.get('/admin/doctors');
      if (res.data?.success) {
        setData(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.log('Error loading Doctors:', err);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to load Doctors' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleOpenModal = (item = null) => {
    setIsEditing(!!item);
    setCurrentId(item ? item.id : null);
    setFormData({
      name: String(item?.name || ''),
      specialization: String(item?.specialization || ''),
      experience: String(item?.experience || ''),
      fees: String(item?.fees || ''),
      availability: String(item?.availability || '[]'),
      avatar: String(item?.avatar || ''),
    });
    setModalVisible(true);
  };

  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });
      if (result.didCancel || !result.assets?.length) return;
      const asset = result.assets[0];

      setUploadingImage(true);
      const fd = new FormData();
      fd.append('file', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'doctor_avatar.jpg',
      });

      const res = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data?.fileUrl) {
        setFormData(prev => ({ ...prev, avatar: res.data.fileUrl }));
      } else {
        AlertService.show({ type: 'error', title: 'Upload Failed', message: 'Image could not be uploaded.' });
      }
    } catch (err) {
      console.log('Image pick/upload error:', err);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to upload image.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name?.trim() || !formData.specialization?.trim()) {
      AlertService.show({ type: 'error', title: 'Validation', message: 'Name and Specialization are required.' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        specialization: formData.specialization,
        experience: parseInt(formData.experience) || 0,
        fees: parseFloat(formData.fees) || 0,
        availability: formData.availability || '[]',
        avatar: formData.avatar || '',
      };
      if (isEditing && currentId) {
        await api.put('/admin/doctors/' + currentId, payload);
      } else {
        await api.post('/admin/doctors', payload);
      }
      setModalVisible(false);
      loadData();
    } catch (err) {
      console.log('Failed to save Doctor:', err);
      AlertService.show({ type: 'error', title: 'Error', message: err?.response?.data?.message || 'Failed to save Doctor' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    AlertService.show({
      type: 'warning', title: 'Delete Doctor',
      message: 'Are you sure? This will also delete all appointments for this doctor.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await api.delete('/admin/doctors/' + id);
              setData(prev => prev.filter(item => item.id !== id));
            } catch (err) {
              AlertService.show({ type: 'error', title: 'Error', message: 'Failed to delete doctor' });
            }
          }
        }
      ]
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.cardAvatar} resizeMode="cover" />
      ) : (
        <View style={[styles.cardAvatar, styles.cardAvatarPlaceholder]}>
          <Ionicons name="person" size={rs(24)} color="#94A3B8" />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>Dr. {item.name}</Text>
        <Text style={styles.cardSpec}>{item.specialization}</Text>
        <View style={styles.cardMeta}>
          {!!item.experience && (
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={rm(12)} color="#64748B" />
              <Text style={styles.metaText}>{item.experience} yrs</Text>
            </View>
          )}
          {!!item.fees && (
            <View style={styles.metaChip}>
              <Ionicons name="cash-outline" size={rm(12)} color="#64748B" />
              <Text style={styles.metaText}>₹{item.fees}</Text>
            </View>
          )}
          {!!item.rating && (
            <View style={styles.metaChip}>
              <Ionicons name="star" size={rm(12)} color="#F59E0B" />
              <Text style={styles.metaText}>{item.rating}</Text>
            </View>
          )}
        </View>
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
          <Ionicons name="arrow-back" size={rs(24)} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctors</Text>
        <View style={{ width: rs(24) }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#1F5C52" /></View>
      ) : (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={rs(20)} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or specialization..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={text => { setSearchQuery(text); setCurrentPage(1); }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={rs(20)} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={paginatedData}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.listContent}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1F5C52']} />}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🩺</Text>
                <Text style={styles.emptyText}>No doctors found.</Text>
              </View>
            }
            ListFooterComponent={
              <Pagination
                currentPage={currentPage}
                totalItems={filteredData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            }
          />
        </>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => handleOpenModal()} activeOpacity={0.8}>
        <Ionicons name="add" size={rs(28)} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit' : 'Add'} Doctor</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={rs(22)} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={[{}]}
              keyExtractor={() => 'form'}
              contentContainerStyle={styles.formScroll}
              renderItem={() => (
                <View>
                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldLabel}>Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.name || ''}
                      onChangeText={txt => setFormData({ ...formData, name: txt })}
                      placeholder="Dr. Full Name"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldLabel}>Specialization *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.specialization || ''}
                      onChangeText={txt => setFormData({ ...formData, specialization: txt })}
                      placeholder="e.g. Cardiologist, General Physician"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={styles.fieldRow}>
                    <View style={[styles.fieldBox, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Experience (yrs) *</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.experience || ''}
                        onChangeText={txt => setFormData({ ...formData, experience: txt })}
                        placeholder="e.g. 5"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={[styles.fieldBox, { flex: 1, marginLeft: rs(12) }]}>
                      <Text style={styles.fieldLabel}>Fees (₹) *</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.fees || ''}
                        onChangeText={txt => setFormData({ ...formData, fees: txt })}
                        placeholder="e.g. 500"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldLabel}>Doctor Photo</Text>
                    <TouchableOpacity style={styles.avatarPicker} onPress={handlePickImage} activeOpacity={0.7} disabled={uploadingImage}>
                      {uploadingImage ? (
                        <View style={styles.avatarPlaceholder}>
                          <ActivityIndicator color="#1F5C52" />
                          <Text style={styles.avatarHint}>Uploading...</Text>
                        </View>
                      ) : formData.avatar ? (
                        <View style={styles.avatarPreviewBox}>
                          <Image source={{ uri: formData.avatar }} style={styles.avatarPreview} resizeMode="cover" />
                          <View style={styles.avatarEditBadge}>
                            <Ionicons name="camera" size={rs(14)} color="#fff" />
                          </View>
                        </View>
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Ionicons name="camera-outline" size={rs(32)} color="#94A3B8" />
                          <Text style={styles.avatarHint}>Tap to choose photo</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldLabel}>Availability Slots (JSON)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.availability || '[]'}
                      onChangeText={txt => setFormData({ ...formData, availability: txt })}
                      placeholder={'["09:00 AM","10:00 AM","02:00 PM","04:00 PM"]'}
                      placeholderTextColor="#94A3B8"
                      multiline
                    />
                    <Text style={styles.fieldHint}>Paste a JSON array of time slot strings.</Text>
                  </View>
                </View>
              )}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Doctor</Text>}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: spacing.md, paddingTop: rv(12), paddingBottom: rv(14),
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backButton: { padding: rv(4) },
  headerTitle: { fontSize: rm(20), fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: spacing.md, marginTop: rv(16), marginBottom: rv(12), paddingHorizontal: spacing.md,
    height: rv(48), borderRadius: radius.full, borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: rs(8), fontSize: rm(15), color: '#0F172A', fontWeight: '500' },
  listContent: { padding: spacing.md, paddingBottom: rv(100) },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: radius.md, padding: spacing.md, marginBottom: rv(12),
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardAvatar: {
    width: rs(52), height: rs(52), borderRadius: rs(26),
    marginRight: rs(12), overflow: 'hidden',
  },
  cardAvatarPlaceholder: {
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1, paddingRight: rv(12) },
  cardTitle: { fontSize: rm(16), fontWeight: '700', color: '#0F172A', marginBottom: rv(2) },
  cardSpec: { fontSize: rm(13), color: '#1F5C52', fontWeight: '600', marginBottom: rv(6) },
  cardMeta: { flexDirection: 'row', gap: rs(8), flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: rs(4), backgroundColor: '#F1F5F9', borderRadius: radius.full, paddingHorizontal: rs(8), paddingVertical: rv(3) },
  metaText: { fontSize: rm(12), color: '#64748B', fontWeight: '600' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: rv(8) },
  actionBtn: { padding: rv(8), backgroundColor: '#F1F5F9', borderRadius: radius.sm },
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: rv(60) },
  emptyIcon: { fontSize: rm(48), marginBottom: rv(12) },
  emptyText: { fontSize: rm(16), color: '#64748B', fontWeight: '500' },
  fab: {
    position: 'absolute', bottom: rv(24), right: rv(24),
    width: rv(56), height: rv(56), borderRadius: rv(28), backgroundColor: '#1F5C52',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1F5C52', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: rm(18), fontWeight: '700', color: '#0F172A' },
  formScroll: { padding: spacing.lg },
  fieldBox: { marginBottom: rv(16) },
  fieldRow: { flexDirection: 'row', alignItems: 'flex-start' },
  fieldLabel: { fontSize: rm(13), fontWeight: '600', color: '#475569', textTransform: 'uppercase', marginBottom: rv(8) },
  fieldHint: { fontSize: rm(11), color: '#94A3B8', marginTop: rv(4) },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.md, paddingHorizontal: rv(16), paddingVertical: rv(14), fontSize: rm(15), color: '#0F172A' },
  textArea: { height: rv(90), textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', padding: spacing.lg, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: rv(12) },
  cancelBtn: { flex: 1, paddingVertical: rv(16), backgroundColor: '#F1F5F9', borderRadius: radius.md, alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontWeight: '600', fontSize: rm(15) },
  saveBtn: { flex: 1, paddingVertical: rv(16), backgroundColor: '#1F5C52', borderRadius: radius.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: rm(15) },
  avatarPicker: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: radius.md,
    overflow: 'hidden',
    height: rv(120),
    backgroundColor: '#F8FAFC',
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: rv(6),
  },
  avatarHint: {
    fontSize: rm(13),
    color: '#94A3B8',
    fontWeight: '500',
  },
  avatarPreviewBox: {
    flex: 1,
    position: 'relative',
  },
  avatarPreview: {
    width: '100%',
    height: '100%',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: rs(8),
    right: rs(8),
    backgroundColor: '#1F5C52',
    borderRadius: radius.full,
    padding: rv(6),
  },
});
