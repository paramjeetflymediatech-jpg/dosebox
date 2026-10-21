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
  text: '#0F172A', // High-contrast deep slate text
  sub: '#64748B',  // Readable slate-500 text
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
  const packInfo = med.packSize || 'Strip of 10 Tablets';
  const brandName = med.brand?.name || med.manufacturer || 'DoseBox Generics';

  return (
    <TouchableOpacity
      style={[
        styles.medCardContainer,
        compact && styles.medCardContainerCompact,
        containerStyle
      ]}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('MedicineDetail', { medicine: med })}
    >
      {/* ── Badges Header ── */}
      <View style={[styles.medCardHeader, compact && { marginBottom: rv(3) }]}>
        <View style={styles.badgeRow}>
          {med.prescriptionRequired ? (
            <View style={[styles.rxBadge, compact && { paddingHorizontal: rs(4), paddingVertical: rv(1) }]}>
              <Text style={[styles.rxBadgeText, compact && { fontSize: rm(7.5) }]}>RX</Text>
            </View>
          ) : null}
          {(med.coldChain || med.isColdChain || med.storageInstructions === 'Cold Chain') ? (
            <View style={[styles.coldBadge, compact && { paddingHorizontal: rs(4), paddingVertical: rv(1) }]}>
              <Text style={[styles.coldBadgeText, compact && { fontSize: rm(7.5) }]}>❄ COLD</Text>
            </View>
          ) : null}
          {med.papOffer ? (
            <View style={[styles.papBadge, compact && { paddingHorizontal: rs(4), paddingVertical: rv(1) }]}>
              <Text style={[styles.papBadgeText, compact && { fontSize: rm(7.5) }]}>🎁 PAP</Text>
            </View>
          ) : null}
        </View>

        {savings > 0 && (
          <View style={[styles.saveBadge, compact && { paddingHorizontal: rs(5), paddingVertical: rv(1) }]}>
            <Text style={[styles.saveBadgeText, compact && { fontSize: rm(8.5) }]}>{savings}% OFF</Text>
          </View>
        )}
      </View>

      {/* ── Product Image ── */}
      <View style={[styles.medImageWrap, compact && styles.medImageWrapCompact]}>
        {displayImage && !imgFailed ? (
          <Image
            source={{ uri: displayImage }}
            style={styles.medImage}
            resizeMode="contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Ionicons name="medical" size={compact ? 22 : 32} color="#CBD5E1" />
        )}
      </View>

      {/* ── Medicine Details ── */}
      <View style={[styles.medDetails, compact && { marginBottom: rv(2) }]}>
        <Text style={[styles.medBrandText, compact && styles.medBrandTextCompact]} numberOfLines={1} ellipsizeMode="tail">
          {packInfo} • {brandName}
        </Text>
        <Text style={[styles.medNameText, compact && styles.medNameTextCompact]} numberOfLines={compact ? 1 : 2} ellipsizeMode="tail">
          {med.name}
        </Text>
        {molecule ? (
          <Text style={[styles.moleculeText, compact && styles.moleculeTextCompact]} numberOfLines={1} ellipsizeMode="tail">
            {molecule}
          </Text>
        ) : null}
        {/* Rating Section - Commented Out
        <View style={styles.medRatingRow}>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <Text style={styles.medRatingText}>4.8 (42)</Text>
          {med.hsnCode ? (
            <Text style={styles.medHsnText}>HSN: {med.hsnCode}</Text>
          ) : null}
        </View>
        */}
      </View>

      {/* ── Price and Add to Cart Footer ── */}
      <View style={[styles.medFooter, compact && { paddingTop: rv(4) }]}>
        <View style={styles.medPriceBox}>
          <View style={[styles.oldPriceRow, compact && { gap: rs(2) }]}>
            {discPrice && discPrice < price ? (
              <Text style={[styles.medOldPrice, compact && { fontSize: rm(9.5) }]}>₹{price}</Text>
            ) : null}
            {savings > 0 && (
              <Text style={[styles.medSaveText, compact && { fontSize: rm(9) }]} numberOfLines={1}>
                Save ₹{Math.round(price - discPrice)}
              </Text>
            )}
          </View>
          <Text style={[styles.medNewPrice, compact && styles.medNewPriceCompact]}>
            ₹{discPrice ? discPrice : price}
          </Text>
        </View>

        <View style={styles.medActions}>
          <TouchableOpacity
            style={[styles.medAddBtn, compact && styles.medAddBtnCompact]}
            onPress={handleAddToCart}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Add ${med.name} to cart`}
          >
            <Ionicons name="cart-outline" size={compact ? 14 : 17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  medCardContainer: {
    width: rs(180),
    minHeight: rv(275),
    backgroundColor: C.white,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: rs(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    justifyContent: 'space-between',
  },
  medCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    marginBottom: rv(6),
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(3),
    flexWrap: 'wrap',
    flex: 1,
  },
  rxBadge: {
    backgroundColor: '#3B1D60',
    paddingHorizontal: rs(5),
    paddingVertical: rv(2),
    borderRadius: 4,
  },
  rxBadgeText: {
    fontSize: rm(8.5),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  coldBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: rs(5),
    paddingVertical: rv(2),
    borderRadius: 4,
  },
  coldBadgeText: {
    fontSize: rm(8.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  papBadge: {
    backgroundColor: '#D97706',
    paddingHorizontal: rs(5),
    paddingVertical: rv(2),
    borderRadius: 4,
  },
  papBadgeText: {
    fontSize: rm(8.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  saveBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: rs(6),
    paddingVertical: rv(2),
    borderRadius: radius.full,
    marginLeft: rs(4),
  },
  saveBadgeText: {
    fontSize: rm(9.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  medImageWrap: {
    height: rv(100),
    backgroundColor: C.white,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rv(8),
    padding: rs(6),
    overflow: 'hidden',
  },
  medImage: {
    width: '100%',
    height: '100%',
  },
  medDetails: {
    flex: 1,
    marginBottom: rv(6),
  },
  medBrandText: {
    fontSize: rm(10.5),
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: rv(3),
  },
  medNameText: {
    fontSize: rm(13),
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: Math.max(17, rv(17)),
    minHeight: rv(34),
    marginBottom: rv(2),
  },
  moleculeText: {
    fontSize: rm(10.5),
    fontWeight: '600',
    color: '#0284C7',
    marginBottom: rv(3),
    textTransform: 'uppercase',
  },
  medRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rv(2),
    gap: rs(3),
  },
  medRatingText: {
    fontSize: rm(11),
    fontWeight: '700',
    color: '#475569',
  },
  medHsnText: {
    fontSize: rm(10),
    fontWeight: '700',
    color: '#0D9488',
    marginLeft: 'auto',
  },
  medFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: rv(6),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  medPriceBox: {
    flex: 1,
    marginRight: rs(4),
  },
  oldPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: rs(4),
  },
  medOldPrice: {
    fontSize: rm(11),
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  medSaveText: {
    fontSize: rm(10.5),
    color: '#059669',
    fontWeight: '700',
  },
  medNewPrice: {
    fontSize: rm(16.5),
    fontWeight: '800',
    color: '#0C888D',
    marginTop: rv(1),
  },
  medActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medAddBtn: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    backgroundColor: '#0C888D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0C888D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },

  /* ── Compact Grid Overrides (For 6-card Viewport) ── */
  medCardContainerCompact: {
    minHeight: rv(190),
    padding: rs(8),
    borderRadius: radius.lg,
    justifyContent: 'space-between',
  },
  medImageWrapCompact: {
    height: rv(90),
    backgroundColor: C.white,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rv(5),
    padding: rs(4),
    overflow: 'hidden',
  },
  medBrandTextCompact: {
    fontSize: rm(9),
    marginBottom: rv(1),
  },
  medNameTextCompact: {
    fontSize: rm(12),
    lineHeight: rv(16),
    minHeight: rv(16),
    marginBottom: rv(1),
  },
  moleculeTextCompact: {
    fontSize: rm(9.5),
    marginBottom: rv(2),
  },
  medNewPriceCompact: {
    fontSize: rm(14.5),
    marginTop: 0,
  },
  medAddBtnCompact: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
  },
});
