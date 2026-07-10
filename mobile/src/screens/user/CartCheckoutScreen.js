import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingCart, ArrowRight, RotateCcw, ShieldCheck, Truck, ArrowLeft } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

const C = {
  primary:  '#1F5C52',
  bg:       '#F7F8FA',
  white:    '#FFFFFF',
  text:     '#0D1B2A',
  sub:      '#64748B',
  border:   '#E9EDF2',
  light:    '#EAF4F2',
};

const PERKS = [
  { icon: RotateCcw,   title: 'Easy Returns',     sub: '7-day hassle-free return policy' },
  { icon: ShieldCheck, title: 'Secure Payment',    sub: '100% encrypted & safe checkout' },
  { icon: Truck,       title: 'Fast Delivery',     sub: 'Delivered to your door in 2–4 hrs' },
];

// ─── Empty Cart State ─────────────────────────────────────────
function EmptyCart({ onExplore }) {
  return (
    <View style={emptyStyles.root}>
      {/* Big Cart Icon */}
      <View style={emptyStyles.iconWrap}>
        <View style={emptyStyles.iconCircle}>
          <ShoppingCart size={rs(52)} color={C.primary} strokeWidth={1.4} />
        </View>
        {/* Floating dot decoration */}
        <View style={emptyStyles.dot1} />
        <View style={emptyStyles.dot2} />
      </View>

      <Text style={emptyStyles.title}>Your cart is empty</Text>
      <Text style={emptyStyles.sub}>
        Looks like you haven't added{'\n'}any medicines yet.
      </Text>

      {/* Perk Cards */}
      <View style={emptyStyles.perks}>
        {PERKS.map(({ icon: Icon, title, sub }) => (
          <View key={title} style={emptyStyles.perkRow}>
            <View style={emptyStyles.perkIconWrap}>
              <Icon size={rs(18)} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={emptyStyles.perkTitle}>{title}</Text>
              <Text style={emptyStyles.perkSub}>{sub}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA Button */}
      <TouchableOpacity style={emptyStyles.btn} onPress={onExplore} activeOpacity={0.85}>
        <Text style={emptyStyles.btnText}>Explore Medicines</Text>
        <View style={emptyStyles.btnArrow}>
          <ArrowRight size={rs(18)} color={C.white} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function CartCheckoutScreen({ navigation }) {
  const { items, totalPrice } = useCart();
  const { selectedAddress } = useLocation();
  const insets = useSafeAreaInsets();

  const deliveryFee = items.length > 0 ? 5.00 : 0.00;
  const finalTotal  = totalPrice + deliveryFee;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={rs(22)} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        {items.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{items.length}</Text>
          </View>
        )}
      </View>

      {items.length === 0 ? (
        /* ── EMPTY STATE ── */
        <EmptyCart onExplore={() => navigation.navigate('ExploreTab')} />
      ) : (
        /* ── FILLED STATE ── */
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: rv(120) }}
            showsVerticalScrollIndicator={false}
          >
            {/* Items */}
            <Text style={styles.sectionLabel}>Cart Items</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.cartRow}>
                <View style={styles.cartItemIcon}>
                  <Text style={{ fontSize: rs(22) }}>💊</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>Qty: {item.qty}</Text>
                </View>
                <Text style={styles.itemPrice}>${(item.price * item.qty).toFixed(2)}</Text>
              </View>
            ))}

            {/* Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${totalPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${finalTotal.toFixed(2)}</Text>
              </View>
            </View>

            {/* Address */}
            <Text style={styles.sectionLabel}>Delivery Address</Text>
            <View style={styles.addressCard}>
              <Text style={styles.addressText}>
                {selectedAddress
                  ? `${selectedAddress.title} — ${selectedAddress.street}, ${selectedAddress.city}`
                  : 'No address selected. Please select one on the home screen.'}
              </Text>
            </View>
          </ScrollView>

          {/* Place Order Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + rv(16) }]}>
            <TouchableOpacity
              style={styles.placeOrderBtn}
              onPress={() => navigation.navigate('OrderTracking', { status: 'Pending Pharmacist Approval' })}
              activeOpacity={0.85}
            >
              <Text style={styles.placeOrderText}>Place Order</Text>
              <ArrowRight size={rs(20)} color={C.white} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// ─── Styles: Main ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.bg },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: rv(16), backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:       { width: rs(38), height: rs(38), borderRadius: rs(10), backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', marginRight: rs(12) },
  headerTitle:   { flex: 1, fontSize: rm(20), fontWeight: '700', color: C.text },
  countBadge:    { backgroundColor: C.primary, paddingHorizontal: rs(10), paddingVertical: rv(4), borderRadius: radius.full },
  countText:     { color: C.white, fontSize: rm(12), fontWeight: '700' },
  scroll:        { flex: 1 },
  sectionLabel:  { fontSize: rm(13), fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: rv(20), marginBottom: rv(12) },
  cartRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: radius.lg, padding: rs(14), marginBottom: rv(10), borderWidth: 1, borderColor: C.border },
  cartItemIcon:  { width: rs(44), height: rs(44), borderRadius: rs(10), backgroundColor: C.light, alignItems: 'center', justifyContent: 'center', marginRight: rs(12) },
  itemName:      { fontSize: rm(15), fontWeight: '600', color: C.text },
  itemQty:       { fontSize: rm(13), color: C.sub, marginTop: rv(3) },
  itemPrice:     { fontSize: rm(16), fontWeight: '700', color: C.primary },
  summaryCard:   { backgroundColor: C.white, borderRadius: radius.lg, padding: rs(16), marginTop: rv(4), marginBottom: rv(8), borderWidth: 1, borderColor: C.border },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rv(10) },
  summaryLabel:  { fontSize: rm(14), color: C.sub },
  summaryValue:  { fontSize: rm(14), color: C.text, fontWeight: '500' },
  totalRow:      { borderTopWidth: 1, borderTopColor: C.border, paddingTop: rv(12), marginTop: rv(4), marginBottom: 0 },
  totalLabel:    { fontSize: rm(17), fontWeight: '700', color: C.text },
  totalValue:    { fontSize: rm(17), fontWeight: '800', color: C.primary },
  addressCard:   { backgroundColor: C.white, borderRadius: radius.lg, padding: rs(16), borderWidth: 1, borderColor: C.border },
  addressText:   { fontSize: rm(14), color: C.text, lineHeight: rv(22) },
  footer:        { paddingHorizontal: spacing.md, paddingTop: rv(12), backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border },
  placeOrderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), backgroundColor: C.primary, paddingVertical: rv(16), borderRadius: radius.lg },
  placeOrderText:{ color: C.white, fontSize: rm(16), fontWeight: '700' },
});

// ─── Styles: Empty ────────────────────────────────────────────
const emptyStyles = StyleSheet.create({
  root:          { flex: 1, alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: rv(40) },
  iconWrap:      { position: 'relative', marginBottom: rv(28) },
  iconCircle:    { width: rs(130), height: rs(130), borderRadius: rs(65), backgroundColor: C.light, alignItems: 'center', justifyContent: 'center' },
  dot1:          { position: 'absolute', top: rs(8), right: rs(-4), width: rs(16), height: rs(16), borderRadius: rs(8), backgroundColor: '#C8E6E0' },
  dot2:          { position: 'absolute', bottom: rs(12), left: rs(-8), width: rs(10), height: rs(10), borderRadius: rs(5), backgroundColor: '#B2D8D0' },
  title:         { fontSize: rm(24), fontWeight: '800', color: C.text, marginBottom: rv(8), textAlign: 'center' },
  sub:           { fontSize: rm(14), color: C.sub, textAlign: 'center', lineHeight: rv(22), marginBottom: rv(36) },
  perks:         { width: '100%', marginBottom: rv(36), gap: rv(14) },
  perkRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: radius.lg, padding: rs(16), borderWidth: 1, borderColor: C.border, gap: rs(14) },
  perkIconWrap:  { width: rs(40), height: rs(40), borderRadius: rs(10), backgroundColor: C.light, alignItems: 'center', justifyContent: 'center' },
  perkTitle:     { fontSize: rm(14), fontWeight: '700', color: C.text, marginBottom: rv(2) },
  perkSub:       { fontSize: rm(12), color: C.sub },
  btn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: C.primary, borderRadius: radius.xl, paddingVertical: rv(16), paddingHorizontal: rs(24) },
  btnText:       { color: C.white, fontSize: rm(16), fontWeight: '700' },
  btnArrow:      { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});
