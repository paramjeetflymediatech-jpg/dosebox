import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Image, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import { getFullImageUrl } from '../../utils/image';
import { AlertService } from '../../services/AlertService';

export default function AdminPrescriptionReviewScreen({ route, navigation }) {
  const { prescription } = route.params;
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [processing, setProcessing] = useState(false);

  // Search Modal State
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);

  useEffect(() => {
    if (prescription?.extractedMedicines) {
      const initialItems = prescription.extractedMedicines.map(med => {
        let product = med.matchedProduct?.product;
        return {
          id: Math.random().toString(),
          extractedName: med.medicineName,
          requestedQuantity: parseInt(med.quantity) || 1,
          product: product || null,
          matchType: product ? (med.matchedProduct.matchType === 'Exact' ? 'exact' : 'alternative') : 'none'
        };
      });
      setItems(initialItems);
    }
  }, [prescription]);

  const searchMedicines = async (q) => {
    setSearchQuery(q);
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/medicines?search=${q}&limit=20`);
      if (res.data?.success) {
        setSearchResults(res.data.data);
      }
    } catch (e) {
      console.log('Search error:', e);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectProduct = (product) => {
    const newItems = [...items];
    if (editingItemIndex !== null) {
      newItems[editingItemIndex].product = product;
      newItems[editingItemIndex].matchType = 'alternative';
    } else {
      newItems.push({
        id: Math.random().toString(),
        extractedName: 'Manual Entry',
        requestedQuantity: 1,
        product: product,
        matchType: 'none'
      });
    }
    setItems(newItems);
    setSearchModalVisible(false);
    setEditingItemIndex(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateQuantity = (index, delta) => {
    const newItems = [...items];
    const newQty = newItems[index].requestedQuantity + delta;
    if (newQty > 0) {
      newItems[index].requestedQuantity = newQty;
      setItems(newItems);
    }
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleApprove = async () => {
    // Validate stock
    const outOfStock = items.find(item => item.product && item.requestedQuantity > item.product.stock);
    if (outOfStock) {
      AlertService.show({ type: 'error', title: 'Insufficient Stock', message: `${outOfStock.product.name} only has ${outOfStock.product.stock} in stock.` });
      return;
    }
    
    // Ensure all items have a product
    if (items.length > 0 && items.some(item => !item.product)) {
      AlertService.show({ type: 'error', title: 'Missing Product', message: 'All items must be mapped to a product before approval.' });
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post('/admin/prescriptions/approve', {
        prescriptionId: prescription.id,
        userId: prescription.userId,
        notes,
        items: items.filter(i => i.product).map(i => ({
          medicineId: i.product.id,
          quantity: i.requestedQuantity,
          price: i.product.discountPrice || i.product.price,
          type: i.matchType
        }))
      });
      if (res.data?.success) {
        AlertService.show({ type: 'success', title: 'Approved', message: 'Prescription approved & Draft Cart created.' });
        navigation.goBack();
      } else {
        AlertService.show({ type: 'error', title: 'Error', message: res.data?.message || 'Failed to approve' });
      }
    } catch (error) {
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to approve prescription' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      const res = await api.put('/admin/prescriptions', { 
        id: prescription.id, 
        status: 'Rejected', 
        pharmacistNotes: notes 
      });
      if (res.status === 200 || res.data?.success) {
        AlertService.show({ type: 'success', title: 'Rejected', message: 'Prescription rejected.' });
        navigation.goBack();
      }
    } catch (error) {
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to reject prescription' });
    } finally {
      setProcessing(false);
    }
  };

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.searchResultItem}
      onPress={() => handleSelectProduct(item)}
    >
      {item.images?.[0] ? (
        <Image source={{uri: getFullImageUrl(item.images[0])}} style={styles.searchImg} />
      ) : (
        <View style={styles.searchImgPlaceholder}>
          <Ionicons name="medical" size={20} color="#94A3B8" />
        </View>
      )}
      <View style={styles.searchResultText}>
        <Text style={styles.searchResultTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.searchResultSub}>₹{Number(item.discountPrice || item.price || 0).toFixed(2)} • Stock: {item.stock}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Rx #{prescription.id}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: rv(100) }}>
        
        {/* File Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uploaded Prescription</Text>
          {prescription.fileUrl ? (
            <Image 
              source={{uri: getFullImageUrl(prescription.fileUrl.replace(/^\/uploads\//, '/api/file/'))}} 
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={{color: '#64748B'}}>No file attached.</Text>
          )}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pharmacist Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes for the customer..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Draft Cart */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Build Draft Cart</Text>
            <TouchableOpacity onPress={() => { setEditingItemIndex(null); setSearchModalVisible(true); }}>
              <Text style={styles.addText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View key={item.id} style={styles.cartItemCard}>
              <View style={styles.cartItemHeader}>
                <Text style={styles.extractedText}>AI found: {item.extractedName}</Text>
                <TouchableOpacity onPress={() => removeItem(index)}>
                  <Ionicons name="close" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>

              {item.product ? (
                <View style={styles.productRow}>
                  {item.product.images?.[0] ? (
                    <Image source={{uri: getFullImageUrl(item.product.images[0])}} style={styles.productImg} />
                  ) : (
                    <View style={styles.searchImgPlaceholder}><Ionicons name="medical" size={16} color="#94A3B8"/></View>
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.productName}>{item.product.name}</Text>
                    <Text style={styles.productPrice}>₹{Number(item.product.discountPrice || item.product.price || 0).toFixed(2)}</Text>
                  </View>
                  
                  <View style={styles.qtyControls}>
                    <TouchableOpacity onPress={() => updateQuantity(index, -1)} style={styles.qtyBtn}>
                      <Ionicons name="remove" size={16} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.requestedQuantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(index, 1)} style={styles.qtyBtn}>
                      <Ionicons name="add" size={16} color="#0F172A" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.mapBtn}
                  onPress={() => { setEditingItemIndex(index); setSearchModalVisible(true); }}
                >
                  <Text style={styles.mapBtnText}>Tap to map medicine</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {items.length === 0 && (
            <Text style={{color: '#64748B', textAlign: 'center', marginVertical: 16}}>No items in cart.</Text>
          )}
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.footerBtn, {backgroundColor: '#FEE2E2', marginRight: 12}]}
          onPress={handleReject}
          disabled={processing}
        >
          <Text style={[styles.footerBtnText, {color: '#B91C1C'}]}>Reject</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.footerBtn, {backgroundColor: '#10B981', flex: 2}]}
          onPress={handleApprove}
          disabled={processing}
        >
          {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.footerBtnText}>Approve & Create Cart</Text>}
        </TouchableOpacity>
      </View>

      {/* Search Modal */}
      <Modal visible={searchModalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Medicine</Text>
              <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchInputWrap}>
              <Ionicons name="search" size={20} color="#64748B" />
              <TextInput 
                style={styles.searchInput}
                placeholder="Type to search..."
                value={searchQuery}
                onChangeText={searchMedicines}
                autoFocus
              />
            </View>
            {searching ? (
              <ActivityIndicator style={{marginTop: 20}} />
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={item => String(item.id)}
                renderItem={renderSearchItem}
                contentContainerStyle={{paddingVertical: 12}}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { marginRight: spacing.md },
  headerTitle: { fontSize: rm(18), fontWeight: '700', color: '#0F172A' },
  content: { flex: 1 },
  section: { backgroundColor: '#fff', padding: spacing.md, marginBottom: rv(8), borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  sectionTitle: { fontSize: rm(16), fontWeight: '700', color: '#1E293B', marginBottom: rv(12) },
  previewImage: { width: '100%', height: rv(250), backgroundColor: '#F1F5F9', borderRadius: radius.md },
  notesInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.md, padding: spacing.md, fontSize: rm(14), textAlignVertical: 'top' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(12) },
  addText: { color: '#0284C7', fontWeight: '700', fontSize: rm(14) },
  
  cartItemCard: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.md, padding: spacing.md, marginBottom: rv(12) },
  cartItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rv(8) },
  extractedText: { fontSize: rm(12), color: '#64748B', fontStyle: 'italic' },
  
  mapBtn: { backgroundColor: '#E0F2FE', paddingVertical: rv(8), borderRadius: radius.sm, alignItems: 'center', marginTop: rv(4) },
  mapBtnText: { color: '#0284C7', fontWeight: '600', fontSize: rm(13) },
  
  productRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: '#E2E8F0' },
  productImg: { width: rs(40), height: rs(40), borderRadius: radius.sm },
  searchImgPlaceholder: { width: rs(40), height: rs(40), borderRadius: radius.sm, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: rm(14), fontWeight: '600', color: '#0F172A' },
  productPrice: { fontSize: rm(13), color: '#10B981', fontWeight: '700', marginTop: rv(2) },
  
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: radius.sm, padding: 2 },
  qtyBtn: { padding: rs(6), backgroundColor: '#fff', borderRadius: radius.sm },
  qtyText: { marginHorizontal: rs(10), fontWeight: '700', fontSize: rm(14) },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', flexDirection: 'row', padding: spacing.md },
  footerBtn: { flex: 1, paddingVertical: rv(14), borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  footerBtnText: { color: '#fff', fontSize: rm(15), fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, height: '80%', padding: spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(16) },
  modalTitle: { fontSize: rm(18), fontWeight: '700', color: '#0F172A' },
  searchInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: rv(10), marginBottom: rv(8) },
  searchInput: { flex: 1, marginLeft: rs(8), fontSize: rm(15), color: '#0F172A' },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: rv(12), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  searchImg: { width: rs(40), height: rs(40), borderRadius: radius.sm },
  searchResultText: { flex: 1, marginLeft: rs(12) },
  searchResultTitle: { fontSize: rm(15), fontWeight: '600', color: '#0F172A' },
  searchResultSub: { fontSize: rm(13), color: '#64748B', marginTop: rv(2) },
});
