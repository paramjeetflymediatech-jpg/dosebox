import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingCart, MapPin, Search, ChevronDown, X, ArrowRight } from 'lucide-react-native';
import { rs, rv, rm, isTablet, spacing, radius } from '../../utils/responsive';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import api from '../../services/api';

// ─── Color Tokens ────────────────────────────────────────────
const C = {
  primary: '#1F5C52',
  primaryLight: '#EAF4F2',
  accent: '#F0A500',
  bg: '#F7F8FA',
  white: '#FFFFFF',
  text: '#0D1B2A',
  sub: '#64748B',
  border: '#E9EDF2',
  card: '#FFFFFF',
  red: '#EF4444',
};

export default function HomeScreen({ navigation }) {
  const { totalQty } = useCart();
  const { selectedAddress, selectAddress } = useLocation();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const quickLinks = [
    { id: 1, label: 'Medicines',    emoji: '💊', bg: '#EEF8F6', route: 'ExploreTab' },
    { id: 2, label: 'Consult',      emoji: '🩺', bg: '#FFF7E6', route: 'HomeTab' },
    { id: 3, label: 'Prescription', emoji: '📋', bg: '#F0EEFF', route: 'UploadPrescription' },
    { id: 4, label: 'My Orders',    emoji: '📦', bg: '#FFF0F0', route: 'ProceedTab' },
  ];

  const popularMeds = [
    { id: 1, name: 'Paracetamol',  dosage: '500mg',  tag: 'Pain Relief',  price: '₹28' },
    { id: 2, name: 'Amoxicillin',  dosage: '250mg',  tag: 'Antibiotic',   price: '₹85' },
    { id: 3, name: 'Cetirizine',   dosage: '10mg',   tag: 'Allergy',      price: '₹42' },
    { id: 4, name: 'Metformin',    dosage: '500mg',  tag: 'Diabetes',     price: '₹65' },
  ];

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await api.get('/account/addresses');
      if (res.data?.success) setAddresses(res.data.data);
    } catch (e) {
      console.error('Failed to fetch addresses:', e);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleOpenLocation = () => {
    fetchAddresses();
    setShowLocationModal(true);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('ExploreTab', { screen: 'ExploreTab', params: { search: searchQuery } });
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* ── TOP BAR ─────────────────────────────────────── */}
      <View style={styles.topBar}>
        {/* Location */}
        <TouchableOpacity style={styles.locationRow} onPress={handleOpenLocation} activeOpacity={0.7}>
          <View style={styles.locationIconWrap}>
            <MapPin size={14} color={C.primary} />
          </View>
          <View style={{ flex: 1, marginRight: rs(4) }}>
            <Text style={styles.locationLabel}>Delivering to</Text>
            <Text style={styles.locationValue} numberOfLines={1}>
              {selectedAddress ? `${selectedAddress.title}, ${selectedAddress.city}` : 'Select Location'}
            </Text>
          </View>
          <ChevronDown size={16} color={C.sub} />
        </TouchableOpacity>

        {/* Cart */}
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => navigation.navigate('CartCheckout')}
          activeOpacity={0.75}
        >
          <ShoppingCart size={22} color={C.primary} />
          {totalQty > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalQty > 9 ? '9+' : totalQty}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── SEARCH BAR ──────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <Search size={18} color={C.sub} style={{ marginRight: rs(10) }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medicines, symptoms..."
          placeholderTextColor={C.sub}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + rv(100) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO BANNER ─────────────────────────────── */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>🎉 Limited Offer</Text>
            </View>
            <Text style={styles.heroHeadline}>Get 20% off{'\n'}your first order</Text>
            <Text style={styles.heroCode}>Use code{' '}<Text style={styles.heroCodeHighlight}>HEALTH20</Text></Text>
            <TouchableOpacity
              style={styles.heroBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ExploreTab')}
            >
              <Text style={styles.heroBtnText}>Shop Now</Text>
              <ArrowRight size={16} color={C.white} />
            </TouchableOpacity>
          </View>

          {/* Decorative circles */}
          <View style={styles.heroDeco1} />
          <View style={styles.heroDeco2} />
          <Text style={styles.heroEmoji}>💊</Text>
        </View>

        {/* ── QUICK LINKS ─────────────────────────────── */}
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.quickGrid}>
          {quickLinks.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.quickCard, { backgroundColor: item.bg }]}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.75}
            >
              <Text style={styles.quickEmoji}>{item.emoji}</Text>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── POPULAR MEDICINES ───────────────────────── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Popular</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ExploreTab')} activeOpacity={0.7}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.medList}>
          {popularMeds.map((med) => (
            <TouchableOpacity
              key={med.id}
              style={styles.medCard}
              onPress={() => navigation.navigate('ExploreTab')}
              activeOpacity={0.75}
            >
              <View style={styles.medIconWrap}>
                <Text style={{ fontSize: rs(26) }}>💊</Text>
              </View>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{med.name} <Text style={styles.medDosage}>{med.dosage}</Text></Text>
                <View style={styles.medTagWrap}>
                  <Text style={styles.medTag}>{med.tag}</Text>
                </View>
              </View>
              <Text style={styles.medPrice}>{med.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── UPLOAD PRESCRIPTION CTA ─────────────────── */}
        <TouchableOpacity
          style={styles.prescriptionBanner}
          onPress={() => navigation.navigate('UploadPrescription')}
          activeOpacity={0.85}
        >
          <View>
            <Text style={styles.prescriptionTitle}>Have a prescription?</Text>
            <Text style={styles.prescriptionSub}>Upload it and we'll handle the rest</Text>
          </View>
          <View style={styles.prescriptionArrow}>
            <ArrowRight size={20} color={C.white} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* ── LOCATION MODAL ──────────────────────────────── */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Delivery Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)} style={styles.closeBtn}>
                <X size={20} color={C.sub} />
              </TouchableOpacity>
            </View>

            {loadingAddresses ? (
              <ActivityIndicator size="large" color={C.primary} style={{ marginVertical: rv(32) }} />
            ) : addresses.length === 0 ? (
              <Text style={styles.emptyModal}>No saved addresses found.</Text>
            ) : (
              <FlatList
                data={addresses}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.addressCard}
                    onPress={() => { selectAddress(item); setShowLocationModal(false); }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.addressIcon}>
                      <MapPin size={16} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addressTitle}>{item.title}</Text>
                      <Text style={styles.addressSub}>{item.street}, {item.city}, {item.state} {item.zipCode}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: C.white },

  /* Top bar */
  topBar:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: rv(14), backgroundColor: C.white },
  locationRow:       { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: rs(12) },
  locationIconWrap:  { width: rs(28), height: rs(28), borderRadius: rs(8), backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: rs(8) },
  locationLabel:     { fontSize: rm(11), color: C.sub, fontWeight: '500' },
  locationValue:     { fontSize: rm(14), fontWeight: '700', color: C.text },
  cartBtn:           { width: rs(44), height: rs(44), borderRadius: rs(12), backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  badge:             { position: 'absolute', top: rs(4), right: rs(4), width: rs(16), height: rs(16), borderRadius: rs(8), backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.white },
  badgeText:         { fontSize: rm(9), fontWeight: '800', color: C.white },

  /* Search */
  searchWrap:        { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: rv(16), backgroundColor: C.bg, borderRadius: radius.lg, paddingHorizontal: rs(16), height: rv(48), borderWidth: 1, borderColor: C.border },
  searchInput:       { flex: 1, fontSize: rm(14), color: C.text },

  /* Scroll */
  scroll:            { flex: 1, backgroundColor: C.bg },
  content:           { paddingHorizontal: spacing.md, paddingTop: rv(4) },

  /* Hero */
  heroBanner:        { backgroundColor: C.primary, borderRadius: radius.xl, padding: rs(24), marginBottom: rv(28), overflow: 'hidden', minHeight: rv(160) },
  heroLeft:          { zIndex: 1, width: '62%' },
  heroPill:          { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.full, paddingHorizontal: rs(10), paddingVertical: rv(4), alignSelf: 'flex-start', marginBottom: rv(10) },
  heroPillText:      { color: C.white, fontSize: rm(11), fontWeight: '600' },
  heroHeadline:      { fontSize: rm(isTablet ? 26 : 20), fontWeight: '800', color: C.white, lineHeight: rm(28), marginBottom: rv(8) },
  heroCode:          { fontSize: rm(13), color: 'rgba(255,255,255,0.75)', marginBottom: rv(16) },
  heroCodeHighlight: { color: '#FFD166', fontWeight: '800' },
  heroBtn:           { flexDirection: 'row', alignItems: 'center', gap: rs(6), backgroundColor: C.accent, paddingVertical: rv(9), paddingHorizontal: rs(16), borderRadius: radius.lg, alignSelf: 'flex-start' },
  heroBtnText:       { color: C.white, fontWeight: '700', fontSize: rm(13) },
  heroDeco1:         { position: 'absolute', right: rs(-30), top: rs(-30), width: rs(140), height: rs(140), borderRadius: rs(70), backgroundColor: 'rgba(255,255,255,0.07)' },
  heroDeco2:         { position: 'absolute', right: rs(20), bottom: rs(-40), width: rs(100), height: rs(100), borderRadius: rs(50), backgroundColor: 'rgba(255,255,255,0.07)' },
  heroEmoji:         { position: 'absolute', right: rs(16), top: '50%', fontSize: rs(56), opacity: 0.9 },

  /* Section */
  sectionRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(14) },
  sectionTitle:      { fontSize: rm(17), fontWeight: '700', color: C.text, marginBottom: rv(14) },
  seeAll:            { fontSize: rm(13), color: C.primary, fontWeight: '600' },

  /* Quick Links */
  quickGrid:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rv(28), gap: rs(10) },
  quickCard:         { flex: 1, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', paddingVertical: rv(18), elevation: 0 },
  quickEmoji:        { fontSize: rs(28), marginBottom: rv(8) },
  quickLabel:        { fontSize: rm(12), fontWeight: '600', color: C.text, textAlign: 'center' },

  /* Med cards */
  medList:           { marginBottom: rv(24), gap: rs(10) },
  medCard:           { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: radius.lg, padding: rs(14), borderWidth: 1, borderColor: C.border, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  medIconWrap:       { width: rs(50), height: rs(50), borderRadius: rs(12), backgroundColor: '#EEF8F6', alignItems: 'center', justifyContent: 'center', marginRight: rs(12) },
  medInfo:           { flex: 1 },
  medName:           { fontSize: rm(15), fontWeight: '700', color: C.text },
  medDosage:         { fontSize: rm(13), fontWeight: '400', color: C.sub },
  medTagWrap:        { marginTop: rv(4), alignSelf: 'flex-start', backgroundColor: C.primaryLight, borderRadius: radius.full, paddingHorizontal: rs(8), paddingVertical: rv(2) },
  medTag:            { fontSize: rm(11), color: C.primary, fontWeight: '600' },
  medPrice:          { fontSize: rm(16), fontWeight: '800', color: C.primary },

  /* Prescription Banner */
  prescriptionBanner:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0D1B2A', borderRadius: radius.xl, padding: rs(20), marginBottom: rv(16) },
  prescriptionTitle: { fontSize: rm(16), fontWeight: '700', color: C.white, marginBottom: rv(4) },
  prescriptionSub:   { fontSize: rm(12), color: 'rgba(255,255,255,0.55)' },
  prescriptionArrow: { width: rs(40), height: rs(40), borderRadius: rs(20), backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },

  /* Modal */
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:        { backgroundColor: C.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.md, paddingBottom: rv(40), maxHeight: '78%' },
  modalHandle:       { width: rs(40), height: rv(4), borderRadius: rv(2), backgroundColor: C.border, alignSelf: 'center', marginTop: rv(12), marginBottom: rv(16) },
  modalHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(16) },
  modalTitle:        { fontSize: rm(18), fontWeight: '700', color: C.text },
  closeBtn:          { padding: rs(8), borderRadius: rs(8), backgroundColor: C.bg },
  emptyModal:        { textAlign: 'center', color: C.sub, fontSize: rm(15), marginVertical: rv(32) },
  addressCard:       { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: C.bg, borderRadius: radius.md, marginBottom: rv(10), borderWidth: 1, borderColor: C.border },
  addressIcon:       { width: rs(36), height: rs(36), borderRadius: rs(10), backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: rs(12) },
  addressTitle:      { fontSize: rm(15), fontWeight: '600', color: C.text, marginBottom: rv(2) },
  addressSub:        { fontSize: rm(12), color: C.sub },
});
