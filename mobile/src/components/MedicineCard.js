import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { rs, rv, rm, radius, isTablet } from '../utils/responsive';
import { getFullImageUrl } from '../utils/image';

const C = {
  primary: '#0c888d',
  primaryLight: '#EAF4F2',
  accent: '#e68a7f',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  text: '#2d3748',
  sub: '#8c8c8c',
  border: '#E2E8F0',
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
  const [imgFailed, setImgFailed] = React.useState(false);

  const discPrice = med.discountPrice ? Number(med.discountPrice) : null;
  const price = Number(med.price);
  const savings = discPrice ? Math.round(((price - discPrice) / price) * 100) : 0;
  const molecule = med.molecule || med.composition || med.genericName || '';

  const cardWidth = containerStyle?.width;
  const isCompact = compact || (typeof cardWidth === 'number' && cardWidth < 200) || (!isTablet && !cardWidth);

  return (
    <TouchableOpacity
      style={[styles.medCardContainer, containerStyle]}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('MedicineDetail', { medicine: med })}
    >
      <View style={[styles.medCardHeader, isCompact && { top: rv(8), left: rs(8), right: rs(8) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(3), flexWrap: 'wrap', flex: 1 }}>
          {med.prescriptionRequired ? (
            <View style={[styles.rxBadge, isCompact && { paddingHorizontal: rs(4), paddingVertical: rv(1) }]}>
              <Text style={[styles.rxBadgeText, isCompact && { fontSize: rm(7) }]}>RX</Text>
            </View>
          ) : null}
          {med.coldChain ? (
            <View style={[styles.coldBadge, isCompact && { paddingHorizontal: rs(4), paddingVertical: rv(1) }]}>
              <Text style={[styles.coldBadgeText, isCompact && { fontSize: rm(7) }]}>❄ COLD</Text>
            </View>
          ) : null}
          {med.papOffer ? (
            <View style={[styles.papBadge, isCompact && { paddingHorizontal: rs(4), paddingVertical: rv(1) }]}>
              <Text style={[styles.papBadgeText, isCompact && { fontSize: rm(7) }]}>🎁 PAP</Text>
            </View>
          ) : null}
        </View>

        {savings > 0 && (
          <View style={[styles.saveBadge, isCompact && { paddingHorizontal: rs(5), paddingVertical: rv(1.5) }]}>
            <Text style={[styles.saveBadgeText, isCompact && { fontSize: rm(8) }]}>-{savings}%</Text>
          </View>
        )}
      </View>

      <View
        style={[styles.medImageWrap, isCompact && { height: rv(95), marginTop: rv(22) }]}
      >
        {displayImage && !imgFailed ? (
          <Image
            source={{ uri: displayImage }}
            style={styles.medImage}
            resizeMode="contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Ionicons name="medical" size={isCompact ? 28 : 36} color="#CBD5E1" />
        )}
      </View>

      <View style={styles.medDetails}>
        <Text style={[styles.medBrandText, isCompact && { fontSize: rm(8) }]} numberOfLines={1} ellipsizeMode="tail">
          {med.packSize || 'Strip of 10 Tablets'} • {med.brand?.name || 'DoseBox Generics'}
        </Text>
        <Text style={[styles.medNameText, isCompact && { fontSize: rm(11.5), minHeight: rv(28) }]} numberOfLines={2} ellipsizeMode="tail">
          {med.name}
        </Text>
        {molecule ? (
          <Text style={[styles.moleculeText, isCompact && { fontSize: rm(8.5) }]} numberOfLines={1} ellipsizeMode="tail">
            {molecule}
          </Text>
        ) : null}
        <View style={styles.medRatingRow}>
          <Ionicons name="star" size={isCompact ? 8 : 10} color="#f6a041" />
          <Text style={[styles.medRatingText, isCompact && { fontSize: rm(9) }]}>4.8 (42)</Text>
          {med.hsnCode ? (
            <Text style={[styles.medRatingText, isCompact && { fontSize: rm(8) }, { marginLeft: 'auto', fontWeight: '700', color: C.primary }]}>HSN: {med.hsnCode}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.medFooter}>
        <View style={styles.medPriceBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={[styles.medOldPrice, isCompact && { fontSize: rm(9) }]}>₹{price}</Text>
            {savings > 0 && (
              <Text style={[styles.medSaveText, isCompact && { fontSize: rm(8), marginLeft: rs(2) }]} numberOfLines={1}>
                Save {savings}%
              </Text>
            )}
          </View>
          <Text style={[styles.medNewPrice, isCompact && { fontSize: rm(15) }]}>₹{discPrice ? discPrice : price}</Text>
        </View>
        <View style={[styles.medActions, isCompact && { gap: rs(4) }]}>
          {!isCompact && (
            <TouchableOpacity style={styles.medEyeBtn} onPress={() => navigation.navigate('MedicineDetail', { medicine: med })}>
              <Ionicons name="eye-outline" size={16} color={C.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.medAddBtn, isCompact && { width: rs(28), height: rs(28), borderRadius: rs(14) }]}
            onPress={handleAddToCart}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="add" size={isCompact ? 18 : 20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  medCardContainer: {
    width: rs(200),
    backgroundColor: C.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: rs(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    justifyContent: 'space-between',
  },
  medCardHeader: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 10, position: 'absolute', top: rv(10), left: rs(10), right: rs(10) },
  rxBadge: { backgroundColor: '#3b1d60', paddingHorizontal: rs(6), paddingVertical: rv(2), borderRadius: 4 },
  rxBadgeText: { fontSize: rm(8), fontWeight: '800', color: '#FFFFFF' },
  coldBadge: { backgroundColor: '#0284C7', paddingHorizontal: rs(5), paddingVertical: rv(2), borderRadius: 4 },
  coldBadgeText: { fontSize: rm(8), fontWeight: '800', color: '#FFFFFF' },
  papBadge: { backgroundColor: '#D97706', paddingHorizontal: rs(5), paddingVertical: rv(2), borderRadius: 4 },
  papBadgeText: { fontSize: rm(8), fontWeight: '800', color: '#FFFFFF' },
  saveBadge: { backgroundColor: '#059669', paddingHorizontal: rs(7), paddingVertical: rv(2), borderRadius: radius.full },
  saveBadgeText: { fontSize: rm(9), fontWeight: '800', color: C.white },
  medImageWrap: {
    height: rv(110),
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rv(26),
    marginBottom: rv(8),
    padding: rs(6),
    overflow: 'hidden',
  },
  medImage: {
    width: '100%',
    height: '100%',
  },
  medDetails: { marginBottom: rv(8) },
  medBrandText: { fontSize: rm(9), fontWeight: '700', color: '#8c8c8c', textTransform: 'uppercase', marginBottom: rv(3) },
  medNameText: { fontSize: rm(13), fontWeight: '700', color: C.text, lineHeight: Math.max(17, rv(17)), minHeight: rv(32) },
  moleculeText: { fontSize: rm(9.5), fontWeight: '600', color: '#0284C7', textDecorationLine: 'underline', marginTop: rv(2), marginBottom: rv(2), textTransform: 'uppercase' },
  medRatingRow: { flexDirection: 'row', alignItems: 'center', marginTop: rv(3), gap: rs(4) },
  medRatingText: { fontSize: rm(10), fontWeight: '600', color: '#9b9b9b' },
  medFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' },
  medPriceBox: { flex: 1, marginRight: rs(4) },
  medOldPrice: { fontSize: rm(10), color: '#9b9b9b', textDecorationLine: 'line-through', fontWeight: '600' },
  medSaveText: { fontSize: rm(9), color: '#059669', fontWeight: '700', marginLeft: rs(4) },
  medNewPrice: { fontSize: rm(17), fontWeight: '800', color: C.primary, marginTop: rv(2) },
  medActions: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  medEyeBtn: { width: rs(28), height: rs(28), borderRadius: rs(14), borderWidth: 1, borderColor: 'rgba(12,136,141,0.3)', alignItems: 'center', justifyContent: 'center' },
  medAddBtn: { width: rs(28), height: rs(28), borderRadius: rs(14), backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
});
