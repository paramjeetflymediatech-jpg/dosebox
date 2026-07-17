import React, { useState, useEffect } from 'react';
import { CommonActions } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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

const getRichTimeline = (order, timeline) => {
  const steps = [
    'Order Placed',
    'Pharmacy Confirmed',
    'Medicine Packed',
    'Cold Chain Packed',
    'Picked by Courier',
    'Reached Hub',
    'Out for Delivery',
    'Delivered'
  ];

  let maxCompletedIndex = 0;
  if (order.status === 'Confirmed') maxCompletedIndex = Math.max(maxCompletedIndex, 1);
  if (order.status === 'Packed') maxCompletedIndex = Math.max(maxCompletedIndex, 3);
  if (order.status === 'Shipped') maxCompletedIndex = Math.max(maxCompletedIndex, 4);
  if (order.status === 'Out For Delivery') maxCompletedIndex = Math.max(maxCompletedIndex, 6);
  if (order.status === 'Delivered') maxCompletedIndex = 7;

  const timelineDescList = timeline.map(t => (t.desc + ' ' + t.status).toLowerCase());
  if (timelineDescList.some(d => d.includes('cold chain packed'))) maxCompletedIndex = Math.max(maxCompletedIndex, 3);
  if (timelineDescList.some(d => d.includes('picked by courier'))) maxCompletedIndex = Math.max(maxCompletedIndex, 4);
  if (timelineDescList.some(d => d.includes('reached hub'))) maxCompletedIndex = Math.max(maxCompletedIndex, 5);
  if (timelineDescList.some(d => d.includes('out for delivery'))) maxCompletedIndex = Math.max(maxCompletedIndex, 6);

  return steps.map((step, index) => {
    const explicitEvent = timeline.find(t => 
       (t.desc && t.desc.toLowerCase().includes(step.toLowerCase())) || 
       (t.status && t.status.toLowerCase().includes(step.toLowerCase()))
    );

    let isCompleted = index <= maxCompletedIndex || !!explicitEvent;
    if (order.status === 'Cancelled') isCompleted = false;
    let time = explicitEvent ? explicitEvent.time : null;
    let desc = explicitEvent ? explicitEvent.desc : '';

    if (index === 0 && !time) time = order.createdAt;
    if (desc === step) desc = '';

    return { step, isCompleted, time, desc, isActive: index === maxCompletedIndex && order.status !== 'Cancelled' };
  });
};

