import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

const STATUS_CONFIG = {
  pending:    { color: '#F59E0B', bg: '#FFFBEB', label: 'Pending' },
  processing: { color: '#3B82F6', bg: '#EFF6FF', label: 'Processing' },
  shipped:    { color: '#8B5CF6', bg: '#F5F3FF', label: 'Shipped' },
  delivered:  { color: '#1F5C52', bg: '#F0FDF4', label: 'Delivered' },
  cancelled:  { color: '#EF4444', bg: '#FEF2F2', label: 'Cancelled' },
};

export default function ProceedScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my');
      if (res.data.success) setOrders(res.data.data || []);
    } catch {
      // show empty state
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7}>
        <View style={styles.cardTop}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <Text style={styles.itemCount}>
          {item.itemCount || item.items?.length || 0} item(s) · ₹{item.totalAmount || item.total || 0}
        </Text>
        {item.createdAt && (
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1F5C52" />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>
            Your orders will appear here once you place one.
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('ExploreTab')}
          >
            <Text style={styles.shopBtnText}>Browse Medicines</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: rv(10) }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: rv(16),
    paddingBottom: rv(12),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: rm(22),
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  list: {
    padding: spacing.md,
    paddingBottom: rv(120),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rv(8),
  },
  orderId: {
    fontSize: rm(15),
    fontWeight: '600',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: rs(10),
    paddingVertical: rv(4),
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: rm(12),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  itemCount: {
    fontSize: rm(13),
    color: '#64748B',
    marginBottom: rv(4),
  },
  orderDate: {
    fontSize: rm(12),
    color: '#94A3B8',
    fontWeight: '500',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyIcon: { fontSize: rs(56), marginBottom: rv(16) },
  emptyTitle: {
    fontSize: rm(18),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: rv(8),
  },
  emptySub: {
    fontSize: rm(14),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: rv(22),
    marginBottom: rv(24),
  },
  shopBtn: {
    backgroundColor: '#1F5C52',
    paddingHorizontal: rs(24),
    paddingVertical: rv(14),
    borderRadius: radius.md,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: rm(14),
  },
});
