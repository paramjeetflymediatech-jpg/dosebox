import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';

const MODULES = [
  { id: 'users', title: 'Users', icon: 'people-outline', screen: 'AdminUsers', color: '#E0F2FE', iconColor: '#0284C7' },
  { id: 'medicines', title: 'Medicines', icon: 'medkit-outline', screen: 'AdminMedicines', color: '#DCFCE7', iconColor: '#16A34A' },
  { id: 'orders', title: 'Orders', icon: 'cube-outline', screen: 'AdminOrders', color: '#FFEDD5', iconColor: '#EA580C' },
  { id: 'prescriptions', title: 'Prescriptions', icon: 'document-text-outline', screen: 'AdminPrescriptions', color: '#FCE7F3', iconColor: '#DB2777' },
  { id: 'categories', title: 'Categories', icon: 'grid-outline', screen: 'AdminCategories', color: '#F3E8FF', iconColor: '#9333EA' },
  { id: 'brands', title: 'Brands', icon: 'pricetag-outline', screen: 'AdminBrands', color: '#FEF3C7', iconColor: '#D97706' },
  { id: 'banners', title: 'Banners', icon: 'image-outline', screen: 'AdminBanners', color: '#E0E7FF', iconColor: '#4F46E5' },
  { id: 'coupons', title: 'Coupons', icon: 'ticket-outline', screen: 'AdminCoupons', color: '#FEE2E2', iconColor: '#DC2626' },
  { id: 'blogs', title: 'Blogs', icon: 'newspaper-outline', screen: 'AdminBlogs', color: '#ECFCCB', iconColor: '#65A30D' },
  { id: 'doctors', title: 'Doctors', icon: 'stethoscope-outline', screen: 'AdminDoctors', color: '#CCFBF1', iconColor: '#0D9488' },
  { id: 'appointments', title: 'Appointments', icon: 'calendar-outline', screen: 'AdminAppointments', color: '#FFE4E6', iconColor: '#E11D48' },
  { id: 'rewards', title: 'Rewards', icon: 'star-outline', screen: 'AdminRewards', color: '#FEF08A', iconColor: '#CA8A04' },
  { id: 'transactions', title: 'Transactions', icon: 'card-outline', screen: 'AdminTransactions', color: '#D1FAE5', iconColor: '#059669' },
  { id: 'suppliers', title: 'Suppliers', icon: 'business-outline', screen: 'AdminSuppliers', color: '#E2E8F0', iconColor: '#475569' },
  { id: 'faqs', title: 'FAQs', icon: 'help-circle-outline', screen: 'AdminFAQs', color: '#DBEAFE', iconColor: '#2563EB' },
  { id: 'seo', title: 'SEO', icon: 'search-outline', screen: 'AdminSEO', color: '#FDE68A', iconColor: '#D97706' },
  { id: 'dataDeletion', title: 'Data Deletion', icon: 'trash-outline', screen: 'AdminDataDeletion', color: '#FEE2E2', iconColor: '#E11D48' },
  { id: 'enterprise', title: 'Enterprise Profile', icon: 'business-outline', screen: 'AdminEnterprise', color: '#E0F2FE', iconColor: '#0369A1' },
];

export default function AdminModulesScreen({ navigation }) {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCounts = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data?.success) {
        setCounts(res.data.data);
      }
    } catch (err) {
      console.log('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCounts();
    setRefreshing(false);
  };

  useEffect(() => {
    // Refresh stats when the screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCounts();
    });

    fetchCounts();
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Modules</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1F5C52']} />}
      >
        <Text style={styles.sectionTitle}>Manage Platform</Text>
        <View style={styles.listContainer}>
          {MODULES.map(mod => {
            const count = counts[mod.id] !== undefined ? counts[mod.id] : 0;
            return (
              <TouchableOpacity
                key={mod.id}
                style={styles.listItem}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(mod.screen)}
              >
                <View style={[styles.iconBox, { backgroundColor: mod.color }]}>
                  <Ionicons name={mod.icon} size={rs(22)} color={mod.iconColor} />
                </View>

                <View style={styles.textContainer}>
                  <Text style={styles.itemTitle}>{mod.title}</Text>
                  {loading ? (
                    <ActivityIndicator size="small" color="#94A3B8" style={{ alignSelf: 'flex-start' }} />
                  ) : (
                    <Text style={styles.itemCount}>
                      {mod.id === 'enterprise' || mod.id === 'seo' || mod.id === 'dataDeletion'
                        ? 'Configure'
                        : `${count} item${count !== 1 ? 's' : ''}`}
                    </Text>
                  )}
                </View>

                <Ionicons name="chevron-forward" size={rs(20)} color="#CBD5E1" />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
  backButton: { padding: rv(4) },
  backIcon: { fontSize: rm(24), color: '#0F172A', fontWeight: '300' },
  headerTitle: { fontSize: rm(20), fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  content: { padding: spacing.md, paddingBottom: rv(100) },
  sectionTitle: { fontSize: rm(16), fontWeight: '600', color: '#64748B', marginBottom: rv(16) },
  listContainer: { flexDirection: 'column', gap: rv(12) },
  listItem: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1
  },
  iconBox: { width: rv(48), height: rv(48), borderRadius: rv(24), alignItems: 'center', justifyContent: 'center', marginRight: rv(16) },
  textContainer: { flex: 1, justifyContent: 'center' },
  itemTitle: { fontSize: rm(16), fontWeight: '600', color: '#0F172A', marginBottom: rv(4) },
  itemCount: { fontSize: rm(13), fontWeight: '500', color: '#64748B' },
});
