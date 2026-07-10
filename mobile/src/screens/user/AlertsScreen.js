import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

const MOCK_ALERTS = [
  {
    id: '1',
    type: 'refill',
    title: 'Refill Reminder',
    message: 'Metformin 500mg is running low. Order now to avoid a gap.',
    time: '2h ago',
    unread: true,
  },
  {
    id: '2',
    type: 'order',
    title: 'Order Shipped',
    message: 'Your order #DB1042 has been dispatched and is on the way.',
    time: '5h ago',
    unread: true,
  },
  {
    id: '3',
    type: 'promo',
    title: 'Special Offer',
    message: 'Get 15% off on all diabetes care products today only.',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: '4',
    type: 'order',
    title: 'Order Delivered',
    message: 'Your order #DB1038 was successfully delivered.',
    time: '3 days ago',
    unread: false,
  },
];

const TYPE_CONFIG = {
  refill: { color: '#EF4444', bg: '#FEF2F2', label: 'Refill' },
  order: { color: '#1F5C52', bg: '#F0FDF4', label: 'Order' },
  promo: { color: '#F59E0B', bg: '#FFFBEB', label: 'Offer' },
};

export default function AlertsScreen() {
  const renderItem = ({ item }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.order;
    return (
      <TouchableOpacity
        style={[styles.card, item.unread && styles.cardUnread]}
        activeOpacity={0.7}
      >
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.unread && <View style={styles.dot} />}
          </View>
          <Text style={styles.cardMessage}>{item.message}</Text>
          <Text style={styles.cardTime}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <TouchableOpacity>
          <Text style={styles.markAll}>Mark all read</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={MOCK_ALERTS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: rv(10) }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  markAll: {
    fontSize: rm(13),
    color: '#1F5C52',
    fontWeight: '500',
  },
  list: {
    padding: spacing.md,
    paddingBottom: rv(120),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    gap: rs(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardUnread: {
    borderLeftWidth: rs(3),
    borderLeftColor: '#1F5C52',
  },
  badge: {
    paddingHorizontal: rs(10),
    paddingVertical: rv(4),
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    minWidth: rs(52),
    alignItems: 'center',
  },
  badgeText: {
    fontSize: rm(11),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardBody: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rv(4),
  },
  cardTitle: {
    fontSize: rm(15),
    fontWeight: '600',
    color: '#0F172A',
  },
  dot: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
    backgroundColor: '#1F5C52',
  },
  cardMessage: {
    fontSize: rm(13),
    color: '#64748B',
    lineHeight: rv(20),
    marginBottom: rv(6),
  },
  cardTime: {
    fontSize: rm(12),
    color: '#94A3B8',
    fontWeight: '500',
  },
});
