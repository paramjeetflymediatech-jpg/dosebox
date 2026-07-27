import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, useWindowDimensions, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCart } from '../../context/CartContext';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import { getFullImageUrl } from '../../utils/image';
import MedicineCard from '../../components/MedicineCard';
import RenderHtml from 'react-native-render-html';
import api from '../../services/api';

const C = {
  primary: '#1F5C52',
  primaryLight: '#EAF4F2',
  accent: '#e68a7f',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  text: '#0D1B2A',
  sub: '#64748B',
  border: '#E9EDF2',
  card: '#FFFFFF',
  yellow: '#F59E0B'
};

export default function MedicineDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { addToCart, cart, updateQty } = useCart();
  const { width } = useWindowDimensions();
  const initialMedicine = route?.params?.medicine;

  const [medicine, setMedicine] = useState(initialMedicine);
  const [qty, setQty] = useState(1);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    
    if (initialMedicine?.id) {
      api.get(`/medicines/${initialMedicine.id}`)
        .then(res => {
          if (res.data?.success) {
            setMedicine(res.data.data);
          }
        })
        .catch(err => console.log('Error fetching detailed medicine data:', err))
        .finally(() => setLoadingDetails(false));

      // Fetch related products
      api.get('/medicines?limit=6')
        .then(res => {
          if (res.data?.success) {
            setRelatedProducts(res.data.data.filter(m => m.id !== initialMedicine.id).slice(0, 5));
          }
        })
        .catch(err => console.log('Error fetching related medicines:', err));
    } else {
      setLoadingDetails(false);
    }
  }, [initialMedicine?.id]);

  if (!medicine) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Medicine not found.</Text>
      </SafeAreaView>
    );
  }

  const imageUri = getFullImageUrl(medicine.images || medicine.image);
  const price = Number(medicine.price);
  const discPrice = medicine.discountPrice ? Number(medicine.discountPrice) : null;
  const savings = discPrice ? Math.round(((price - discPrice) / price) * 100) : 0;
  const finalPrice = discPrice || price;

  const handleAddToCart = () => {
    addToCart({
      id: medicine.id,
      name: medicine.name,
      price: price,
      discountPrice: discPrice,
      prescriptionRequired: medicine.prescriptionRequired,
      image: imageUri,
      qty: qty
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{medicine.name}</Text>
        <View style={{ width: rs(24) }} />
      </View>

      <ScrollView ref={scrollViewRef} style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + rv(100) }} showsVerticalScrollIndicator={false}>
        
        {/* ── IMAGE SECTION ── */}
        <View style={styles.imageWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
          ) : (
            <Ionicons name="medical" size={100} color="#E2E8F0" />
          )}
          {medicine.prescriptionRequired && (
            <View style={styles.rxBadge}>
              <Text style={styles.rxText}>RX REQUIRED</Text>
            </View>
          )}
        </View>

        {/* ── BASIC DETAILS ── */}
        <View style={styles.section}>
          <Text style={styles.brandText}>{medicine.brand?.name || 'DoseBox Speciality'}</Text>
          <Text style={styles.title}>{medicine.name}</Text>
          <Text style={styles.packSize}>{medicine.packSize || 'Strip of 10 Tablets'}</Text>
          
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={C.white} />
              <Text style={styles.ratingVal}>4.8</Text>
            </View>
            <Text style={styles.ratingCount}>42 Ratings & 12 Reviews</Text>
          </View>
          
          <View style={styles.priceRow}>
            <View>
              <View style={styles.oldPriceRow}>
                <Text style={styles.oldPrice}>MRP ₹{price}</Text>
                {savings > 0 && <Text style={styles.saveText}>{savings}% OFF</Text>}
              </View>
              <Text style={styles.finalPrice}>₹{finalPrice}</Text>
            </View>
          </View>
        </View>

        {/* ── ABOUT PRODUCT ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Product</Text>
          <Text style={styles.descText}>{medicine.description || 'No description available for this product.'}</Text>
        </View>

        {/* ── COMPOSITION & DETAILS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Composition</Text>
          <Text style={styles.descText}>{medicine.composition || 'Not specified'}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{medicine.categoryDetail?.name || medicine.category?.name || 'General'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Manufacturer:</Text>
            <Text style={styles.detailValue}>{medicine.brand?.name || 'Not specified'}</Text>
          </View>
        </View>

        {/* ── DYNAMIC SECTIONS ── */}
        {medicine.sections && medicine.sections.map((sec, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <RenderHtml
              contentWidth={width - spacing.md * 2}
              source={{ html: sec.content || '' }}
              baseStyle={{ fontSize: rm(15), color: '#475569', lineHeight: rv(24) }}
            />
          </View>
        ))}

        {/* ── AUTHENTICITY BADGE ── */}
        {medicine.contentStatus === 'Approved' && medicine.verifierName && (
          <View style={[styles.section, { backgroundColor: '#F0FDFA', borderColor: '#CCFBF1', borderWidth: 1, borderRadius: radius.md, marginHorizontal: spacing.md, padding: spacing.md }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: rv(8) }}>
              <Ionicons name="shield-checkmark" size={rs(24)} color="#0D9488" />
              <Text style={{ fontSize: rm(14), fontWeight: '700', color: '#115E59', marginLeft: rs(8) }}>Medically Verified Content</Text>
            </View>
            <Text style={{ fontSize: rm(12), color: '#0F766E', lineHeight: rv(18) }}>
              This information has been checked and approved by {medicine.verifierName}.
            </Text>
            <Text style={{ fontSize: rm(12), color: '#0F766E', fontWeight: 'bold', marginTop: rv(4) }}>
              Reg No: {medicine.verifierRegNo || 'N/A'}
            </Text>
          </View>
        )}

        {/* ── RELATED PRODUCTS ── */}
        {relatedProducts.length > 0 && (
          <View style={[styles.section, { paddingRight: 0, backgroundColor: 'transparent' }]}>
            <Text style={styles.sectionTitle}>Related Products</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={relatedProducts}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <MedicineCard med={item} containerStyle={{ marginRight: rs(12), width: rs(160) }} />
              )}
              contentContainerStyle={{ paddingRight: spacing.md }}
            />
          </View>
        )}
      </ScrollView>

      {/* ── BOTTOM STICKY BAR ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, rv(16)) }]}>
        <View style={styles.qtyWrap}>
          <TouchableOpacity 
            style={styles.qtyBtn} 
            onPress={() => setQty(Math.max(1, qty - 1))}
          >
            <Ionicons name="remove" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{qty}</Text>
          <TouchableOpacity 
            style={styles.qtyBtn} 
            onPress={() => setQty(qty + 1)}
          >
            <Ionicons name="add" size={20} color={C.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addCartBtn} onPress={handleAddToCart} activeOpacity={0.8}>
          <Text style={styles.addCartBtnText}>Add to Cart</Text>
          <Text style={styles.addCartTotal}>₹{finalPrice * qty}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  errorText: { textAlign: 'center', marginTop: rv(40), fontSize: rm(16), color: C.text },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: rv(12), backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { padding: rs(4) },
  headerTitle: { flex: 1, fontSize: rm(18), fontWeight: '700', color: C.text, textAlign: 'center', marginHorizontal: rs(12) },
  
  scroll: { flex: 1 },
  
  imageWrap: { backgroundColor: C.white, height: rv(280), alignItems: 'center', justifyContent: 'center', marginBottom: rv(8), position: 'relative' },
  image: { width: '80%', height: '80%' },
  rxBadge: { position: 'absolute', top: rv(16), left: rs(16), backgroundColor: '#f0ecec', paddingHorizontal: rs(8), paddingVertical: rv(4), borderRadius: 6, borderWidth: 1, borderColor: '#e6dfdf' },
  rxText: { fontSize: rm(10), fontWeight: '800', color: '#786c6c' },
  
  section: { backgroundColor: C.white, padding: spacing.md, marginBottom: rv(8) },
  brandText: { fontSize: rm(13), color: C.sub, fontWeight: '600', textTransform: 'uppercase', marginBottom: rv(6) },
  title: { fontSize: rm(22), fontWeight: '700', color: C.text, marginBottom: rv(6), lineHeight: rv(28) },
  packSize: { fontSize: rm(15), color: C.sub, marginBottom: rv(16) },
  
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: rv(20) },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22C55E', paddingHorizontal: rs(8), paddingVertical: rv(4), borderRadius: radius.sm, gap: rs(4), marginRight: rs(12) },
  ratingVal: { fontSize: rm(13), fontWeight: '700', color: C.white },
  ratingCount: { fontSize: rm(13), color: C.sub },
  
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: C.border, paddingTop: rv(16) },
  oldPriceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: rv(4) },
  oldPrice: { fontSize: rm(14), color: C.sub, textDecorationLine: 'line-through' },
  saveText: { fontSize: rm(12), color: C.accent, fontWeight: '700', marginLeft: rs(8) },
  finalPrice: { fontSize: rm(28), fontWeight: '800', color: C.text },
  
  sectionTitle: { fontSize: rm(18), fontWeight: '700', color: C.text, marginBottom: rv(12) },
  descText: { fontSize: rm(15), color: '#475569', lineHeight: rv(24) },
  
  divider: { height: 1, backgroundColor: C.border, marginVertical: rv(16) },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rv(8) },
  detailLabel: { fontSize: rm(14), color: C.sub, flex: 1 },
  detailValue: { fontSize: rm(14), color: C.text, fontWeight: '500', flex: 2, textAlign: 'right' },
  
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.white, flexDirection: 'row', paddingHorizontal: spacing.md, paddingTop: rv(12), borderTopWidth: 1, borderTopColor: C.border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 10 },
  qtyWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: radius.md, marginRight: rs(16), height: rv(48) },
  qtyBtn: { width: rs(40), height: '100%', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: rm(16), fontWeight: '700', color: C.text, minWidth: rs(30), textAlign: 'center' },
  
  addCartBtn: { flex: 1, backgroundColor: C.primary, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: rs(20), height: rv(48) },
  addCartBtnText: { fontSize: rm(16), fontWeight: '700', color: C.white },
  addCartTotal: { fontSize: rm(16), fontWeight: '800', color: C.white }
});
