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

const SECTIONS = [
  {
    title: 'Core Business',
    subtitle: 'Everyday operations & user roles',
    moduleIds: ['orders', 'prescriptions', 'users', 'transactions', 'appointments']
  },
  {
    title: 'Catalog & Stock',
    subtitle: 'Inventory, brands, and suppliers',
    moduleIds: ['medicines', 'categories', 'brands', 'suppliers']
  },
  {
    title: 'Marketing & Support',
    subtitle: 'Blogs, banners, coupons, and FAQs',
    moduleIds: ['blogs', 'banners', 'coupons', 'doctors', 'faqs', 'rewards']
  },
  {
    title: 'Settings & Compliance',
    subtitle: 'System optimization & configuration',
    moduleIds: ['enterprise', 'seo', 'dataDeletion']
  }
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
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCounts();
    });

    fetchCounts();
    return unsubscribe;
  }, [navigation]);

  const renderModuleCard = (modId) => {
    const mod = MODULES.find(m => m.id === modId);
    if (!mod) return null;
    const count = counts[mod.id] !== undefined ? counts[mod.id] : 0;
    
    return (
      <TouchableOpacity
        key={mod.id}
        style={styles.gridCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate(mod.screen)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: mod.color }]}>
            <Ionicons name={mod.icon} size={rs(20)} color={mod.iconColor} />
          </View>
          <Ionicons name="arrow-forward-circle-outline" size={rs(20)} color="#CBD5E1" />
        </View>

        <Text style={styles.itemTitle} numberOfLines={1}>{mod.title}</Text>
        
        {loading ? (
          <ActivityIndicator size="small" color="#94A3B8" style={{ alignSelf: 'flex-start', marginTop: rv(4) }} />
        ) : (
          <Text style={styles.itemCount}>
            {mod.id === 'enterprise' || mod.id === 'seo' || mod.id === 'dataDeletion'
              ? 'Configure'
              : `${count} item${count !== 1 ? 's' : ''}`}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

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
        {SECTIONS.map((sec, idx) => (
          <View key={idx} style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIndicator} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>{sec.title}</Text>
                <Text style={styles.sectionSubtitle}>{sec.subtitle}</Text>
              </View>
            </View>
            
            <View style={styles.gridRow}>
              {sec.moduleIds.map(modId => renderModuleCard(modId))}
            </View>
          </View>
        ))}
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
  
  sectionContainer: { marginBottom: rv(24) },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: rv(12), gap: rs(8) },
  sectionIndicator: { width: rs(4), height: rv(24), backgroundColor: '#1F5C52', borderRadius: radius.full },
  sectionTitle: { fontSize: rm(16), fontWeight: '800', color: '#0F172A' },
  sectionSubtitle: { fontSize: rm(12), color: '#64748B', marginTop: rv(1) },
  
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: rv(10) },
  gridCard: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(12) },
  iconBox: { width: rv(40), height: rv(40), borderRadius: rv(12), alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: rm(14), fontWeight: '700', color: '#0F172A', marginBottom: rv(2) },
  itemCount: { fontSize: rm(12), fontWeight: '600', color: '#64748B' },
});
