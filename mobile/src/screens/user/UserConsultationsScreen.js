import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

export default function UserConsultationsScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/account/appointments');
      if (res.data?.success) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      case 'scheduled': return '#3B82F6';
      default: return '#F59E0B'; // Pending
    }
  };

  const renderItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const docName = item.consultingDoctor?.name || 'Doctor';
    const spec = item.consultingDoctor?.specialization || 'General';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Dr. {docName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status || 'Pending'}</Text>
          </View>
        </View>
        <Text style={styles.specText}>{spec}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.dateText}>
            📅 {item.dateTime ? new Date(item.dateTime).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
            }) : 'TBD'}
          </Text>
          <Text style={styles.dateText}>
            ⏰ {item.dateTime ? new Date(item.dateTime).toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit', hour12: true
            }) : 'TBD'}
          </Text>
        </View>
        {(item.notes || item.reason) ? <Text style={styles.notesText} numberOfLines={2}>Notes: {item.notes || item.reason}</Text> : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{top:16, bottom:16, left:16, right:16}}>
          <Ionicons name="arrow-back" size={rs(24)} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Consultations</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1F5C52" />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={appointments.length === 0 ? [styles.list, { flex: 1 }] : styles.list}
          ItemSeparatorComponent={() => <View style={{ height: rv(12) }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1F5C52']} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>🩺</Text>
              <Text style={styles.emptyTitle}>No Consultations Found</Text>
              <Text style={styles.emptySub}>You haven't booked any doctor consultations yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  cardTitle: { fontSize: rm(16), fontWeight: '700', color: '#1E293B' },
  statusBadge: { paddingHorizontal: rs(10), paddingVertical: rv(4), borderRadius: radius.full },
  statusText: { fontSize: rm(12), fontWeight: '700', textTransform: 'capitalize' },
  specText: { fontSize: rm(14), color: '#64748B', marginBottom: rv(12) },
  detailsRow: { flexDirection: 'row', gap: rs(16), marginBottom: rv(8) },
  dateText: { fontSize: rm(13), color: '#1E293B', fontWeight: '500' },
  notesText: { fontSize: rm(14), color: '#475569', marginTop: rv(4), fontStyle: 'italic' },
  emptyIcon: { fontSize: rm(48), marginBottom: rv(16) },
  emptyTitle: { fontSize: rm(18), fontWeight: '700', color: '#1E293B', marginBottom: rv(8) },
  emptySub: { fontSize: rm(14), color: '#64748B', textAlign: 'center', marginBottom: rv(24) },
});
