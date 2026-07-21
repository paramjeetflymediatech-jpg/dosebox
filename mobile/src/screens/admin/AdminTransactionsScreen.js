import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, TextInput, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import Pagination from '../../components/admin/Pagination';
import { AlertService } from '../../services/AlertService';

export default function AdminTransactionsScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredData = data.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const orderIdMatch = `OD-${item.id}`.toLowerCase().includes(searchLower);
    const userMatch = item.user?.name?.toLowerCase().includes(searchLower) || item.user?.email?.toLowerCase().includes(searchLower);
    const txnMatch = item.transactionId?.toLowerCase().includes(searchLower);
    return orderIdMatch || userMatch || txnMatch;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const loadData = async () => {
    try {
      const res = await api.get('/orders?limit=1000');
      if (res.data?.success) {
        let items = res.data.data;
        if (Array.isArray(items)) {
          items = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setData(items);
        } else {
          setData([]);
        }
      }
    } catch (err) {
      console.log('Error loading Transactions:', err);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to load Transactions' });
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

  const getPaymentStatusColor = (status) => {
    if (status === 'Paid') return { bg: '#ECFDF5', text: '#059669', border: '#D1FAE5' };
    if (status === 'Failed') return { bg: '#FFF1F2', text: '#E11D48', border: '#FFE4E6' };
    return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
  };

  const renderItem = ({ item }) => {
    const statusStyle = getPaymentStatusColor(item.paymentStatus);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>#OD-{item.id}</Text>
            {item.transactionId && (
              <Text style={styles.txnId}>{item.transactionId}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.paymentStatus || 'Unknown'}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.value}>{item.user?.name || 'Unknown'}</Text>
              <Text style={styles.subValue}>{item.user?.email || 'No email'}</Text>
            </View>
            <View style={[styles.col, { alignItems: 'flex-end' }]}>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.amount}>₹{Number(item.finalAmount || 0).toFixed(2)}</Text>
              <Text style={styles.subValue}>{item.paymentMethod || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.dateBox}>
            <Ionicons name="calendar-outline" size={rm(14)} color="#94A3B8" />
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={{ width: rm(24) }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1F5C52" />
        </View>
      ) : (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={rs(20)} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Order ID, Name..."
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
                <Text style={styles.emptyText}>No transactions found.</Text>
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
  backIcon: { fontSize: rm(24), color: '#0F172A', fontWeight: '300' },
  headerTitle: { fontSize: rm(20), fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: spacing.md, marginTop: rv(16), marginBottom: rv(12), paddingHorizontal: spacing.md,
    height: rv(48), borderRadius: radius.full, borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1
  },
  searchInput: { flex: 1, marginLeft: rs(8), fontSize: rm(15), color: '#0F172A', fontWeight: '500' },
  listContent: { padding: spacing.md, paddingBottom: rv(100) },
  
  card: {
    backgroundColor: '#fff', 
    borderRadius: radius.md, marginBottom: rv(12),
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F8FAFC'
  },
  orderId: { fontSize: rm(15), fontWeight: '700', color: '#0F172A' },
  txnId: { fontSize: rm(12), color: '#64748B', marginTop: rv(2), fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: rv(10), paddingVertical: rv(4), borderRadius: radius.full, borderWidth: 1 },
  statusText: { fontSize: rm(11), fontWeight: '700', textTransform: 'uppercase' },
  
  cardBody: { padding: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rv(12) },
  col: { flex: 1 },
  label: { fontSize: rm(12), fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', marginBottom: rv(4) },
  value: { fontSize: rm(14), fontWeight: '600', color: '#0F172A', marginBottom: rv(2) },
  subValue: { fontSize: rm(13), color: '#64748B' },
  amount: { fontSize: rm(16), fontWeight: '800', color: '#0F172A', marginBottom: rv(2) },
  
  dateBox: { flexDirection: 'row', alignItems: 'center', gap: rs(6), backgroundColor: '#F8FAFC', padding: rv(8), borderRadius: radius.sm },
  dateText: { fontSize: rm(12), color: '#64748B', fontWeight: '500' },
  
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: rv(60) },
  emptyIcon: { fontSize: rm(48), marginBottom: rv(12) },
  emptyText: { fontSize: rm(16), color: '#64748B', fontWeight: '500' },
});
