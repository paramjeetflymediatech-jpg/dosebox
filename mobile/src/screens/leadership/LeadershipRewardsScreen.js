import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Modal, TextInput, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import Pagination from '../../components/admin/Pagination';
import { AlertService } from '../../services/AlertService';

export default function LeadershipRewardsScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [config, setConfig] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredData = data.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const userMatch = item.user?.name?.toLowerCase().includes(searchLower) || item.user?.email?.toLowerCase().includes(searchLower);
    const descMatch = item.description?.toLowerCase().includes(searchLower);
    const typeMatch = item.type?.toLowerCase().includes(searchLower);
    return userMatch || descMatch || typeMatch;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [txRes, confRes] = await Promise.all([
        api.get('/admin/token-transactions'),
        api.get('/admin/settings')
      ]);

      if (txRes.data?.success && Array.isArray(txRes.data.data)) {
        setData(txRes.data.data);
      } else {
        setData([]);
      }

      if (confRes.data?.success && Array.isArray(confRes.data.data)) {
        const settingsList = confRes.data.data;
        const signupBonus = settingsList.find(s => s.key === 'signupBonus')?.value || '';
        const referralBonus = settingsList.find(s => s.key === 'referralBonus')?.value || '';
        setConfig({ signupBonus, referralBonus });
      }
    } catch (err) {
      console.log('Error loading Rewards Data:', err);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to load Rewards' });
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

  const handleOpenConfigModal = () => {
    setFormData({
      signupBonus: config && config.signupBonus !== undefined ? String(config.signupBonus) : '',
      referralBonus: config && config.referralBonus !== undefined ? String(config.referralBonus) : '',
    });
    setModalVisible(true);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', {
        settings: [
          { key: 'signupBonus', value: formData.signupBonus },
          { key: 'referralBonus', value: formData.referralBonus }
        ]
      });
      setModalVisible(false);
      loadData();
    } catch (err) {
      console.log('Failed to save Rewards Config:', err);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to save Rewards Config' });
    } finally {
      setSaving(false);
    }
  };

  const getTypeStyle = (type) => {
    if (type === 'Earned') return { bg: '#ECFDF5', text: '#059669', border: '#D1FAE5', icon: 'arrow-up-circle' };
    if (type === 'Redeemed') return { bg: '#FFF1F2', text: '#E11D48', border: '#FFE4E6', icon: 'arrow-down-circle' };
    if (type === 'Refund') return { bg: '#FFFBEB', text: '#D97706', border: '#FEF3C7', icon: 'refresh-circle' };
    return { bg: '#F0FDF4', text: '#16A34A', border: '#DCFCE7', icon: 'gift' };
  };

  const renderItem = ({ item }) => {
    const style = getTypeStyle(item.type);
    const sign = item.type === 'Redeemed' ? '-' : '+';
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.customerName}>{item.user?.name || 'Unknown'}</Text>
            <Text style={styles.customerEmail}>{item.user?.email || 'No email'}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: style.bg, borderColor: style.border }]}>
            <Ionicons name={style.icon} size={rm(12)} color={style.text} style={{ marginRight: rs(4) }} />
            <Text style={[styles.typeText, { color: style.text }]}>{item.type || 'Unknown'}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.description} numberOfLines={2}>{item.description || 'No description'}</Text>
            </View>
            <View style={[styles.col, { alignItems: 'flex-end', flex: 0.6 }]}>
              <Text style={styles.label}>Tokens</Text>
              <Text style={styles.tokens}>{sign}{item.tokens}</Text>
              {item.bonusTokens > 0 && (
                <Text style={styles.bonusTokens}>+{item.bonusTokens} Bonus</Text>
              )}
            </View>
          </View>
          <View style={styles.dateBox}>
            <Ionicons name="time-outline" size={rm(14)} color="#94A3B8" />
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reward Points</Text>
        <View style={{ width: rm(24) }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1F5C52" />
        </View>
      ) : (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={rs(20)} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by user or description..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setCurrentPage(1);
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={rs(20)} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={paginatedData}
            keyExtractor={item => item.id ? item.id.toString() : Math.random().toString()}
            contentContainerStyle={styles.listContent}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🎁</Text>
                <Text style={styles.emptyText}>No reward transactions found.</Text>
              </View>
            }
            ListFooterComponent={
              <Pagination 
                currentPage={currentPage}
                totalItems={filteredData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            }
          />
        </>
      )}

      <TouchableOpacity style={styles.fab} onPress={handleOpenConfigModal} activeOpacity={0.8}>
        <Ionicons name="settings-outline" size={rm(24)} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Global Rewards Config</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formScroll}>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>Signup Bonus Tokens</Text>
                <TextInput
                  style={styles.input}
                  value={String(formData.signupBonus || '')}
                  onChangeText={txt => setFormData({...formData, signupBonus: txt})}
                  placeholder="e.g. 50"
                  keyboardType="numeric"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldLabel}>Referral Bonus Tokens</Text>
                <TextInput
                  style={styles.input}
                  value={String(formData.referralBonus || '')}
                  onChangeText={txt => setFormData({...formData, referralBonus: txt})}
                  placeholder="e.g. 20"
                  keyboardType="numeric"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveConfig} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Config</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: spacing.md, paddingTop: rv(12), paddingBottom: rv(14),
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backButton: { padding: rv(4) },
  backIcon: { fontSize: rm(24), color: '#0F172A', fontWeight: '300' },
  headerTitle: { fontSize: rm(20), fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: spacing.md, marginTop: rv(16), marginBottom: rv(12), paddingHorizontal: spacing.md,
    height: rv(48), borderRadius: radius.full, borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1
  },
  searchInput: { flex: 1, marginLeft: rs(8), fontSize: rm(15), color: '#0F172A', fontWeight: '500' },
  listContent: { padding: spacing.md, paddingBottom: rv(100) },
  
  card: {
    backgroundColor: '#fff', 
    borderRadius: radius.md, marginBottom: rv(12),
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F8FAFC'
  },
  customerName: { fontSize: rm(15), fontWeight: '700', color: '#0F172A' },
  customerEmail: { fontSize: rm(12), color: '#64748B', marginTop: rv(2) },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rv(10), paddingVertical: rv(4), borderRadius: radius.full, borderWidth: 1 },
  typeText: { fontSize: rm(11), fontWeight: '700', textTransform: 'uppercase' },
  
  cardBody: { padding: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rv(12) },
  col: { flex: 1 },
  label: { fontSize: rm(12), fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', marginBottom: rv(4) },
  description: { fontSize: rm(14), fontWeight: '500', color: '#334155', lineHeight: rv(20) },
  tokens: { fontSize: rm(18), fontWeight: '800', color: '#0F172A' },
  bonusTokens: { fontSize: rm(12), color: '#D97706', fontWeight: '600', marginTop: rv(2) },
  
  dateBox: { flexDirection: 'row', alignItems: 'center', gap: rs(6), backgroundColor: '#F8FAFC', padding: rv(8), borderRadius: radius.sm },
  dateText: { fontSize: rm(12), color: '#64748B', fontWeight: '500' },

  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: rv(60) },
  emptyIcon: { fontSize: rm(48), marginBottom: rv(12) },
  emptyText: { fontSize: rm(16), color: '#64748B', fontWeight: '500' },
  
  fab: {
    position: 'absolute', bottom: rv(24), right: rv(24),
    width: rv(56), height: rv(56), borderRadius: rv(28), backgroundColor: '#1F5C52',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1F5C52', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6
  },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: rm(18), fontWeight: '700', color: '#0F172A' },
  closeIcon: { fontSize: rm(20), color: '#64748B' },
  formScroll: { padding: spacing.lg },
  fieldBox: { marginBottom: rv(16) },
  fieldLabel: { fontSize: rm(13), fontWeight: '600', color: '#475569', textTransform: 'uppercase', marginBottom: rv(8) },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.md, paddingHorizontal: rv(16), paddingVertical: rv(14), fontSize: rm(15), color: '#0F172A' },
  modalFooter: { flexDirection: 'row', padding: spacing.lg, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: rv(12), paddingBottom: rv(32) },
  cancelBtn: { flex: 1, paddingVertical: rv(16), backgroundColor: '#F1F5F9', borderRadius: radius.md, alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontWeight: '600', fontSize: rm(15) },
  saveBtn: { flex: 1, paddingVertical: rv(16), backgroundColor: '#1F5C52', borderRadius: radius.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: rm(15) },
});
