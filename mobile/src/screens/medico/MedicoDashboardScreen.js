import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart, BarChart } from 'react-native-chart-kit';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

const screenWidth = Dimensions.get('window').width;

export default function MedicoDashboardScreen({ navigation }) {
  const [kpis, setKpis] = useState(null);
  const [medicoStats, setMedicoStats] = useState(null);
  const [topMedicines, setTopMedicines] = useState([]);
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
        setMedicoStats(res.data.data.medicoStats);
        setTopMedicines(res.data.data.topSellingMedicines || []);
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

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('refreshToken');
          await AsyncStorage.removeItem('user');
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'GuestTabs' }],
            })
          );
      }}
    ]);
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
        <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View>
            <Text style={styles.headerTitle}>Dashboard Overview</Text>
            <Text style={styles.headerSubtitle}>Welcome back, {user?.name || 'Admin'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MedicoProfile')} style={{ padding: rv(8), backgroundColor: '#EAF4F2', borderRadius: radius.md }} activeOpacity={0.8}>
            <Ionicons name="person-outline" size={rm(24)} color="#1F5C52" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          {/* Full Width Orders Card */}
          <TouchableOpacity 
            style={[styles.statCard, { width: '100%', backgroundColor: '#1F5C52', borderColor: '#1F5C52' }]}
            onPress={() => navigation.navigate('OrdersTab')}
            activeOpacity={0.9}
          >
            <View style={styles.statHeader}>
              <View>
                <Text style={[styles.statTitle, { color: '#D1FAE5' }]}>Total Orders</Text>
                <Text style={[styles.statValue, { color: '#fff', fontSize: rm(36) }]}>{kpis?.totalOrders?.toLocaleString() || 0}</Text>
              </View>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}><Text style={styles.icon}>🛍️</Text></View>
            </View>
          </TouchableOpacity>

          {/* Grid for Inventory */}
          <View style={styles.gridRow}>
            <TouchableOpacity 
              style={[styles.gridCard, { borderColor: '#FECDD3', flex: 1 }]}
              onPress={() => navigation.navigate('MedicinesTab')}
              activeOpacity={0.9}
            >
              <View style={[styles.iconBox, { backgroundColor: '#FFE4E6', marginBottom: rv(12) }]}><Text style={styles.icon}>⚠️</Text></View>
              <Text style={[styles.gridValue, { color: '#E11D48' }]}>{kpis?.inventoryAlerts || 0}</Text>
              <Text style={styles.gridTitle}>Inventory Alerts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {medicoStats?.prescriptionChart && medicoStats.prescriptionChart.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Prescription Review Status</Text>
            <PieChart
              data={medicoStats.prescriptionChart.map((c, i) => ({
                name: c.name,
                population: c.value,
                color: ['#F59E0B', '#10B981', '#EF4444', '#6366F1'][i % 4] || '#9CA3AF',
                legendFontColor: '#64748B',
                legendFontSize: 12
              }))}
              width={screenWidth - spacing.md * 2}
              height={200}
              chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
          </View>
        )}

        {medicoStats?.catalogChart && medicoStats.catalogChart.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Catalog Content Status</Text>
            <BarChart
              data={{
                labels: medicoStats.catalogChart.map(c => c.name),
                datasets: [{ data: medicoStats.catalogChart.map(c => c.value || 0) }]
              }}
              width={screenWidth - spacing.md * 2 - 20}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                barPercentage: 0.6,
              }}
              style={styles.chartStyle}
            />
          </View>
        )}

        {topMedicines.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Top Monitored Medicines</Text>
            {topMedicines.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemSubtitle}>{item.manufacturer || 'N/A'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.itemPrice}>₹{item.price}</Text>
                  <Text style={[styles.itemStock, { color: item.stock < 10 ? '#E11D48' : '#10B981' }]}>
                    Stock: {item.stock}
                  </Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('MedicinesTab')}>
              <Text style={styles.viewAllText}>Manage Inventory →</Text>
            </TouchableOpacity>
          </View>
        )}
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
  chartContainer: { 
    marginTop: rv(24), backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.md,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  chartTitle: { fontSize: rm(16), fontWeight: '700', color: '#0F172A', marginBottom: rv(16), paddingHorizontal: rs(8) },
  chartStyle: { marginVertical: rv(8), borderRadius: 16 },
  listContainer: { marginTop: rv(24), marginBottom: rv(16) },
  listTitle: { fontSize: rm(18), fontWeight: '800', color: '#0F172A', marginBottom: rv(12), marginLeft: rs(4) },
  listItem: {
    backgroundColor: '#fff', padding: spacing.md, borderRadius: radius.lg, marginBottom: rv(8),
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  itemTitle: { fontSize: rm(14), fontWeight: '700', color: '#1E293B', marginBottom: rv(2) },
  itemSubtitle: { fontSize: rm(12), color: '#64748B' },
  itemPrice: { fontSize: rm(14), fontWeight: '700', color: '#0F172A' },
  itemStock: { fontSize: rm(12), fontWeight: '600', marginTop: rv(2) },
  viewAllBtn: { marginTop: rv(8), alignSelf: 'center', paddingVertical: rv(8), paddingHorizontal: rs(16), backgroundColor: '#E0F2FE', borderRadius: radius.md },
  viewAllText: { color: '#0284C7', fontWeight: '700', fontSize: rm(13) },
});
