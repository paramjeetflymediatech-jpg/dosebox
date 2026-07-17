import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

export default function UserAddressesScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/account/addresses');
      if (res.data?.success) {
        setAddresses(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title || 'Address'}</Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <Text style={styles.addressText}>{item.street}</Text>
        <Text style={styles.addressText}>{item.city}, {item.state} {item.zipCode}</Text>
        {item.country ? <Text style={styles.addressText}>{item.country}</Text> : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{top:20, bottom:20, left:20, right:20}}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Addresses</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1F5C52" />
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyTitle}>No Addresses Found</Text>
          <Text style={styles.emptySub}>You haven't saved any delivery addresses yet.</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: rv(12) }} />}
        />
      )}
      
      {/* We can add a floating action button to add a new address later */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: rv(16),
    paddingBottom: rv(12),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { marginRight: rs(16), padding: rs(4) },
  backIcon: { fontSize: rm(24), color: '#0F172A', fontWeight: '400' },
  headerTitle: { fontSize: rm(20), fontWeight: '700', color: '#0F172A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  list: { padding: spacing.md, paddingBottom: rv(100) },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(8) },
  cardTitle: { fontSize: rm(16), fontWeight: '700', color: '#1E293B' },
  defaultBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: rs(10), paddingVertical: rv(4), borderRadius: radius.sm, borderWidth: 1, borderColor: '#DCFCE7' },
  defaultText: { fontSize: rm(12), fontWeight: '600', color: '#16A34A' },
  addressText: { fontSize: rm(14), color: '#475569', marginBottom: rv(4), lineHeight: rv(20) },
  emptyIcon: { fontSize: rm(48), marginBottom: rv(16) },
  emptyTitle: { fontSize: rm(18), fontWeight: '700', color: '#1E293B', marginBottom: rv(8) },
  emptySub: { fontSize: rm(14), color: '#64748B', textAlign: 'center', marginBottom: rv(24) },
});
