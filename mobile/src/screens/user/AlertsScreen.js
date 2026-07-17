import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import api from '../../services/api';

const TYPE_CONFIG = {
  refill: { color: '#EF4444', bg: '#FEF2F2', label: 'Refill' },
  order: { color: '#1F5C52', bg: '#F0FDF4', label: 'Order' },
  promo: { color: '#F59E0B', bg: '#FFFBEB', label: 'Offer' },
};

export default function AlertsScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/account/alerts');
      if (res.data?.success) {
        setAlerts(res.data.data || []);
      }
    } catch (e) {
      console.log('Failed to fetch alerts', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const markAllRead = async () => {
    try {
      const res = await api.put('/account/alerts');
      if (res.data?.success) {
        setAlerts(alerts.map(a => ({ ...a, read: true })));
      }
    } catch (e) {
      console.log('Failed to mark alerts as read', e);
    }
  };

  const handlePress = async (item) => {
    if (!item.read) {
      try {
        await api.put('/account/alerts', { alertId: item.id });
        setAlerts(alerts.map(a => a.id === item.id ? { ...a, read: true } : a));
      } catch (e) {}
    }

    const orderMatch = item.message.match(/#OD-(\d+)/);
    if (orderMatch) {
      navigation.navigate('OrderTracking', { order: { id: parseInt(orderMatch[1]) } });
    }
  };

  const renderItem = ({ item }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.order;
    const isUnread = !item.read;
    const timeText = new Date(item.createdAt).toLocaleDateString();

    return (
      <TouchableOpacity
        style={[styles.card, isUnread && styles.cardUnread]}
        activeOpacity={0.7}
        onPress={() => handlePress(item)}
      >
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {isUnread && <View style={styles.dot} />}
          </View>
          <Text style={styles.cardMessage}>{item.message}</Text>
          <Text style={styles.cardTime}>{timeText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markAll}>Mark all read</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#1F5C52" />
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: rv(10) }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1F5C52" />}
          ListEmptyComponent={
            <Text style={{textAlign: 'center', color: '#94A3B8', marginTop: 50}}>No alerts found</Text>
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
