import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { rs, rv, rm, spacing } from '../../utils/responsive';
import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/env';
import { AlertService } from '../../services/AlertService';

const C = {
  primary: '#1F5C52',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  textMain: '#0F172A',
  textSub: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  blue: '#3B82F6',
};

// Helper to convert number to words for Indian currency format (basic version)
const numberToWords = (num) => {
  if (num === 0) return 'Zero';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const numStr = Math.floor(num).toString();
  if (numStr.length > 9) return 'Overflow';
  
  const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  
  let str = '';
  str += (n[1] != '00') ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (n[2] != '00') ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (n[3] != '00') ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (n[4] != '0') ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (n[5] != '00') ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
  
  return str.trim();
};

export default function InvoiceScreen({ route, navigation }) {
  const { order } = route.params;
  const insets = useSafeAreaInsets();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadInvoice = async (orderId) => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const url = `${API_URL}/orders/${orderId}/invoice`;

      const { dirs } = ReactNativeBlobUtil.fs;
      const fileName = `Invoice_OD-${orderId}.pdf`;
      const path = `${dirs.DocumentDir}/${fileName}`;

      const res = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: path,
      }).fetch('GET', url, {
        Authorization: `Bearer ${token}`
      });

      if (Platform.OS === 'ios') {
        ReactNativeBlobUtil.ios.previewDocument(res.path());
      } else {
        ReactNativeBlobUtil.android.actionViewIntent(res.path(), 'application/pdf');
      }

    } catch (err) {
      console.log('Download error:', err);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to download invoice' });
    } finally {
      setIsDownloading(false);
    }
  };

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB');

  let totalQty = 0;
  const itemsTotalBilling = (order.items || []).reduce((sum, item) => {
    totalQty += item.quantity;
    return sum + (Number(item.price) * item.quantity);
  }, 0);
  
  const totalMRP = Number(order.totalAmount) || 0;
  const totalDiscountSaved = Number(order.discountAmount) || 0;
  const finalAmount = Number(order.finalAmount) || 0;
  const gstAmount = Number(order.gstAmount) || 0;
  const tokensUsed = Number(order.tokensUsed || 0);

  const productDiscount = Math.max(0, totalMRP - itemsTotalBilling);
  const couponDiscount = Math.max(0, totalDiscountSaved - productDiscount - tokensUsed);
  const baseTotal = totalMRP - totalDiscountSaved;

  let shippingFee = 0;
  if (Math.abs(finalAmount - (baseTotal + gstAmount)) <= 51) {
    shippingFee = Math.max(0, Math.round(finalAmount - (baseTotal + gstAmount)));
  } else {
    shippingFee = Math.max(0, Math.round(finalAmount - baseTotal));
  }
  
  const amountWords = numberToWords(finalAmount);
  const halfGst = (gstAmount / 2).toFixed(2);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name="arrow-back" size={rs(22)} color={C.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice #OD-{order.id}</Text>
        <TouchableOpacity onPress={() => handleDownloadInvoice(order.id)} style={styles.downloadBtn} disabled={isDownloading}>
          {isDownloading ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <Ionicons name="download-outline" size={rs(22)} color={C.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + rv(20) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.invoiceCard}>
          
          {/* Top Row: Seller and Buyer */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.sellerTitle}>JAGBIR PHARMACEUTICALS PRIVATE LIMITED.</Text>
              <Text style={styles.textSmall}>B-35, Building No. 6, Ansal Chamber-2,</Text>
              <Text style={styles.textSmall}>Bhikaji Cama Place, New Delhi - 110066</Text>
              <Text style={styles.textSmall}>Phone : 011-43550667, 9718641733, 9718211733</Text>
              <Text style={styles.textSmall}>D.L.No. : WLF20B2025DL000670/WLF21B2025DL000659</Text>
              <Text style={styles.textSmall}>GSTIN : 07AAECJ0285F1ZQ</Text>
            </View>
            <View style={styles.colRight}>
              <Text style={styles.invoiceType}>GST INVOICE</Text>
              <Text style={styles.textLabel}>Customer Name :</Text>
              <Text style={styles.buyerTitle}>{order.user?.name?.toUpperCase() || 'CUSTOMER'}</Text>
              <Text style={styles.textSmall}>{order.user?.address || 'Address Not Provided'}</Text>
              <Text style={styles.textSmall}>PHONE : {order.user?.phone || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Middle Row: Invoice Details */}
          <View style={styles.rowDetails}>
            <View style={styles.detailBox}>
              <Text style={styles.textLabel}>Invoice No</Text>
              <Text style={styles.textValue}>OD-{order.id}</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.textLabel}>Invoice Date</Text>
              <Text style={styles.textValue}>{orderDate}</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.textLabel}>Order No.</Text>
              <Text style={styles.textValue}>OD-{order.id}</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.textLabel}>Due Date</Text>
              <Text style={styles.textValue}>{orderDate}</Text>
            </View>
          </View>

          {/* Table */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: rs(20) }]}>S.</Text>
                <Text style={[styles.th, { width: rs(30) }]}>Qty</Text>
                <Text style={[styles.th, { width: rs(60) }]}>Mfr</Text>
                <Text style={[styles.th, { width: rs(150) }]}>Product Name</Text>
                <Text style={[styles.th, { width: rs(60) }]}>Batch</Text>
                <Text style={[styles.th, { width: rs(40) }]}>Exp</Text>
                <Text style={[styles.th, { width: rs(50) }]}>HSN</Text>
                <Text style={[styles.th, { width: rs(60), textAlign: 'right' }]}>M.R.P</Text>
                <Text style={[styles.th, { width: rs(60), textAlign: 'right' }]}>Rate</Text>
                <Text style={[styles.th, { width: rs(40), textAlign: 'right' }]}>SGST</Text>
                <Text style={[styles.th, { width: rs(70), textAlign: 'right' }]}>Value</Text>
              </View>
              {order.items?.map((item, idx) => {
                const medicine = item.medicine || {};
                const qty = item.quantity;
                const rate = Number(item.price);
                const value = qty * rate;
                const mrp = Number(medicine.price || rate).toFixed(2);
                
                return (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.td, { width: rs(20) }]}>{idx + 1}</Text>
                    <Text style={[styles.td, { width: rs(30) }]}>{qty}</Text>
                    <Text style={[styles.td, { width: rs(60) }]} numberOfLines={1}>{medicine.manufacturer?.substring(0, 6)?.toUpperCase() || 'GEN'}</Text>
                    <Text style={[styles.td, { width: rs(150) }]} numberOfLines={2}>{medicine.name?.toUpperCase() || 'ITEM'}</Text>
                    <Text style={[styles.td, { width: rs(60) }]}>MB{String(order.id).padStart(4, '0')}</Text>
                    <Text style={[styles.td, { width: rs(40) }]}>12/28</Text>
                    <Text style={[styles.td, { width: rs(50) }]}>{medicine.hsnCode || '300490'}</Text>
                    <Text style={[styles.td, { width: rs(60), textAlign: 'right' }]}>{mrp}</Text>
                    <Text style={[styles.td, { width: rs(60), textAlign: 'right' }]}>{rate.toFixed(2)}</Text>
                    <Text style={[styles.td, { width: rs(40), textAlign: 'right' }]}>9%</Text>
                    <Text style={[styles.td, { width: rs(70), textAlign: 'right' }]}>{value.toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.divider} />

          {/* Footer Info */}
          <View style={styles.footerRow}>
            {/* Tax Info */}
            <View style={styles.taxSection}>
              <View style={styles.taxHeaderRow}>
                <Text style={[styles.taxTh, { width: '30%' }]}>CLASS</Text>
                <Text style={[styles.taxTh, { width: '25%' }]}>TOTAL</Text>
                <Text style={[styles.taxTh, { width: '20%' }]}>SGST</Text>
                <Text style={[styles.taxTh, { width: '25%' }]}>CGST</Text>
              </View>
              <View style={styles.taxDataRow}>
                <Text style={[styles.taxTd, { width: '30%' }]}>GST 18.00%</Text>
                <Text style={[styles.taxTd, { width: '25%' }]}>{baseTotal.toFixed(2)}</Text>
                <Text style={[styles.taxTd, { width: '20%' }]}>{halfGst}</Text>
                <Text style={[styles.taxTd, { width: '25%' }]}>{halfGst}</Text>
              </View>
              <View style={[styles.taxDataRow, { borderTopWidth: 1, borderTopColor: C.border, marginTop: rv(4), paddingTop: rv(4) }]}>
                <Text style={[styles.taxTh, { width: '30%' }]}>TOTAL</Text>
                <Text style={[styles.taxTh, { width: '25%' }]}>{baseTotal.toFixed(2)}</Text>
                <Text style={[styles.taxTh, { width: '20%' }]}>{halfGst}</Text>
                <Text style={[styles.taxTh, { width: '25%' }]}>{halfGst}</Text>
              </View>
              <Text style={styles.amountWords}>Rs. {amountWords} only</Text>
            </View>

            {/* Value Summary */}
            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Items:</Text>
                <Text style={styles.summaryValue}>{order.items?.length || 0}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Qty:</Text>
                <Text style={styles.summaryValue}>{totalQty}</Text>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total MRP</Text>
                <Text style={styles.summaryValue}>{totalMRP.toFixed(2)}</Text>
              </View>
              {productDiscount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Dosebox Discount</Text>
                  <Text style={styles.summaryValue}>-{productDiscount.toFixed(2)}</Text>
                </View>
              )}
              {couponDiscount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Promo Discount</Text>
                  <Text style={styles.summaryValue}>-{couponDiscount.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontWeight: '700' }]}>Cart Total</Text>
                <Text style={[styles.summaryValue, { fontWeight: '700' }]}>{(totalMRP - productDiscount).toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GST (18%)</Text>
                <Text style={styles.summaryValue}>{gstAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Charges</Text>
                <Text style={styles.summaryValue}>{shippingFee > 0 ? shippingFee.toFixed(2) : 'Free'}</Text>
              </View>
              {tokensUsed > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tokens Used</Text>
                  <Text style={styles.summaryValue}>-{tokensUsed.toFixed(2)}</Text>
                </View>
              )}
              
              <View style={styles.grandTotalBox}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>₹{finalAmount.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Terms & Signature */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.sellerTitle}>Terms & Conditions</Text>
              <Text style={styles.textSmall}>1. Goods once sold will not be taken back or exchanged.</Text>
              <Text style={styles.textSmall}>2. All disputes subject to Jurisdiction only.</Text>
              <Text style={styles.textSmall}>3. Bills not paid on due date will attract 24% interest.</Text>
            </View>
            <View style={[styles.colRight, { justifyContent: 'flex-end', alignItems: 'center' }]}>
              <Text style={styles.sellerTitle}>FOR JAGBIR PHARMACEUTICALS</Text>
              <Text style={[styles.textSmall, { marginTop: rv(20) }]}>Authorised Signatory</Text>
            </View>
          </View>
          
        </View>
      </ScrollView>
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
    width: rs(40), height: rs(40), 
    borderRadius: 20, 
    backgroundColor: C.white, 
    alignItems: 'center', justifyContent: 'center', 
    marginRight: rs(12), 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 
  },
  downloadBtn: {
    width: rs(40), height: rs(40), 
    borderRadius: 20, 
    backgroundColor: C.white, 
    alignItems: 'center', justifyContent: 'center', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 
  },
  headerTitle: { flex: 1, fontSize: rm(18), fontWeight: '800', color: C.textMain },
  scrollContent: { padding: spacing.md },
  
  invoiceCard: {
    backgroundColor: C.white,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
    paddingRight: rs(8),
  },
  colRight: {
    flex: 0.8,
    alignItems: 'flex-end',
  },
  sellerTitle: {
    fontSize: rm(12),
    fontWeight: '700',
    color: '#000080',
    marginBottom: rv(4),
  },
  buyerTitle: {
    fontSize: rm(12),
    fontWeight: '700',
    color: '#000',
    marginBottom: rv(2),
  },
  textSmall: {
    fontSize: rm(10),
    color: '#000',
    lineHeight: 14,
  },
  invoiceType: {
    fontSize: rm(16),
    fontWeight: '800',
    color: '#000080',
    marginBottom: rv(8),
  },
  textLabel: {
    fontSize: rm(10),
    color: '#475569',
    fontWeight: '600',
  },
  textValue: {
    fontSize: rm(11),
    fontWeight: '700',
    color: '#000',
  },
  divider: {
    height: 1,
    backgroundColor: '#000',
    marginVertical: rv(12),
  },
  rowDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detailBox: {
    width: '25%',
    marginBottom: rv(8),
  },
  
  tableScroll: {
    marginTop: rv(8),
  },
  table: {
    borderWidth: 1,
    borderColor: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderBottomWidth: 1,
    borderColor: '#000',
    paddingVertical: rv(6),
    paddingHorizontal: rs(4),
  },
  th: {
    fontSize: rm(10),
    fontWeight: '700',
    color: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: rv(6),
    paddingHorizontal: rs(4),
  },
  td: {
    fontSize: rm(10),
    color: '#000',
  },
  
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taxSection: {
    flex: 1,
    paddingRight: rs(12),
    borderRightWidth: 1,
    borderColor: '#000',
  },
  taxHeaderRow: {
    flexDirection: 'row',
    marginBottom: rv(4),
  },
  taxTh: {
    fontSize: rm(10),
    fontWeight: '700',
    color: '#000',
  },
  taxDataRow: {
    flexDirection: 'row',
    marginBottom: rv(2),
  },
  taxTd: {
    fontSize: rm(10),
    color: '#000',
  },
  amountWords: {
    marginTop: rv(8),
    fontSize: rm(10),
    fontStyle: 'italic',
    color: '#000',
  },
  summarySection: {
    flex: 0.8,
    paddingLeft: rs(12),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: rv(4),
  },
  summaryLabel: {
    fontSize: rm(10),
    color: '#000',
  },
  summaryValue: {
    fontSize: rm(10),
    color: '#000',
    textAlign: 'right',
    minWidth: rs(50),
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: rv(6),
  },
  grandTotalBox: {
    backgroundColor: '#E2E8F0',
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: rv(8),
    borderWidth: 1,
    borderColor: '#000',
  },
  grandTotalLabel: {
    fontSize: rm(12),
    color: '#000',
  },
  grandTotalValue: {
    fontSize: rm(16),
    fontWeight: '800',
    color: '#000',
  },
});
