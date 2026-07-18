import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { rs, rv, rm, radius } from '../utils/responsive';

export default function Skeleton({ width, height, borderRadius, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius: borderRadius || 8, opacity },
        style,
      ]}
    />
  );
}

export function MedicineCardSkeleton({ compact = false, containerStyle }) {
  return (
    <View style={[styles.medCardContainer, containerStyle]}>
      {/* Header Badges Space */}
      <View style={[styles.medCardHeader, compact && { top: rv(8), left: rs(8), right: rs(8) }]}>
        <Skeleton width={rs(30)} height={rv(12)} borderRadius={4} />
      </View>

      {/* Image Space */}
      <View style={[styles.medImageWrap, compact && { height: rv(80), marginTop: rv(16) }]}>
        <Skeleton width={compact ? rs(60) : rs(100)} height={compact ? rv(60) : rv(100)} borderRadius={8} />
      </View>

      {/* Details Space */}
      <View style={styles.medDetails}>
        <Skeleton width="60%" height={rv(12)} borderRadius={4} style={{ marginBottom: rv(6) }} />
        <Skeleton width="90%" height={rv(16)} borderRadius={4} style={{ marginBottom: rv(4) }} />
        <Skeleton width="40%" height={rv(16)} borderRadius={4} />
      </View>

      {/* Footer Space */}
      <View style={styles.medFooter}>
        <View style={styles.medPriceBox}>
          <Skeleton width={rs(40)} height={rv(12)} borderRadius={4} style={{ marginBottom: rv(4) }} />
          <Skeleton width={rs(60)} height={rv(20)} borderRadius={4} />
        </View>
        <View style={[styles.medActions, compact && { gap: rs(4) }]}>
          {!compact && <Skeleton width={rs(28)} height={rs(28)} borderRadius={rs(14)} />}
          <Skeleton width={compact ? rs(24) : rs(28)} height={compact ? rs(24) : rs(28)} borderRadius={compact ? rs(12) : rs(14)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E2E8F0',
  },
  medCardContainer: { 
    width: rs(220), 
    backgroundColor: '#FFFFFF', 
    borderRadius: radius.xl, 
    borderWidth: 1, 
    borderColor: 'rgba(27,141,145,0.1)', 
    padding: rs(12), 
    elevation: 1, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4 
  },
  medCardHeader: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 10, position: 'absolute', top: rv(12), left: rs(12), right: rs(12) },
  medImageWrap: { height: rv(120), alignItems: 'center', justifyContent: 'center', marginTop: rv(24), marginBottom: rv(8) },
  medDetails: { marginBottom: rv(12) },
  medFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' },
  medPriceBox: { flex: 1 },
  medActions: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
});
