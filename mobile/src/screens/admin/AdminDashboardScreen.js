import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

export default function AdminDashboardScreen({ navigation }) {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  const loadData = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));

      const res = await api.get('/admin/dashboard');
      if (res.data?.success) {
        setKpis(res.data.data.kpis);
      }
    } catch (err) {
      console.log('Failed to fetch admin stats:', err);
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

  const formatCurrency = (value) => {
    if (!value) return '0';
    return value.toLocaleString('en-IN');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1F5C52" />
        <Text style={styles.loadingText}>Loading Admin Suite...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1F5C52']} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard Overview</Text>
          <Text style={styles.headerSubtitle}>Welcome back, {user?.name || 'Admin'}</Text>
        </View>

        <View style={styles.statsContainer}>
          {/* Full Width Revenue Card */}
          <View style={[styles.statCard, { width: '100%', backgroundColor: '#1F5C52', borderColor: '#1F5C52' }]}>
            <View style={styles.statHeader}>
              <View>
                <Text style={[styles.statTitle, { color: '#D1FAE5' }]}>Total Revenue</Text>
                <Text style={[styles.statValue, { color: '#fff', fontSize: rm(36) }]}>₹{formatCurrency(kpis?.totalRevenue)}</Text>
              </View>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}><Text style={styles.icon}>💸</Text></View>
            </View>
          </View>

          {/* 2-Column Grid for other stats */}
          <View style={styles.gridRow}>
            <View style={styles.gridCard}>
              <View style={[styles.iconBox, { backgroundColor: '#DBEAFE', marginBottom: rv(12) }]}><Text style={styles.icon}>🛍️</Text></View>
              <Text style={styles.gridValue}>{kpis?.totalOrders?.toLocaleString() || 0}</Text>
              <Text style={styles.gridTitle}>Total Orders</Text>
            </View>

            <View style={styles.gridCard}>
              <View style={[styles.iconBox, { backgroundColor: '#F3E8FF', marginBottom: rv(12) }]}><Text style={styles.icon}>👥</Text></View>
              <Text style={styles.gridValue}>{kpis?.totalCustomers?.toLocaleString() || 0}</Text>
              <Text style={styles.gridTitle}>Customers</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCard}>
              <View style={[styles.iconBox, { backgroundColor: '#FFE4E6', marginBottom: rv(12) }]}><Text style={styles.icon}>⚠️</Text></View>
              <Text style={[styles.gridValue, { color: '#E11D48' }]}>{kpis?.inventoryAlerts || 0}</Text>
              <Text style={styles.gridTitle}>Inventory Alerts</Text>
            </View>

            <View style={styles.gridCard}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7', marginBottom: rv(12) }]}><Text style={styles.icon}>⭐</Text></View>
              <Text style={styles.gridValue}>{kpis?.totalTokens?.toLocaleString() || 0}</Text>
              <Text style={styles.gridTitle}>Total Tokens</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: rv(12), color: '#64748B', fontSize: rm(15), fontWeight: '500' },
  content: { padding: spacing.md, paddingBottom: rv(100) },
  header: { marginBottom: rv(24), marginTop: rv(8) },
  headerTitle: { fontSize: rm(28), fontWeight: '900', color: '#0F172A', letterSpacing: -1, marginBottom: rv(4) },
  headerSubtitle: { fontSize: rm(15), color: '#64748B', fontWeight: '500' },
  statsContainer: { gap: rv(16) },
  statCard: {
    backgroundColor: '#fff', borderRadius: radius.xl + 4, padding: spacing.xl,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 8,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statTitle: { fontSize: rm(14), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B', marginBottom: rv(6) },
  statValue: { fontSize: rm(32), fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  iconBox: { width: rv(48), height: rv(48), borderRadius: rv(16), alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: rm(22) },
  
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', gap: rv(16) },
  gridCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: radius.xl + 4, padding: spacing.lg,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  gridValue: { fontSize: rm(26), fontWeight: '900', color: '#0F172A', letterSpacing: -0.5, marginBottom: rv(4) },
  gridTitle: { fontSize: rm(13), fontWeight: '600', color: '#64748B' },
});
