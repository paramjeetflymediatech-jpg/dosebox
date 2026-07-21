import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

const C = {
  primary: '#0c888d', 
  primaryDark: '#086367',
  bg: '#F4F7FA',
  white: '#FFFFFF',
  text: '#1E293B',
  sub: '#64748B',
  border: '#E2E8F0',
  green: '#10B981',
  red: '#EF4444',
  gold: '#F59E0B'
};

export default function UserRewardsScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRewards();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRewards();
    setRefreshing(false);
  };

  const fetchRewards = async () => {
    try {
      const profileRes = await api.get('/account/profile');
      if (profileRes.data?.success) {
        setBalance(profileRes.data.data.doseboxTokens || 0);
      }

      const historyRes = await api.get('/account/rewards/history');
      if (historyRes.data?.success) {
        setHistory(historyRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load rewards:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isPositive = item.type?.toLowerCase() === 'earned' || item.type?.toLowerCase() === 'refund';
    const color = isPositive ? C.green : C.red;
    const sign = isPositive ? '+' : '-';
    const iconName = isPositive ? 'arrow-down' : 'arrow-up';
    
    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconBox, { backgroundColor: isPositive ? '#ECFDF5' : '#FEF2F2' }]}>
            <Ionicons name={iconName} size={rm(18)} color={color} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.description || item.type}</Text>
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
              })}
            </Text>
          </View>
        </View>
        <Text style={[styles.amountText, { color }]}>
          {sign}{item.tokens}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* ── HEADER BACKGROUND ── */}
      <View style={styles.headerBg}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{top:20, bottom:20, left:20, right:20}}>
              <Ionicons name="arrow-back" size={24} color={C.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Rewards</Text>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.contentWrap}>
        {/* ── FLOATING BALANCE CARD ── */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <View style={styles.balanceRow}>
            <Ionicons name="sparkles" size={rm(28)} color={C.gold} style={styles.balanceIcon} />
            <Text style={styles.balanceAmount}>{balance}</Text>
          </View>
          <Text style={styles.balanceSub}>Dosebox Tokens</Text>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Transaction History</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={history.length === 0 ? [styles.list, { flex: 1 }] : styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
            ListEmptyComponent={
              <View style={styles.center}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="gift-outline" size={rm(48)} color={C.primary} />
                </View>
                <Text style={styles.emptyTitle}>No Transactions Yet</Text>
                <Text style={styles.emptySub}>Earn Dosebox tokens by placing your first order and referring friends!</Text>
                <TouchableOpacity style={styles.earnBtn} onPress={() => navigation.navigate('Home')}>
                  <Text style={styles.earnBtnText}>Start Earning</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  headerBg: {
    backgroundColor: C.primaryDark,
    height: rv(180),
    borderBottomLeftRadius: radius.xl * 1.5,
    borderBottomRightRadius: radius.xl * 1.5,
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 1
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: rv(10),
  },
  backBtn: { padding: rs(4) },
  headerTitle: { fontSize: rm(18), fontWeight: '700', color: C.white, letterSpacing: 0.5 },
  
  contentWrap: { flex: 1, zIndex: 2, marginTop: rv(100) },
  
  balanceCard: {
    backgroundColor: C.white,
    marginHorizontal: spacing.lg,
    paddingVertical: rv(28),
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: rv(24),
  },
  balanceLabel: { color: C.sub, fontSize: rm(14), fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: rv(8) },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: rv(4) },
  balanceIcon: { marginRight: rs(8) },
  balanceAmount: { color: C.text, fontSize: rm(46), fontWeight: '800', letterSpacing: -1 },
  balanceSub: { color: '#94A3B8', fontSize: rm(13), fontWeight: '500' },
  
  listHeader: { paddingHorizontal: spacing.lg, paddingBottom: rv(16) },
  listTitle: { fontSize: rm(18), fontWeight: '800', color: C.text },
  
  list: { paddingHorizontal: spacing.lg, paddingBottom: rv(100) },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    paddingVertical: rv(16),
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    marginBottom: rv(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: rs(44), height: rs(44), borderRadius: rs(22), alignItems: 'center', justifyContent: 'center', marginRight: rs(14) },
  cardInfo: { flex: 1, paddingRight: rs(16) },
  cardTitle: { fontSize: rm(15), fontWeight: '700', color: C.text, marginBottom: rv(4) },
  dateText: { fontSize: rm(13), color: C.sub, fontWeight: '500' },
  amountText: { fontSize: rm(16), fontWeight: '800' },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, marginTop: rv(40) },
  emptyIconWrap: { width: rs(80), height: rs(80), borderRadius: rs(40), backgroundColor: '#EAF4F2', alignItems: 'center', justifyContent: 'center', marginBottom: rv(20) },
  emptyTitle: { fontSize: rm(20), fontWeight: '800', color: C.text, marginBottom: rv(10) },
  emptySub: { fontSize: rm(15), color: C.sub, textAlign: 'center', lineHeight: rv(22), paddingHorizontal: spacing.lg, marginBottom: rv(30) },
  earnBtn: { backgroundColor: C.primary, paddingHorizontal: spacing.xl, paddingVertical: rv(14), borderRadius: radius.lg, shadowColor: C.primary, shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  earnBtnText: { color: C.white, fontSize: rm(15), fontWeight: '700', letterSpacing: 0.5 },
});
