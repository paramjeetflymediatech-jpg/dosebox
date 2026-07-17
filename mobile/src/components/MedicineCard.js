import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { rs, rv, rm, radius } from '../utils/responsive';
import { getFullImageUrl } from '../utils/image';

const C = {
  primary: '#0c888d', 
  primaryLight: '#EAF4F2',
  accent: '#e68a7f', 
  bg: '#F8FAFC',
  white: '#FFFFFF',
  text: '#2d3748', 
  sub: '#8c8c8c', 
  border: '#E9EDF2',
  card: '#FFFFFF',
  red: '#e68a7f',
};

export default function MedicineCard({ med, containerStyle, compact = false }) {
  const navigation = useNavigation();
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    const imageUri = getFullImageUrl(med.images || med.image);

    addToCart({
      id: med.id,
      name: med.name,
      price: Number(med.price),
      discountPrice: med.discountPrice ? Number(med.discountPrice) : undefined,
      prescriptionRequired: med.prescriptionRequired,
      image: imageUri,
      qty: 1
    });
  };

  const displayImage = getFullImageUrl(med.images || med.image);

  const discPrice = med.discountPrice ? Number(med.discountPrice) : null;
  const price = Number(med.price);
  const savings = discPrice ? Math.round(((price - discPrice) / price) * 100) : 0;

  return (
    <View style={[styles.medCardContainer, containerStyle]}>
      <View style={[styles.medCardHeader, compact && { top: rv(8), left: rs(8), right: rs(8) }]}>
        {med.prescriptionRequired ? (
          <View style={[styles.rxBadge, compact && { paddingHorizontal: rs(4), paddingVertical: rv(1) }]}>
            <Text style={[styles.rxBadgeText, compact && { fontSize: rm(7) }]}>RX</Text>
          </View>
        ) : <View />}
        {savings > 0 && (
          <View style={[styles.saveBadge, compact && { paddingHorizontal: rs(4), paddingVertical: rv(1) }]}>
            <Text style={[styles.saveBadgeText, compact && { fontSize: rm(8) }]}>-{savings}%</Text>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.medImageWrap, compact && { height: rv(80), marginTop: rv(16) }]} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('MedicineDetail', { medicine: med })}
      >
        {displayImage ? (
          <Image source={{ uri: displayImage }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        ) : (
          <Ionicons name="medical" size={compact ? 30 : 40} color="#E2E8F0" />
        )}
      </TouchableOpacity>

      <View style={styles.medDetails}>
        <Text style={[styles.medBrandText, compact && { fontSize: rm(8) }]} numberOfLines={1}>
          {med.packSize || 'Strip of 10 Tablets'} • {med.brand?.name || 'DoseBox Speciality'}
        </Text>
        <Text style={[styles.medNameText, compact && { fontSize: rm(11), height: rv(32) }]} numberOfLines={2}>{med.name}</Text>
        <View style={styles.medRatingRow}>
          <Ionicons name="star" size={compact ? 8 : 10} color="#f6a041" />
          <Text style={[styles.medRatingText, compact && { fontSize: rm(9) }]}>4.8 (42)</Text>
        </View>
      </View>

      <View style={styles.medFooter}>
        <View style={styles.medPriceBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={[styles.medOldPrice, compact && { fontSize: rm(9) }]}>₹{price}</Text>
            {savings > 0 && <Text style={[styles.medSaveText, compact && { fontSize: rm(8), marginLeft: rs(2) }]}>-{savings}% Swap</Text>}
          </View>
          <Text style={[styles.medNewPrice, compact && { fontSize: rm(15) }]}>₹{discPrice ? discPrice : price}</Text>
        </View>
        <View style={[styles.medActions, compact && { gap: rs(4) }]}>
          {!compact && (
            <TouchableOpacity style={styles.medEyeBtn} onPress={() => navigation.navigate('MedicineDetail', { medicine: med })}>
              <Ionicons name="eye-outline" size={16} color={C.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.medAddBtn, compact && { width: rs(24), height: rs(24), borderRadius: rs(12) }]} onPress={handleAddToCart}>
            <Ionicons name="add" size={compact ? 16 : 18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  medCardContainer: { 
    width: rs(220), 
    backgroundColor: C.white, 
    borderRadius: radius.xl, 
    borderWidth: 1, 
    borderColor: 'rgba(27,141,145,0.4)', 
    padding: rs(12), 
    elevation: 1, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4 
  },
  medCardHeader: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 10, position: 'absolute', top: rv(12), left: rs(12), right: rs(12) },
  rxBadge: { backgroundColor: '#f0ecec', borderWidth: 1, borderColor: '#e6dfdf', paddingHorizontal: rs(6), paddingVertical: rv(2), borderRadius: 4 },
  rxBadgeText: { fontSize: rm(8), fontWeight: '800', color: '#786c6c' },
  saveBadge: { backgroundColor: C.accent, paddingHorizontal: rs(8), paddingVertical: rv(2), borderRadius: radius.full },
  saveBadgeText: { fontSize: rm(9), fontWeight: '800', color: C.white },
  medImageWrap: { height: rv(120), alignItems: 'center', justifyContent: 'center', marginTop: rv(24), marginBottom: rv(8) },
  medDetails: { marginBottom: rv(12) },
  medBrandText: { fontSize: rm(9), fontWeight: '700', color: '#8c8c8c', textTransform: 'uppercase', marginBottom: rv(4) },
  medNameText: { fontSize: rm(13), fontWeight: '700', color: C.text, lineHeight: rv(18), height: rv(36) },
  medRatingRow: { flexDirection: 'row', alignItems: 'center', marginTop: rv(4), gap: rs(4) },
  medRatingText: { fontSize: rm(10), fontWeight: '600', color: '#9b9b9b' },
  medFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' },
  medPriceBox: { flex: 1 },
  medOldPrice: { fontSize: rm(10), color: '#9b9b9b', textDecorationLine: 'line-through', fontWeight: '600' },
  medSaveText: { fontSize: rm(9), color: C.accent, fontWeight: '700', marginLeft: rs(4) },
  medNewPrice: { fontSize: rm(18), fontWeight: '800', color: C.primary, marginTop: rv(2) },
  medActions: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  medEyeBtn: { width: rs(28), height: rs(28), borderRadius: rs(14), borderWidth: 1, borderColor: 'rgba(12,136,141,0.3)', alignItems: 'center', justifyContent: 'center' },
  medAddBtn: { width: rs(28), height: rs(28), borderRadius: rs(14), backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
});
