import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import { AlertService } from '../../services/AlertService';
import { getFullImageUrl } from '../../utils/image';

const C = {
  primary: '#1F5C52',
  primaryLight: '#EAF4F2',
  secondary: '#F59E0B',
  white: '#FFFFFF',
  bg: '#F8FAFC',
  text: '#0F172A',
  sub: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  danger: '#EF4444',
};

export default function ContentReviewScreen({ navigation }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchReviewMedicines();
    }, [])
  );

  const fetchReviewMedicines = async () => {
    setLoading(true);
    try {
      // Fetch medicines that are 'Draft' or 'Under Review'
      const res = await api.get('/medicines?contentStatus=Under Review');
      if (res.data?.success) {
        setMedicines(res.data.data);
      }
    } catch (err) {
      console.log('Error fetching review medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (medicine) => {
    Alert.alert(
      "Approve Content",
      `Are you sure you want to approve content for ${medicine.name}? Your name and DMC number will be publicly associated with this content.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Approve", 
          style: "default",
          onPress: () => submitApproval(medicine.id) 
        }
      ]
    );
  };

  const submitApproval = async (id) => {
    setApproving(id);
    try {
      // Get the doctor's details from AsyncStorage
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const verifierName = user?.name ? `Dr. ${user.name}` : 'Dr. Pharmacist';
      const verifierRegNo = 'DMC-' + (user?.id || '0000'); 

      const res = await api.put(`/medicines/${id}`, {
        contentStatus: 'Approved',
        verifierName: verifierName,
        verifierRegNo: verifierRegNo,
        lastReviewedAt: new Date().toISOString()
      });

      if (res.data?.success) {
        AlertService.show({ type: 'success', title: 'Approved', message: 'Content has been verified.' });
        fetchReviewMedicines();
      }
    } catch (err) {
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to approve content.' });
    } finally {
      setApproving(null);
    }
  };

  const renderItem = ({ item }) => {
    let images = [];
    try { images = JSON.parse(item.images || '[]'); } catch (e) {}
    const imgUri = getFullImageUrl(images[0]);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={imgUri ? { uri: imgUri } : require('../../assets/images/Media.jpg')} style={styles.image} />
          <View style={styles.headerInfo}>
            <Text style={styles.medName}>{item.name}</Text>
            <Text style={styles.medComposition}>{item.composition}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{item.contentStatus}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentPreview}>
          <Text style={styles.sectionTitle}>AI Generated Description:</Text>
          <Text style={styles.sectionText} numberOfLines={3}>
            {item.description || 'No description provided.'}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => {}}>
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.approveBtn} 
            onPress={() => handleApprove(item)}
            disabled={approving === item.id}
          >
            {approving === item.id ? (
              <ActivityIndicator size="small" color={C.white} />
            ) : (
              <Text style={styles.approveText}>Approve & Publish</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Content QC Hub</Text>
        <Text style={styles.headerSubtitle}>Review AI-generated medical content</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : medicines.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="checkmark-done-circle-outline" size={rs(64)} color={C.sub} style={{ marginBottom: rv(16) }} />
          <Text style={styles.emptyText}>All Caught Up!</Text>
          <Text style={styles.emptySubText}>No medicines are currently under review.</Text>
        </View>
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { padding: spacing.lg, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: rm(20), fontWeight: '700', color: C.text, marginBottom: rv(4) },
  headerSubtitle: { fontSize: rm(13), color: C.sub },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { fontSize: rm(18), fontWeight: '700', color: C.text, marginBottom: rv(8) },
  emptySubText: { fontSize: rm(14), color: C.sub, textAlign: 'center' },
  list: { padding: spacing.md, paddingBottom: rv(100) },
  card: { backgroundColor: C.white, borderRadius: radius.lg, padding: spacing.md, marginBottom: rv(16), borderWidth: 1, borderColor: C.border },
  cardHeader: { flexDirection: 'row', marginBottom: rv(12) },
  image: { width: rs(60), height: rs(60), borderRadius: radius.sm, borderWidth: 1, borderColor: C.border },
  headerInfo: { flex: 1, marginLeft: rs(12), justifyContent: 'center' },
  medName: { fontSize: rm(16), fontWeight: '700', color: C.text, marginBottom: rv(2) },
  medComposition: { fontSize: rm(12), color: C.sub, marginBottom: rv(6) },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: '#FEF3C7', paddingHorizontal: rs(8), paddingVertical: rv(4), borderRadius: radius.full },
  statusText: { fontSize: rm(10), fontWeight: '700', color: '#B45309' },
  contentPreview: { backgroundColor: C.bg, padding: spacing.sm, borderRadius: radius.md, marginBottom: rv(16) },
  sectionTitle: { fontSize: rm(12), fontWeight: '700', color: C.text, marginBottom: rv(4) },
  sectionText: { fontSize: rm(13), color: C.sub, lineHeight: rv(18) },
  actionRow: { flexDirection: 'row', gap: rs(12) },
  rejectBtn: { flex: 1, paddingVertical: rv(12), borderRadius: radius.md, borderWidth: 1, borderColor: C.danger, alignItems: 'center' },
  rejectText: { color: C.danger, fontWeight: '700', fontSize: rm(14) },
  approveBtn: { flex: 2, paddingVertical: rv(12), borderRadius: radius.md, backgroundColor: C.success, alignItems: 'center' },
  approveText: { color: C.white, fontWeight: '700', fontSize: rm(14) },
});
