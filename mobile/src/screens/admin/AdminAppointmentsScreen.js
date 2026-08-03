import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Modal, TextInput, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import Pagination from '../../components/admin/Pagination';
import { AlertService } from '../../services/AlertService';

const STATUS_COLORS = {
  Scheduled: { bg: '#EFF6FF', text: '#1D4ED8' },
  Completed: { bg: '#ECFDF5', text: '#065F46' },
  Cancelled: { bg: '#FEF2F2', text: '#991B1B' },
};

export default function AdminAppointmentsScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredData = data.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      String(item.consultingDoctor?.name || '').toLowerCase().includes(q) ||
      String(item.patient?.name || '').toLowerCase().includes(q) ||
      String(item.status || '').toLowerCase().includes(q) ||
      String(item.type || '').toLowerCase().includes(q)
    );
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({ status: '', meetLink: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.get('/admin/appointments');
      if (res.data?.success) {
        setData(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.log('Error loading Appointments:', err);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to load Appointments' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleOpenEdit = (item) => {
    setCurrentItem(item);
    setFormData({
      status: item.status || 'Scheduled',
      meetLink: item.meetLink || '',
      notes: item.notes || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!currentItem) return;
    setSaving(true);
    try {
      await api.put('/admin/appointments/' + currentItem.id, {
        status: formData.status,
        meetLink: formData.meetLink,
        notes: formData.notes,
      });
      setModalVisible(false);
      loadData();
    } catch (err) {
      console.log('Failed to update appointment:', err);
      AlertService.show({ type: 'error', title: 'Error', message: err?.response?.data?.message || 'Failed to update appointment' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    AlertService.show({
      type: 'warning', title: 'Delete Appointment',
      message: 'Are you sure you want to delete this appointment?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await api.delete('/admin/appointments/' + id);
              setData(prev => prev.filter(item => item.id !== id));
            } catch (err) {
              AlertService.show({ type: 'error', title: 'Error', message: 'Failed to delete appointment' });
            }
          }
        }
      ]
    });
  };

  const renderItem = ({ item }) => {
    const apptDate = item.dateTime ? new Date(item.dateTime) : null;
    const dateStr = apptDate
      ? apptDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'No date';
    const timeStr = apptDate
      ? apptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      : '';
    const statusStyle = STATUS_COLORS[item.status] || { bg: '#FEF9C3', text: '#854D0E' };
    const doctorName = item.consultingDoctor?.name || `#${item.doctorId}`;
    const patientName = item.patient?.name || `User #${item.userId}`;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardDoctor}>Dr. {doctorName}</Text>
            <Text style={styles.cardSpec}>{item.consultingDoctor?.specialization || ''}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status || 'Scheduled'}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardRow}>
          <Ionicons name="person-outline" size={rm(13)} color="#64748B" />
          <Text style={styles.cardMeta}>{patientName}</Text>
          {item.patient?.phone ? (
            <Text style={styles.cardMetaSecondary}>  •  {item.patient.phone}</Text>
          ) : null}
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="calendar-outline" size={rm(13)} color="#64748B" />
          <Text style={styles.cardMeta}>{dateStr}{timeStr ? `  ·  ${timeStr}` : ''}</Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name={item.type === 'Chat' ? 'chatbubble-outline' : 'videocam-outline'} size={rm(13)} color="#64748B" />
          <Text style={styles.cardMeta}>{item.type || 'Video'}</Text>
        </View>
        {item.meetLink ? (
          <View style={styles.cardRow}>
            <Ionicons name="link-outline" size={rm(13)} color="#0284C7" />
            <Text style={[styles.cardMeta, { color: '#0284C7' }]} numberOfLines={1}>{item.meetLink}</Text>
          </View>
        ) : null}
        {item.notes ? (
          <Text style={styles.cardNotes} numberOfLines={2}>{item.notes}</Text>
        ) : null}

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(item)}>
            <Ionicons name="pencil-outline" size={rm(15)} color="#0284C7" />
            <Text style={styles.editBtnText}>Update Status</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={rm(15)} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const STATUS_OPTIONS = ['Scheduled', 'Completed', 'Cancelled'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Ionicons name="arrow-back" size={rs(24)} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
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
              placeholder="Search by doctor, patient, status..."
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
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No appointments found.</Text>
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

      {/* Edit Modal — only status, meetLink, notes can be updated per the API */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update Appointment</Text>
                {currentItem && (
                  <Text style={styles.modalSub}>Dr. {currentItem.consultingDoctor?.name || ''} · {currentItem.patient?.name || ''}</Text>
                )}
              </View>
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
                    <Text style={styles.fieldLabel}>Status</Text>
                    <View style={styles.statusRow}>
                      {STATUS_OPTIONS.map(s => {
                        const sc = STATUS_COLORS[s] || { bg: '#F1F5F9', text: '#475569' };
                        const active = formData.status === s;
                        return (
                          <TouchableOpacity
                            key={s}
                            style={[styles.statusOption, active && { backgroundColor: sc.bg, borderColor: sc.text }]}
                            onPress={() => setFormData({ ...formData, status: s })}
                          >
                            <Text style={[styles.statusOptionText, active && { color: sc.text, fontWeight: '700' }]}>{s}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldLabel}>Meet Link (Video URL)</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.meetLink || ''}
                      onChangeText={txt => setFormData({ ...formData, meetLink: txt })}
                      placeholder="https://meet.google.com/..."
                      placeholderTextColor="#94A3B8"
                      keyboardType="url"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldLabel}>Notes</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.notes || ''}
                      onChangeText={txt => setFormData({ ...formData, notes: txt })}
                      placeholder="Internal notes or patient instructions..."
                      placeholderTextColor="#94A3B8"
                      multiline
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
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
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
    backgroundColor: '#fff', borderRadius: radius.md, padding: spacing.md, marginBottom: rv(12),
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: rv(10) },
  cardDoctor: { fontSize: rm(16), fontWeight: '700', color: '#0F172A' },
  cardSpec: { fontSize: rm(12), color: '#1F5C52', fontWeight: '600', marginTop: rv(1) },
  statusBadge: { paddingHorizontal: rs(10), paddingVertical: rv(4), borderRadius: radius.full },
  statusText: { fontSize: rm(12), fontWeight: '700', textTransform: 'capitalize' },
  cardDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: rv(10) },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rv(5) },
  cardMeta: { fontSize: rm(13), color: '#475569', fontWeight: '500', flex: 1 },
  cardMetaSecondary: { fontSize: rm(13), color: '#94A3B8' },
  cardNotes: { fontSize: rm(13), color: '#64748B', fontStyle: 'italic', marginTop: rv(4) },
  cardActions: { flexDirection: 'row', alignItems: 'center', marginTop: rv(12), gap: rv(8) },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6), backgroundColor: '#EFF6FF', borderRadius: radius.sm, paddingVertical: rv(8) },
  editBtnText: { color: '#0284C7', fontWeight: '600', fontSize: rm(13) },
  deleteBtn: { padding: rv(8), backgroundColor: '#FEF2F2', borderRadius: radius.sm },
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: rv(60) },
  emptyIcon: { fontSize: rm(48), marginBottom: rv(12) },
  emptyText: { fontSize: rm(16), color: '#64748B', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: rm(18), fontWeight: '700', color: '#0F172A' },
  modalSub: { fontSize: rm(13), color: '#64748B', marginTop: rv(2) },
  formScroll: { padding: spacing.lg },
  fieldBox: { marginBottom: rv(16) },
  fieldLabel: { fontSize: rm(13), fontWeight: '600', color: '#475569', textTransform: 'uppercase', marginBottom: rv(8) },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.md, paddingHorizontal: rv(16), paddingVertical: rv(14), fontSize: rm(15), color: '#0F172A' },
  textArea: { height: rv(90), textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', gap: rs(8) },
  statusOption: { flex: 1, paddingVertical: rv(10), borderRadius: radius.md, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', backgroundColor: '#F8FAFC' },
  statusOptionText: { fontSize: rm(13), color: '#64748B', fontWeight: '500' },
  modalFooter: { flexDirection: 'row', padding: spacing.lg, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: rv(12) },
  cancelBtn: { flex: 1, paddingVertical: rv(16), backgroundColor: '#F1F5F9', borderRadius: radius.md, alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontWeight: '600', fontSize: rm(15) },
  saveBtn: { flex: 1, paddingVertical: rv(16), backgroundColor: '#1F5C52', borderRadius: radius.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: rm(15) },
});