export default function OrderTrackingScreen({ route, navigation }) {
  const [order, setOrder] = useState(route?.params?.order || null);
  const insets = useSafeAreaInsets();
  
  const [liveTracking, setLiveTracking] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('bank');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [isClaimMode, setIsClaimMode] = useState(false);
  const [tokenRefundCount, setTokenRefundCount] = useState(0);

  useEffect(() => {
    if (!order) {
      Alert.alert('Error', 'No order details available.');
      navigation.goBack();
      return;
    }

    api.get('/orders').then(res => {
      if (res.data?.success) {
        const updated = res.data.data.find(o => o.id === order.id);
        if (updated) setOrder(updated);
      }
    });

    api.get('/account/profile').then(res => {
      if (res.data?.success) setTokenRefundCount(res.data.data.tokenRefundCount || 0);
    });

    if (order.trackingId && order.status !== 'Cancelled') {
      setLoadingTracking(true);
      api.get(`/orders/${order.id}/track`).then(res => {
        if (res.data?.success && res.data.data) setLiveTracking(res.data.data);
      }).finally(() => setLoadingTracking(false));
    }
  }, [order?.id]);

  if (!order) return <View style={styles.container} />;

  let timeline = [];
  try { timeline = JSON.parse(order.trackingTimeline || '[]'); } catch(e){}
  const richTimeline = getRichTimeline(order, timeline);

  const handleOpenCancel = (isClaim = false) => {
    setIsClaimMode(isClaim);
    setCancelReason('');
    const codLimitReached = !isClaim && order.paymentMethod === 'COD' && tokenRefundCount >= 2;
    setRefundMethod(order.paymentMethod === 'COD' && !codLimitReached ? 'tokens' : 'bank');
    setCancelModalOpen(true);
  };

  const submitCancel = async () => {
    if (!isClaimMode && !cancelReason.trim()) {
      Alert.alert('Error', 'Please provide a reason');
      return;
    }
    setIsSubmittingCancel(true);
    try {
      const endpoint = isClaimMode ? `/orders/${order.id}/claim-refund` : `/orders/${order.id}/cancel`;
      const res = await api.post(endpoint, {
        refundMethod,
        cancelReason: isClaimMode ? undefined : cancelReason
      });
      if (res.data?.success) {
        Alert.alert('Success', isClaimMode ? 'Refund claimed!' : 'Order cancelled!');
        setCancelModalOpen(false);
        const refresh = await api.get('/orders');
        if (refresh.data?.success) {
          const updated = refresh.data.data.find(o => o.id === order.id);
          if (updated) setOrder(updated);
        }
      } else {
        Alert.alert('Failed', res.data?.message || 'Action failed');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Error occurred');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const showCancelButton = ['Pending', 'Confirmed', 'Packed', 'Prescription Review'].includes(order.status);
  const showClaimButton = order.status === 'Cancelled' && order.refundStatus === 'Pending User Choice';
  const isCOD = order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery';
  const hideTokensForCOD = !isClaimMode && isCOD && tokenRefundCount >= 2;

  const getImg = (item) => {
    const imgUrl = item.medicine?.images || item.medicine?.image;
    return getFullImageUrl(imgUrl);
  };

  const getStatusColor = (status) => {
    if (status === 'Cancelled') return { bg: C.dangerLight, text: C.danger };
    if (status === 'Delivered') return { bg: C.successLight, text: C.success };
    if (status === 'Shipped' || status === 'Out For Delivery') return { bg: C.blueLight, text: C.blue };
    return { bg: C.warningLight, text: C.warning };
  };
  
  const statusColors = getStatusColor(order.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name="arrow-back" size={rs(22)} color={C.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.id}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: rv(80) }} showsVerticalScrollIndicator={false}>

        {/* Top Info Card */}
        <View style={[styles.card, styles.shadow]}>
           <View style={styles.infoRow}>
             <View>
               <Text style={styles.infoLabel}>Status</Text>
               <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                 <View style={[styles.statusDot, { backgroundColor: statusColors.text }]} />
                 <Text style={[styles.statusText, { color: statusColors.text }]}>{order.status}</Text>
               </View>
             </View>
             <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.infoLabel}>Total Amount</Text>
                <Text style={styles.infoValue}>₹{order.finalAmount}</Text>
             </View>
           </View>
           <View style={styles.divider} />
           <View style={styles.infoRow}>
             <View>
                <Text style={styles.infoLabel}>Order Date</Text>
                <Text style={styles.infoDate}>{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</Text>
             </View>
             <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.infoLabel}>Payment</Text>
                <Text style={styles.infoDate}>{order.paymentMethod}</Text>
             </View>
           </View>
        </View>

        {/* Timeline */}
        <View style={[styles.card, styles.shadow, { marginBottom: rv(20) }]}>
          <Text style={styles.sectionTitle}>Tracking Timeline</Text>
          
          {loadingTracking && (
             <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={C.primary} />
                <Text style={styles.loadingText}>Fetching Live Tracking...</Text>
             </View>
          )}

          {liveTracking && liveTracking.checkpoints && liveTracking.checkpoints.length > 0 && (
             <View style={styles.liveTrackingBox}>
                <View style={styles.liveTrackingHeader}>
                  <Ionicons name="location" size={16} color={C.blue} />
                  <Text style={styles.liveTrackingTitle}>Live Tracking ({liveTracking.courier})</Text>
                </View>
                <Text style={styles.liveTrackingAWB}>AWB: {liveTracking.trackingId}</Text>
                
                {liveTracking.checkpoints.map((cp, idx) => (
                  <View key={idx} style={styles.timelineRow}>
                    <View style={styles.timelineIconBox}>
                      {idx === 0 ? (
                        <View style={styles.timelineDotActive}>
                           <View style={[styles.timelineDotInner, { backgroundColor: C.blue }]} />
                        </View>
                      ) : (
                        <Ionicons name="checkmark-circle" size={rs(20)} color={C.success} />
                      )}
                      {idx < liveTracking.checkpoints.length - 1 && <View style={[styles.timelineLine, { backgroundColor: C.success }]} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineStep, { color: idx === 0 ? C.blue : C.textMain }]}>{cp.status}</Text>
                      <Text style={styles.timelineTime}>{new Date(cp.time).toLocaleString()}</Text>
                      {cp.desc ? <Text style={styles.timelineDesc}>{cp.desc}</Text> : null}
                    </View>
                  </View>
                ))}
             </View>
          )}

          {!liveTracking && (
             <View style={{ marginTop: rv(12) }}>
               {order.status === 'Cancelled' ? (
                  <View>
                    <View style={styles.timelineRow}>
                      <View style={styles.timelineIconBox}>
                         <Ionicons name="checkmark-circle" size={rs(20)} color={C.success} />
                         <View style={[styles.timelineLine, { backgroundColor: C.border }]} />
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineStep}>Order Placed</Text>
                      </View>
                    </View>
                    <View style={styles.timelineRow}>
                      <View style={styles.timelineIconBox}>
                         <Ionicons name="close-circle" size={rs(20)} color={C.danger} />
                      </View>
                      <View style={[styles.timelineContent, { borderBottomWidth: 0 }]}>
                        <Text style={[styles.timelineStep, { color: C.danger }]}>Order Cancelled</Text>
                        {order.cancelReason ? <Text style={[styles.timelineDesc, { backgroundColor: C.dangerLight, color: C.danger }]}>Reason: {order.cancelReason}</Text> : null}
                      </View>
                    </View>
                  </View>
               ) : (
                 richTimeline.map((item, idx) => {
                   if (!item.isCompleted && !item.isActive && order.status === 'Delivered') return null;
                   const isLast = idx === richTimeline.length - 1 || (!richTimeline[idx+1]?.isCompleted && !richTimeline[idx+1]?.isActive && order.status === 'Delivered');

                   return (
                     <View key={idx} style={[styles.timelineRow, (!item.isCompleted && !item.isActive) && { opacity: 0.4 }]}>
                       <View style={styles.timelineIconBox}>
                         {item.isCompleted && !item.isActive ? (
                            <Ionicons name="checkmark-circle" size={rs(20)} color={C.success} />
                         ) : item.isActive ? (
                            <View style={styles.timelineDotActive}>
                               <View style={styles.timelineDotInner} />
                            </View>
                         ) : (
                            <View style={styles.timelineDotEmpty} />
                         )}
                         
                         {!isLast && <View style={[styles.timelineLine, { backgroundColor: item.isCompleted ? C.success : C.border }]} />}
                       </View>
                       <View style={[styles.timelineContent, isLast && { borderBottomWidth: 0, paddingBottom: 0 }]}>
                         <Text style={[styles.timelineStep, { color: item.isActive ? C.primary : C.textMain }]}>{item.step}</Text>
                         {item.time ? <Text style={styles.timelineTime}>{new Date(item.time).toLocaleString()}</Text> : null}
                         {item.desc ? <Text style={styles.timelineDesc}>{item.desc}</Text> : null}
                       </View>
                     </View>
                   )
                 })
               )}
             </View>
          )}
        </View>

        {/* Ordered Items */}
        <View style={[styles.card, styles.shadow, { marginBottom: rv(20) }]}>
          <Text style={styles.sectionTitle}>Ordered Items</Text>
          {order.items?.map((item, index) => (
             <View key={item.id} style={[styles.itemRow, index === order.items.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 }]}>
               <View style={styles.itemImgWrapper}>
                 <Image source={{ uri: getImg(item) }} style={styles.itemImg} resizeMode="contain" />
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={styles.itemName} numberOfLines={2}>{item.medicine?.name || 'Item'}</Text>
                 <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
               </View>
               <Text style={styles.itemTotal}>₹{Number(item.price) * item.quantity}</Text>
             </View>
          ))}
        </View>

        {/* Action Buttons */}
        {(showCancelButton || showClaimButton) && (
          <View style={styles.actionRow}>
            {showCancelButton && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => handleOpenCancel(false)}>
                <Text style={styles.cancelBtnText}>Cancel Order</Text>
              </TouchableOpacity>
            )}
            {showClaimButton && (
              <TouchableOpacity style={styles.claimBtn} onPress={() => handleOpenCancel(true)}>
                <Text style={styles.claimBtnText}>Claim Refund</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Cancel/Claim Modal */}
      <Modal visible={cancelModalOpen} animationType="slide" transparent={true} onRequestClose={() => setCancelModalOpen(false)}>
         <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
               <View style={styles.modalDragHandle} />
               <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle}>{isClaimMode ? 'Claim Your Refund' : 'Cancel Order'}</Text>
                 <TouchableOpacity onPress={() => setCancelModalOpen(false)} style={styles.modalCloseBtn}>
                   <Ionicons name="close" size={20} color={C.textMain}/>
                 </TouchableOpacity>
               </View>
               
               <ScrollView style={{ maxHeight: '80%' }} showsVerticalScrollIndicator={false}>
                 {!isClaimMode && (
                   <View style={styles.modalSection}>
                     <Text style={styles.modalLabel}>Reason for Cancellation</Text>
                     <TextInput 
                       style={styles.textArea} 
                       multiline 
                       numberOfLines={3} 
                       placeholder="Tell us why you are cancelling..." 
                       placeholderTextColor={C.textSub}
                       value={cancelReason} 
                       onChangeText={setCancelReason} 
                     />
                   </View>
                 )}

                 <View style={styles.modalSection}>
                   <Text style={styles.modalLabel}>Select Refund Method</Text>
                   
                   {!isCOD && (
                     <TouchableOpacity style={[styles.refundOption, refundMethod === 'bank' && styles.refundActive]} onPress={() => setRefundMethod('bank')}>
                        <View style={[styles.radio, refundMethod === 'bank' && styles.radioActive]}>{refundMethod === 'bank' && <View style={styles.radioInner}/>}</View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.refundTitle}>Original Payment Method</Text>
                          <Text style={styles.refundDesc}>Refund to bank/card in 5-7 days.</Text>
                        </View>
                     </TouchableOpacity>
                   )}

                   {!isClaimMode && isCOD && tokenRefundCount >= 2 && (
                     <TouchableOpacity style={[styles.refundOption, refundMethod === 'bank' && styles.refundActive]} onPress={() => setRefundMethod('bank')}>
                        <View style={[styles.radio, refundMethod === 'bank' && styles.radioActive]}>{refundMethod === 'bank' && <View style={styles.radioInner}/>}</View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.refundTitle}>Cancel Order</Text>
                          <Text style={styles.refundDesc}>As this is a COD order, no payment needs to be refunded.</Text>
                          <Text style={styles.warningText}>Note: 2-time bonus token limit exhausted.</Text>
                        </View>
                     </TouchableOpacity>
                   )}

                   {!hideTokensForCOD && (
                     <TouchableOpacity style={[styles.refundOption, refundMethod === 'tokens' && { borderColor: C.warning, backgroundColor: C.warningLight }]} onPress={() => setRefundMethod('tokens')}>
                        <View style={[styles.radio, refundMethod === 'tokens' && { borderColor: C.warning }]}>{refundMethod === 'tokens' && <View style={[styles.radioInner, { backgroundColor: C.warning }]}/>}</View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.refundTitle, { color: '#B45309' }]}>DoseBox Tokens</Text>
                          <Text style={[styles.refundDesc, { color: '#D97706' }]}>
                             {isCOD 
                               ? `Get ${Number(order.finalAmount) < 500 ? '50' : '100'} Bonus Tokens instantly.` 
                               : `Get ₹${order.finalAmount} + ${Number(order.finalAmount) < 500 ? '50' : '100'} Bonus Tokens instantly.`}
                          </Text>
                          {!isClaimMode && <Text style={styles.warningText}>Note: Limit 2 times per lifetime.</Text>}
                        </View>
                     </TouchableOpacity>
                   )}
                 </View>
               </ScrollView>

               <TouchableOpacity 
                  style={[styles.submitBtn, isSubmittingCancel && { opacity: 0.7 }]} 
                  onPress={submitCancel}
                  disabled={isSubmittingCancel}
               >
                 {isSubmittingCancel ? <ActivityIndicator color={C.white} /> : <Text style={styles.submitBtnText}>{isClaimMode ? 'Claim Refund' : 'Confirm Cancel'}</Text>}
               </TouchableOpacity>
            </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: rv(12), backgroundColor: C.bg },
  backBtn: { width: rs(40), height: rs(40), borderRadius: 999, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginRight: rs(12), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  headerTitle: { flex: 1, fontSize: rm(18), fontWeight: '800', color: C.textMain, letterSpacing: -0.5 },
  scroll: { flex: 1, padding: spacing.md },
  
  card: { backgroundColor: C.white, borderRadius: 20, padding: spacing.lg, marginBottom: rv(16) },
  shadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.03, shadowRadius: 16, elevation: 1 },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: C.border, marginVertical: rv(16) },
  infoLabel: { fontSize: rm(13), color: C.textSub, fontWeight: '500', marginBottom: rv(4) },
  infoValue: { fontSize: rm(20), color: C.textMain, fontWeight: '800' },
  infoDate: { fontSize: rm(14), color: C.textMain, fontWeight: '600' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(10), paddingVertical: rv(4), borderRadius: 999, alignSelf: 'flex-start' },
  statusDot: { width: rs(6), height: rs(6), borderRadius: rs(3), marginRight: rs(6) },
  statusText: { fontSize: rm(12), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  actionRow: { flexDirection: 'row', gap: rs(12), marginBottom: rv(16) },
  cancelBtn: { flex: 1, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.dangerLight, padding: rv(16), borderRadius: 999, alignItems: 'center' },
  cancelBtnText: { color: C.danger, fontWeight: '700', fontSize: rm(15) },
  claimBtn: { flex: 1, backgroundColor: C.warning, padding: rv(16), borderRadius: 999, alignItems: 'center', shadowColor: C.warning, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  claimBtnText: { color: C.white, fontWeight: '700', fontSize: rm(15) },

  sectionTitle: { fontSize: rm(16), fontWeight: '800', color: C.textMain, letterSpacing: -0.5, marginBottom: rv(20) },

  timelineRow: { flexDirection: 'row' },
  timelineIconBox: { width: rs(24), alignItems: 'center', marginRight: rs(16) },
  timelineDotEmpty: { width: rs(16), height: rs(16), borderRadius: rs(8), borderWidth: 2, borderColor: C.border, backgroundColor: C.white },
  timelineDotActive: { width: rs(20), height: rs(20), borderRadius: rs(10), backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  timelineDotInner: { width: rs(10), height: rs(10), borderRadius: rs(5), backgroundColor: C.primary },
  timelineLine: { width: 2, flex: 1, marginVertical: 4, borderRadius: 1 },
  timelineContent: { flex: 1, paddingBottom: rv(24), borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: rv(8) },
  timelineStep: { fontSize: rm(15), fontWeight: '700' },
  timelineTime: { fontSize: rm(13), color: C.textSub, marginTop: 2, fontWeight: '500' },
  timelineDesc: { fontSize: rm(13), color: C.textSub, marginTop: 8, backgroundColor: '#F8FAFC', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, overflow: 'hidden', lineHeight: 20 },

  loadingBox: { padding: rv(24), alignItems: 'center', backgroundColor: C.bg, borderRadius: 16 },
  loadingText: { fontSize: rm(13), fontWeight: '600', color: C.textSub, marginTop: rv(12) },
  
  liveTrackingBox: { backgroundColor: C.blueLight, padding: spacing.lg, borderRadius: 16, marginBottom: rv(24), borderWidth: 1, borderColor: '#DBEAFE' },
  liveTrackingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: rv(4) },
  liveTrackingTitle: { fontSize: rm(13), fontWeight: '800', color: C.blue, textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 6 },
  liveTrackingAWB: { fontSize: rm(14), fontWeight: '600', color: '#60A5FA', marginBottom: rv(16) },

  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: rv(16), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  itemImgWrapper: { width: rs(56), height: rs(56), borderRadius: 12, backgroundColor: C.bg, marginRight: rs(16), padding: 4, borderWidth: 1, borderColor: C.border },
  itemImg: { width: '100%', height: '100%', borderRadius: 8 },
  itemName: { fontSize: rm(15), fontWeight: '700', color: C.textMain, marginBottom: 4, lineHeight: 20 },
  itemQty: { fontSize: rm(13), color: C.textSub, fontWeight: '500' },
  itemTotal: { fontSize: rm(16), fontWeight: '800', color: C.textMain },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '90%' },
  modalDragHandle: { width: rs(40), height: rs(4), borderRadius: rs(2), backgroundColor: C.border, alignSelf: 'center', marginBottom: rv(16) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(24) },
  modalTitle: { fontSize: rm(20), fontWeight: '800', color: C.textMain, letterSpacing: -0.5 },
  modalCloseBtn: { width: rs(32), height: rs(32), borderRadius: rs(16), backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  modalSection: { marginBottom: rv(24) },
  modalLabel: { fontSize: rm(15), fontWeight: '700', color: C.textMain, marginBottom: rv(12) },
  textArea: { borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: rs(16), fontSize: rm(15), color: C.textMain, textAlignVertical: 'top', minHeight: rv(100), backgroundColor: C.bg },
  refundOption: { flexDirection: 'row', padding: spacing.lg, borderWidth: 1.5, borderColor: C.border, borderRadius: 20, marginBottom: rv(12), backgroundColor: C.white },
  refundActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  radio: { width: rs(22), height: rs(22), borderRadius: rs(11), borderWidth: 2, borderColor: '#CBD5E1', marginRight: rs(16), alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: C.primary },
  radioInner: { width: rs(10), height: rs(10), borderRadius: rs(5), backgroundColor: C.primary },
  refundTitle: { fontSize: rm(15), fontWeight: '700', color: C.textMain, marginBottom: 2 },
  refundDesc: { fontSize: rm(13), color: C.textSub, lineHeight: 18 },
  warningText: { fontSize: rm(11), fontWeight: '600', color: C.danger, marginTop: 8 },
  submitBtn: { backgroundColor: C.primary, paddingVertical: rv(18), borderRadius: 999, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4, marginTop: rv(8) },
  submitBtnText: { color: C.white, fontSize: rm(16), fontWeight: '700' }
});
