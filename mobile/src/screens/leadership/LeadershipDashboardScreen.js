import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, PieChart } from 'react-native-chart-kit';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

const screenWidth = Dimensions.get('window').width;

export default function LeadershipDashboardScreen({ navigation }) {
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState(null);
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
        setCharts(res.data.data.charts);
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
          <TouchableOpacity onPress={handleLogout} style={{ padding: rv(8), backgroundColor: '#FEE2E2', borderRadius: radius.md }}>
            <Ionicons name="log-out-outline" size={rm(24)} color="#EF4444" />
          </TouchableOpacity>
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
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7', marginBottom: rv(12) }]}><Text style={styles.icon}>⭐</Text></View>
              <Text style={styles.gridValue}>{kpis?.totalTokens?.toLocaleString() || 0}</Text>
              <Text style={styles.gridTitle}>Total Loyalty Tokens</Text>
            </View>
            <View style={[styles.gridCard, { opacity: 0 }]} />
          </View>
        </View>

        {charts?.revenueChart && charts.revenueChart.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Revenue Growth (Last 6 Months)</Text>
            <LineChart
              data={{
                labels: charts.revenueChart.map(c => c.month),
                datasets: [{ data: charts.revenueChart.map(c => c.revenue || 0) }]
              }}
              width={screenWidth - spacing.md * 2}
              height={220}
              yAxisLabel="₹"
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(31, 92, 82, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#1F5C52' }
              }}
              bezier
              style={styles.chartStyle}
            />
          </View>
        )}

        {charts?.orderHealthChart && charts.orderHealthChart.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Order Health Distribution</Text>
            <PieChart
              data={charts.orderHealthChart.map((c, i) => ({
                name: c.name,
                population: c.value,
                color: ['#1F5C52', '#34D399', '#FBBF24', '#F87171'][i % 4] || '#94A3B8',
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
  chartStyle: { marginVertical: rv(8), borderRadius: 16 }
});
