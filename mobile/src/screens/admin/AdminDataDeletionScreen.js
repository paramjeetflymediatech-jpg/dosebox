import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Modal, Alert, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import Pagination from '../../components/admin/Pagination';
import { AlertService } from '../../services/AlertService';

export default function AdminDataDeletionScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updating, setUpdating] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.get('/admin/data-deletion');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.log('Error fetching deletion requests:', err);
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

  const handleUpdateStatus = async (status) => {
    if (!selectedRequest) return;
    setUpdating(true);
    try {
      const res = await api.patch(`/admin/data-deletion/${selectedRequest.id}`, { status });
      if (res.data?.success) {
        AlertService.show({ type: 'success', title: 'Success', message: `Status updated to ${status}` });
        loadData();
        setModalVisible(false);
      } else {
        AlertService.show({ type: 'error', title: 'Error', message: res.data?.message || 'Failed to update request' });
      }
    } catch (err) {
      AlertService.show({ type: 'error', title: 'Error', message: err.response?.data?.message || err.message });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = (id) => {
    AlertService.show({ type: 'warning', title: 'Confirm Delete', message: 'Are you sure you want to delete this request record? This cannot be undone.', buttons: [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const res = await api.delete(`/admin/data-deletion/${id}`);
          if (res.data?.success) {
            AlertService.show({ type: 'info', title: 'Deleted', message: 'Request deleted successfully' });
            loadData();
          } else {
            AlertService.show({ type: 'error', title: 'Error', message: res.data?.message || 'Failed to delete' });
          }
        } catch (err) {
          AlertService.show({ type: 'error', title: 'Error', message: err.response?.data?.message || err.message });
        }
      }}
    ]});
  };

  const openDetails = (req) => {
    setSelectedRequest(req);
    setModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#F59E0B';
      case 'Processed': return '#10B981';
      case 'Rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.7} 
      onPress={() => openDetails(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.itemId}>#{item.id}</Text>
          <Text style={styles.itemTitle}>{item.email}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={rs(18)} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Reason:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{item.reason}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '1A' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(24)} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Deletion Requests</Text>
        <View style={{ width: rs(40) }} />
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color="#0EA5E9" /></View>
      ) : (
        <FlatList
          data={paginatedData}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No deletion requests found.</Text>
          }
          ListFooterComponent={
            data.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(data.length / itemsPerPage)}
                onPageChange={setCurrentPage}
              />
            )
          }
        />
      )}

      {/* Details Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={rs(24)} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{selectedRequest.email}</Text>

                <Text style={styles.detailLabel}>Reason</Text>
                <Text style={styles.detailValue}>{selectedRequest.reason}</Text>

                <Text style={styles.detailLabel}>Date Submitted</Text>
                <Text style={styles.detailValue}>{new Date(selectedRequest.createdAt).toLocaleString()}</Text>

                <Text style={styles.detailLabel}>Current Status</Text>
                <Text style={[styles.detailValue, { color: getStatusColor(selectedRequest.status), fontWeight: '700' }]}>
                  {selectedRequest.status}
                </Text>

                <Text style={styles.detailLabel}>Change Status</Text>
                <View style={styles.statusButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.statusBtn, { backgroundColor: '#F59E0B' }]} 
                    onPress={() => handleUpdateStatus('Pending')}
                    disabled={updating}
                  >
                    <Text style={styles.statusBtnText}>Pending</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.statusBtn, { backgroundColor: '#10B981' }]} 
                    onPress={() => handleUpdateStatus('Processed')}
                    disabled={updating}
                  >
                    <Text style={styles.statusBtnText}>Processed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.statusBtn, { backgroundColor: '#EF4444' }]} 
                    onPress={() => handleUpdateStatus('Rejected')}
                    disabled={updating}
                  >
                    <Text style={styles.statusBtnText}>Rejected</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
    paddingHorizontal: spacing.md, paddingTop: rv(16), paddingBottom: rv(12),
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: rm(20), fontWeight: '700', color: '#0F172A' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: spacing.md, paddingBottom: rv(100) },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: rv(40) },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: rv(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: rv(12),
  },
  cardHeaderLeft: { flex: 1, marginRight: spacing.sm },
  itemId: { fontSize: rm(12), color: '#64748B', fontWeight: '600', marginBottom: rv(4) },
  itemTitle: { fontSize: rm(16), fontWeight: '700', color: '#1E293B' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { padding: spacing.xs },
  cardBody: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: rv(12),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: rv(4),
  },
  infoLabel: { fontSize: rm(13), color: '#64748B', fontWeight: '500' },
  infoValue: { fontSize: rm(13), color: '#334155', fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: rv(4),
    borderRadius: radius.full,
  },
  statusText: { fontSize: rm(12), fontWeight: '700' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(20) },
  modalTitle: { fontSize: rm(20), fontWeight: '700', color: '#0F172A' },
  
  detailsContainer: { paddingBottom: rv(20) },
  detailLabel: { fontSize: rm(13), color: '#64748B', fontWeight: '600', marginBottom: rv(4), marginTop: rv(16) },
  detailValue: { fontSize: rm(16), color: '#1E293B', fontWeight: '500' },
  
  statusButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: rv(12),
  },
  statusBtn: {
    flex: 1,
    paddingVertical: rv(12),
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  statusBtnText: {
    color: '#fff',
    fontSize: rm(14),
    fontWeight: '700',
  }
});
