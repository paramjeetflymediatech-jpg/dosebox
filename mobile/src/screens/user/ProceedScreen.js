import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/env';
import { AlertService } from '../../services/AlertService';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import { getFullImageUrl } from '../../utils/image';

const C = {
  primary: '#1F5C52',
  primaryLight: '#EAF4F2',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  textMain: '#0F172A',
  textSub: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  blue: '#3B82F6',
  blueLight: '#EFF6FF'
};

const getStatusColor = (status) => {
  if (!status) return { bg: C.warningLight, text: C.warning };
  const s = status.toLowerCase();
  if (s === 'cancelled') return { bg: C.dangerLight, text: C.danger };
  if (s === 'delivered') return { bg: C.successLight, text: C.success };
  if (s === 'shipped' || s === 'out for delivery' || s === 'processing' || s === 'confirmed') return { bg: C.blueLight, text: C.blue };
  return { bg: C.warningLight, text: C.warning };
};

export default function ProceedScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      if (res.data.success) {
        // Sort orders by id descending (newest first)
        const sorted = (res.data.data || []).sort((a, b) => b.id - a.id);
        setOrders(sorted);
      }
    } catch {
      // show empty state
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const url = `${API_URL}/orders/${orderId}/invoice`;

      const { dirs } = ReactNativeBlobUtil.fs;
      const fileName = `Invoice_OD-${orderId}.pdf`;
      const path = Platform.OS === 'ios' ? `${dirs.DocumentDir}/${fileName}` : `${dirs.DownloadDir}/${fileName}`;

      AlertService.show({ type: 'info', title: 'Downloading', message: 'Invoice is downloading...' });

      const res = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: path,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: path,
          description: 'Downloading Invoice',
          title: fileName,
          mime: 'application/pdf',
        }
      }).fetch('GET', url, {
        Authorization: `Bearer ${token}`
      });

      if (Platform.OS === 'ios') {
        ReactNativeBlobUtil.ios.previewDocument(res.path());
      } else {
        AlertService.show({ type: 'success', title: 'Success', message: 'Invoice downloaded successfully' });
      }

    } catch (err) {
      console.log('Download error:', err);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to download invoice' });
    }
  };

  const getImg = (item) => {
    const imgUrl = item.medicine?.images || item.medicine?.image;
    return getFullImageUrl(imgUrl);
  };

  const renderItem = ({ item }) => {
    let displayStatus = item.status || 'Pending';
    if (displayStatus.toLowerCase() === 'prescription review') displayStatus = 'Pending';
    
    const cfg = getStatusColor(displayStatus);
    
    return (
      <TouchableOpacity 
        style={[styles.card, styles.shadow]} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('OrderTracking', { order: item })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.id}</Text>
            {item.createdAt && (
              <Text style={styles.orderDate}>
                {new Date(item.createdAt).toLocaleString('en-IN', {
                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
             <View style={[styles.statusDot, { backgroundColor: cfg.text }]} />
             <Text style={[styles.statusText, { color: cfg.text }]}>{displayStatus}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Ordered Product Listing */}
        <View style={styles.productList}>
          {item.items?.map((prod, index) => (
             <View key={prod.id} style={[styles.productRow, index === item.items.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 }]}>
               <View style={styles.productImgWrapper}>
                 <Image source={{ uri: getImg(prod) }} style={styles.productImg} resizeMode="contain" />
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={styles.productName} numberOfLines={1}>{prod.medicine?.name || 'Item'}</Text>
                 <Text style={styles.productQty}>Qty: {prod.quantity}</Text>
               </View>
               <Text style={styles.productTotal}>₹{Number(prod.price) * prod.quantity}</Text>
             </View>
          ))}
        </View>

        <View style={[styles.cardFooter, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', gap: rs(8) }}>
            {['Pending', 'Confirmed', 'Packed', 'Prescription Review'].includes(displayStatus) && (
              <TouchableOpacity 
                style={{ backgroundColor: C.dangerLight, paddingHorizontal: rs(12), paddingVertical: rv(6), borderRadius: 20, borderWidth: 1, borderColor: C.danger }}
                onPress={() => navigation.navigate('OrderTracking', { order: item, autoOpenCancel: true })}
              >
                <Text style={{ color: C.danger, fontWeight: 'bold', fontSize: rm(12) }}>Cancel Order</Text>
              </TouchableOpacity>
            )}
            {item.status === 'Cancelled' && item.refundStatus === 'Pending User Choice' && (
              <TouchableOpacity 
                style={{ backgroundColor: C.warning, paddingHorizontal: rs(12), paddingVertical: rv(6), borderRadius: 20, borderWidth: 1, borderColor: '#D97706' }}
                onPress={() => navigation.navigate('OrderTracking', { order: item, autoOpenClaim: true })}
              >
                <Text style={{ color: C.white, fontWeight: 'bold', fontSize: rm(12) }}>Claim Refund</Text>
              </TouchableOpacity>
            )}
            {displayStatus === 'Delivered' && (
              <TouchableOpacity 
                style={{ backgroundColor: C.successLight, paddingHorizontal: rs(12), paddingVertical: rv(6), borderRadius: 20, borderWidth: 1, borderColor: C.success }}
                onPress={() => handleDownloadInvoice(item.id)}
              >
                <Text style={{ color: C.success, fontWeight: 'bold', fontSize: rm(12) }}>Download Invoice</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.viewDetailText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={C.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name="arrow-back" size={rs(24)} color={C.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>
            Your orders will appear here once you place one.
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'ExploreTab' })}
          >
            <Text style={styles.shopBtnText}>Browse Medicines</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: rv(16) }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: spacing.md, 
    paddingVertical: rv(12), 
    backgroundColor: C.bg 
  },
  backBtn: { 
    width: rs(40), 
    height: rs(40), 
    borderRadius: 999, 
    backgroundColor: C.white, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: rs(12), 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2 
  },
  headerTitle: { 
    flex: 1, 
    fontSize: rm(22), 
    fontWeight: '800', 
    color: C.textMain, 
    letterSpacing: -0.5 
  },
  list: { padding: spacing.md, paddingBottom: rv(120) },
  
  card: { backgroundColor: C.white, borderRadius: 20, padding: spacing.lg },
  shadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: rm(16), fontWeight: '800', color: C.textMain, marginBottom: 4 },
  orderDate: { fontSize: rm(13), color: C.textSub, fontWeight: '500' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(10), paddingVertical: rv(6), borderRadius: 999 },
  statusDot: { width: rs(6), height: rs(6), borderRadius: rs(3), marginRight: rs(6) },
  statusText: { fontSize: rm(11), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  divider: { height: 1, backgroundColor: C.border, marginVertical: rv(16) },
  
  productList: { marginBottom: rv(8) },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: rv(10), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  productImgWrapper: { width: rs(48), height: rs(48), borderRadius: 10, backgroundColor: C.bg, marginRight: rs(12), padding: 4, borderWidth: 1, borderColor: C.border },
  productImg: { width: '100%', height: '100%', borderRadius: 6 },
  productName: { fontSize: rm(14), fontWeight: '700', color: C.textMain, marginBottom: 4, lineHeight: 18 },
  productQty: { fontSize: rm(12), color: C.textSub, fontWeight: '500' },
  productTotal: { fontSize: rm(15), fontWeight: '800', color: C.textMain },

  cardFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: rv(8), paddingTop: rv(16), borderTopWidth: 1, borderTopColor: C.border },
  viewDetailText: { fontSize: rm(14), color: C.primary, fontWeight: '700', marginRight: 4 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: rs(56), marginBottom: rv(16) },
  emptyTitle: { fontSize: rm(20), fontWeight: '800', color: C.textMain, marginBottom: rv(8) },
  emptySub: { fontSize: rm(14), color: C.textSub, textAlign: 'center', lineHeight: 22, marginBottom: rv(24) },
  shopBtn: { backgroundColor: C.primary, paddingHorizontal: rs(28), paddingVertical: rv(16), borderRadius: 999, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  shopBtnText: { color: C.white, fontWeight: '700', fontSize: rm(15) },
});
