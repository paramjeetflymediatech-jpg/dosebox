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
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>Total Revenue</Text>
              <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}><Text style={styles.icon}>💰</Text></View>
            </View>
            <Text style={styles.statValue}>₹{formatCurrency(kpis?.totalRevenue)}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>Total Orders</Text>
              <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}><Text style={styles.icon}>🛍️</Text></View>
            </View>
            <Text style={styles.statValue}>{kpis?.totalOrders?.toLocaleString() || 0}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>Customers</Text>
              <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}><Text style={styles.icon}>👥</Text></View>
            </View>
            <Text style={styles.statValue}>{kpis?.totalCustomers?.toLocaleString() || 0}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>Inventory Alerts</Text>
              <View style={[styles.iconBox, { backgroundColor: '#FFE4E6' }]}><Text style={styles.icon}>⚠️</Text></View>
            </View>
            <Text style={[styles.statValue, { color: '#E11D48' }]}>{kpis?.inventoryAlerts || 0} Items</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>Total Tokens</Text>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}><Text style={styles.icon}>⭐</Text></View>
            </View>
            <Text style={styles.statValue}>{kpis?.totalTokens?.toLocaleString() || 0}</Text>
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
  headerTitle: { fontSize: rm(26), fontWeight: '800', color: '#0F172A', letterSpacing: -0.5, marginBottom: rv(4) },
  headerSubtitle: { fontSize: rm(15), color: '#64748B', fontWeight: '500' },
  statsContainer: { gap: rv(16) },
  statCard: {
    backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(12) },
  statTitle: { fontSize: rm(15), fontWeight: '600', color: '#64748B' },
  iconBox: { width: rv(44), height: rv(44), borderRadius: rv(12), alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: rm(20) },
  statValue: { fontSize: rm(32), fontWeight: '800', color: '#0F172A', letterSpacing: -1 },
});
