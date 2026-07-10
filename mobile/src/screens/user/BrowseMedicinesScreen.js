import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';



export default function BrowseMedicinesScreen({ navigation, route }) {
  const initialSearch = route?.params?.search || '';
  const [search, setSearch] = useState(initialSearch);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToCart, totalQty } = useCart();

  useEffect(() => {
    // Debounce search slightly or just fetch on change.
    const delayDebounceFn = setTimeout(() => {
      fetchMedicines(search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchMedicines = async (query) => {
    setLoading(true);
    try {
      const res = await api.get(`/medicines?search=${encodeURIComponent(query)}`);
      if (res.data?.success) {
        setMedicines(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicines..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1F5C52" />
        </View>
      ) : medicines.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No medicines found.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {medicines.map((med) => (
            <View key={med.id} style={styles.card}>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDesc}>{med.composition || 'Medicine'}</Text>
              </View>
              <View style={styles.medAction}>
                <Text style={styles.medPrice}>₹{med.price}</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(med)}>
                  <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Footer CTA */}
      {totalQty > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('CartCheckout')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>View Cart ({totalQty} item{totalQty !== 1 ? 's' : ''})</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingTop: rv(12),
    paddingBottom: rv(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: rv(12),
  },
  headerTitle: {
    fontSize: rm(22),
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: rv(46),
  },
  searchIcon: { fontSize: rs(16), marginRight: rs(10) },
  searchInput: {
    flex: 1,
    fontSize: rm(15),
    color: '#0F172A',
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: rv(12),
    paddingBottom: rv(120),
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: rv(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  medInfo: { flex: 1 },
  medName: {
    fontSize: rm(15),
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: rv(4),
  },
  medDesc: { fontSize: rm(13), color: '#64748B' },
  medAction: { alignItems: 'flex-end' },
  medPrice: {
    fontSize: rm(15),
    fontWeight: '700',
    color: '#1F5C52',
    marginBottom: rv(8),
  },
  addBtn: {
    backgroundColor: '#EAF4F2',
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontSize: rm(20), color: '#1F5C52', fontWeight: '600' },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: rv(14),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  primaryBtn: {
    backgroundColor: '#1F5C52',
    paddingVertical: rv(16),
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: rm(16),
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: rm(15),
    color: '#94A3B8',
  },
});
