import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
          <TouchableOpacity 
            style={[styles.statCard, { width: '100%', backgroundColor: '#0284C7', borderColor: '#0369A1' }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminOrders')}
          >
            <View style={styles.statHeader}>
              <View>
                <Text style={[styles.statTitle, { color: '#E0F2FE' }]}>Total Revenue</Text>
                <Text style={[styles.statValue, { color: '#fff', fontSize: rm(36) }]}>₹{formatCurrency(kpis?.totalRevenue)}</Text>
              </View>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="wallet-outline" size={rm(24)} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>

          {/* 2-Column Grid for other stats */}
          <View style={styles.gridRow}>
            <TouchableOpacity 
              style={styles.gridCard} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AdminOrders')}
            >
              <View style={styles.gridCardHeader}>
                <View style={[styles.iconBoxSmall, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="cart-outline" size={rm(18)} color="#2563EB" />
                </View>
                <Ionicons name="chevron-forward" size={rm(16)} color="#94A3B8" />
              </View>
              <Text style={styles.gridValue}>{kpis?.totalOrders?.toLocaleString() || 0}</Text>
              <Text style={styles.gridTitle}>Total Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridCard} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AdminUsers')}
            >
              <View style={styles.gridCardHeader}>
                <View style={[styles.iconBoxSmall, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="people-outline" size={rm(18)} color="#9333EA" />
                </View>
                <Ionicons name="chevron-forward" size={rm(16)} color="#94A3B8" />
              </View>
              <Text style={styles.gridValue}>{kpis?.totalCustomers?.toLocaleString() || 0}</Text>
              <Text style={styles.gridTitle}>Customers</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            <TouchableOpacity 
              style={styles.gridCard} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AdminMedicines')}
            >
              <View style={styles.gridCardHeader}>
                <View style={[styles.iconBoxSmall, { backgroundColor: '#FFE4E6' }]}>
                  <Ionicons name="alert-circle-outline" size={rm(18)} color="#E11D48" />
                </View>
                <Ionicons name="chevron-forward" size={rm(16)} color="#94A3B8" />
              </View>
              <Text style={[styles.gridValue, { color: '#E11D48' }]}>{kpis?.inventoryAlerts || 0}</Text>
              <Text style={styles.gridTitle}>Inventory Alerts</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridCard} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AdminRewards')}
            >
              <View style={styles.gridCardHeader}>
                <View style={[styles.iconBoxSmall, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="star-outline" size={rm(18)} color="#D97706" />
                </View>
                <Ionicons name="chevron-forward" size={rm(16)} color="#94A3B8" />
              </View>
              <Text style={styles.gridValue}>{kpis?.totalTokens?.toLocaleString() || 0}</Text>
              <Text style={styles.gridTitle}>Total Tokens</Text>
            </TouchableOpacity>
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
    shadowColor: '#0369A1', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statTitle: { fontSize: rm(13), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B', marginBottom: rv(6) },
  statValue: { fontSize: rm(34), fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  iconBox: { width: rv(48), height: rv(48), borderRadius: rv(16), alignItems: 'center', justifyContent: 'center' },
  iconBoxSmall: { width: rv(36), height: rv(36), borderRadius: rv(10), alignItems: 'center', justifyContent: 'center' },
  
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', gap: rv(16) },
  gridCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.lg,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    borderWidth: 1, borderColor: '#E2E8F0'
  },
  gridCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(16) },
  gridValue: { fontSize: rm(24), fontWeight: '800', color: '#0F172A', letterSpacing: -0.5, marginBottom: rv(4) },
  gridTitle: { fontSize: rm(13), fontWeight: '600', color: '#64748B' },
});
