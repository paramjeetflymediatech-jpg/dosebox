import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Linking,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { AlertService } from '../../services/AlertService';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import api from '../../services/api';
import { getFullImageUrl } from '../../utils/image';
import PermissionsService from '../../services/PermissionsService';
import Geolocation from '@react-native-community/geolocation';

const C = {
  primary: '#1F5C52',
  bg: '#F7F8FA',
  white: '#FFFFFF',
  text: '#0D1B2A',
  sub: '#64748B',
  border: '#E9EDF2',
  light: '#EAF4F2',
};

const PERKS = [
  { icon: 'refresh-outline', title: 'Easy Returns', sub: '7-day hassle-free return policy' },
  { icon: 'shield-checkmark-outline', title: 'Secure Payment', sub: '100% encrypted & safe checkout' },
  { icon: 'car-outline', title: 'Fast Delivery', sub: 'Delivered to your door in 2–4 hrs' },
];

// ─── Empty Cart State ─────────────────────────────────────────
function EmptyCart({ onExplore }) {
  return (
    <View style={emptyStyles.root}>
      {/* Big Cart Icon */}
      <View style={emptyStyles.iconWrap}>
        <View style={emptyStyles.iconCircle}>
          <Ionicons name="cart-outline" size={rs(52)} color={C.primary} />
        </View>
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
              <Ionicons name={Icon} size={rs(18)} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={emptyStyles.perkTitle}>{title}</Text>
              <Text style={emptyStyles.perkSub}>{sub}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={emptyStyles.btn} onPress={onExplore} activeOpacity={0.85}>
        <Text style={emptyStyles.btnText}>Explore Medicines</Text>
        <View style={emptyStyles.btnArrow}>
          <Ionicons name="arrow-forward" size={rs(18)} color={C.white} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function CartCheckoutScreen({ navigation }) {
  const { items, totalPrice, clearCart, addToCart, removeFromCart, attachedPrescriptionStatus, attachedPrescriptionId } = useCart();
  const { selectedAddress, selectAddress } = useLocation();
  const insets = useSafeAreaInsets();

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [currentStep, setCurrentStep] = useState(1);
  const [currentTokens, setCurrentTokens] = useState(0);
  const [useDoseboxTokens, setUseDoseboxTokens] = useState(false);
  const [pointsInput, setPointsInput] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('user').then(str => {
      if (str) {
        try {
          const u = JSON.parse(str);
          setCurrentTokens(u.doseboxTokens || 0);
        } catch (e) {}
      }
    });
  }, []);

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualStreet, setManualStreet] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [manualZip, setManualZip] = useState('');
  const [addressTitle, setAddressTitle] = useState('Home');
  const [searchQuery, setSearchQuery] = useState('');

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [appliedPromoObj, setAppliedPromoObj] = useState(null);
  const [isVerifyingPromo, setIsVerifyingPromo] = useState(false);
  const [showAdditionalCharges, setShowAdditionalCharges] = useState(false);

  const deliveryFee = items.length > 0 ? 50.00 : 0.00;

  const totalMRP = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartTotal = items.reduce((sum, item) => sum + (item.discountPrice || item.price) * item.qty, 0);
  const doseboxDiscount = totalMRP - cartTotal;

  let couponDiscount = 0;
  if (appliedPromoObj && cartTotal >= Number(appliedPromoObj.minOrderValue)) {
    if (appliedPromoObj.discountType === 'Percentage') {
      couponDiscount = cartTotal * (Number(appliedPromoObj.discountValue) / 100);
      if (appliedPromoObj.maxDiscount && couponDiscount > Number(appliedPromoObj.maxDiscount)) {
        couponDiscount = Number(appliedPromoObj.maxDiscount);
      }
    } else {
      couponDiscount = Number(appliedPromoObj.discountValue);
    }
  }

  const gstAmount = Math.max(0, cartTotal - couponDiscount) * 0.05;
  const finalTotal = Math.max(0, cartTotal - couponDiscount + gstAmount + deliveryFee);

  const pointsUsed = useDoseboxTokens ? Math.min(Number(pointsInput) || 0, currentTokens, finalTotal) : 0;
  let pointsError = '';
  if (useDoseboxTokens) {
    if (Number(pointsInput) > currentTokens) {
      pointsError = 'Cannot exceed your token balance';
    }
  }

  const finalPayable = Math.max(0, finalTotal - pointsUsed);

  const requiresPrescription = items.some(item => item.prescriptionRequired);
  const isRestricted = requiresPrescription && attachedPrescriptionStatus !== 'Approved';

  const fetchCurrentAddress = async () => {
    const hasPermission = await PermissionsService.requestLocationPermission();
    if (!hasPermission) return;

    setIsFetchingLocation(true);

    Geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Use OpenStreetMap Nominatim for free reverse geocoding
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
            headers: {
              'User-Agent': 'DoseBoxApp/1.0',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });

          if (!response.ok) throw new Error('Reverse geocoding failed');
          const data = await response.json();

          const address = data.address || {};

          const streetName = address.road || address.pedestrian || address.neighbourhood || address.suburb || 'Unknown Street';
          const city = address.city || address.town || address.village || address.county || '';
          const state = address.state || '';
          const zipCode = address.postcode || '';
          const country = address.country || '';

          const newAddress = {
            id: 'current_loc',
            title: 'Current Location',
            street: streetName,
            city: city,
            state: state,
            zipCode: zipCode,
            country: country,
          };

          setManualStreet(streetName);
          setManualCity(city);
          setManualState(state);
          setManualZip(zipCode);
          setAddressTitle('Current Location');

          selectAddress(newAddress);
        } catch (error) {
          console.error('Geocoding error:', error);
          AlertService.show({ type: 'error', title: 'Error', message: 'Could not get address from location.' });
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation Error:', error);
        AlertService.show({ type: 'error', title: 'Location Error', message: error.message || 'Failed to fetch device location.' });
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      AlertService.show({ type: 'error', title: 'Address Required', message: 'Please select or fetch a delivery address.' });
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Map items for backend
      const mappedItems = items.map(i => ({
        medicineId: i.id,
        quantity: i.qty
      }));

      const body = {
        items: mappedItems,
        shippingAddress: selectedAddress,
        paymentMethod: paymentMethod === 'COD' ? 'Cash on Delivery' : 'PhonePe',
        prescriptionId: attachedPrescriptionId || null,
        couponCode: appliedPromo || undefined,
        useDoseboxTokens: useDoseboxTokens && !pointsError,
        doseboxTokensToUse: pointsUsed
      };

      const res = await api.post('/orders', body);

      if (res.data && res.data.success) {
        const orderId = res.data.data.id;

        if (paymentMethod === 'PhonePe') {
          try {
            const phonepeRes = await api.post('/payments/phonepe/initiate', { orderId, client: 'mobile' });
            if (phonepeRes.data?.success && phonepeRes.data?.fullyPaidByTokens) {
              clearCart();
              AlertService.show({ type: 'success', title: 'Success', message: 'Order paid successfully with DoseBox Tokens!' });
              navigation.replace('OrderTracking', { order: res.data.data });
              return;
            }
            if (phonepeRes.data?.success && phonepeRes.data?.redirectUrl) {
              clearCart();
              Linking.openURL(phonepeRes.data.redirectUrl);
              navigation.replace('OrderTracking', { order: res.data.data });
              return;
            } else {
              AlertService.show({ type: 'error', title: 'Payment Error', message: 'Failed to initiate PhonePe payment.' });
              return;
            }
          } catch (ppErr) {
            console.error('PhonePe init error:', ppErr);
            AlertService.show({ type: 'error', title: 'Payment Error', message: 'Error initiating payment.' });
            return;
          }
        } else {
          // COD Flow
          clearCart();
          AlertService.show({ type: 'success', title: 'Success', message: 'Order placed successfully!' });
          navigation.replace('OrderTracking', { order: res.data.data });
        }
      } else {
        AlertService.show({ type: 'error', title: 'Order Failed', message: res.data?.message || 'Could not place order.' });
      }
    } catch (error) {
      console.error('Order API Error:', error);
      AlertService.show({ type: 'error', title: 'Error', message: error.response?.data?.message || 'An error occurred while placing the order.' });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={rs(22)} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      {/* Stepper */}
      {items.length > 0 && (
        <View style={styles.stepperWrap}>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, currentStep >= 1 && styles.stepDotActive]}><Text style={[styles.stepDotText, currentStep >= 1 && styles.stepDotTextActive]}>1</Text></View>
            <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, currentStep >= 2 && styles.stepDotActive]}><Text style={[styles.stepDotText, currentStep >= 2 && styles.stepDotTextActive]}>2</Text></View>
            <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />
            <View style={[styles.stepDot, currentStep >= 3 && styles.stepDotActive]}><Text style={[styles.stepDotText, currentStep >= 3 && styles.stepDotTextActive]}>3</Text></View>
          </View>
          <View style={styles.stepLabels}>
            <Text style={[styles.stepLabelText, currentStep >= 1 && styles.stepLabelTextActive]}>Summary</Text>
            <Text style={[styles.stepLabelText, currentStep >= 2 && styles.stepLabelTextActive]}>Address</Text>
            <Text style={[styles.stepLabelText, currentStep >= 3 && styles.stepLabelTextActive]}>Payment</Text>
          </View>
        </View>
      )}

      {items.length === 0 ? (
        /* ── EMPTY STATE ── */
        <EmptyCart onExplore={() => navigation.navigate('MainTabs', { screen: 'ExploreTab' })} />
      ) : (
        /* ── FILLED STATE ── */
        <>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: rv(120) }}
              showsVerticalScrollIndicator={false}
            >
              {/* Step 1: Summary */}
              {currentStep === 1 && (
                <>
                  {/* Items */}
                  <Text style={styles.sectionLabel}>Cart Items</Text>
                  {items.map((item) => (
                    <View key={item.id} style={styles.cartRow}>
                      <TouchableOpacity
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                        onPress={() => navigation.navigate('MedicineDetail', { medicine: item })}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.cartItemIcon, { padding: 0, overflow: 'hidden' }]}>
                          {item.image ? (
                            <Image source={{ uri: getFullImageUrl(item.image) }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                          ) : (
                            <Text style={{ fontSize: rs(22) }}>💊</Text>
                          )}
                        </View>
                        <View style={{ flex: 1, paddingRight: rs(8) }}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemPrice}>₹{item.price}</Text>
                        </View>
                      </TouchableOpacity>
                      <View style={styles.qtyContainer}>
                        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.qtyBtn}>
                          <Ionicons name="remove" size={16} color={C.text} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.qty}</Text>
                        <TouchableOpacity onPress={() => addToCart(item, true)} style={styles.qtyBtn}>
                          <Ionicons name="add" size={16} color={C.text} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {/* Restricted Cart Warning */}
                  {isRestricted && (
                    <View style={{ backgroundColor: '#FEF2F2', padding: rs(16), borderRadius: radius.lg, borderWidth: 1, borderColor: '#FECACA', marginBottom: rv(16) }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rv(8) }}>
                        <Ionicons name="warning" size={rs(20)} color="#DC2626" />
                        <Text style={{ fontSize: rm(15), fontWeight: '700', color: '#991B1B' }}>Prescription Required</Text>
                      </View>
                      <Text style={{ fontSize: rm(13), color: '#7F1D1D', lineHeight: rv(20), marginBottom: rv(12) }}>
                        Your cart contains medicines that require a doctor's prescription.
                        You must upload a valid prescription and wait for admin approval to proceed.
                      </Text>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('UploadPrescription')}
                        style={{ backgroundColor: '#DC2626', paddingVertical: rv(10), borderRadius: radius.md, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#fff', fontSize: rm(13), fontWeight: '700' }}>Upload Prescription</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Summary */}
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total MRP</Text>
                      <Text style={styles.summaryValue}>₹{totalMRP.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: '#059669' }]}>Dosebox Discount</Text>
                      <Text style={[styles.summaryValue, { color: '#059669' }]}>- ₹{doseboxDiscount.toFixed(2)}</Text>
                    </View>
                    {couponDiscount > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: '#4338CA', fontWeight: 'bold' }]}>Promo Discount ({appliedPromo})</Text>
                        <Text style={[styles.summaryValue, { color: '#4338CA', fontWeight: 'bold' }]}>- ₹{couponDiscount.toFixed(2)}</Text>
                      </View>
                    )}
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { fontWeight: '700', color: C.text }]}>Cart Total</Text>
                      <Text style={[styles.summaryValue, { fontWeight: '700' }]}>₹{cartTotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>GST (5%)</Text>
                      <Text style={styles.summaryValue}>₹{gstAmount.toFixed(2)}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Delivery Charges</Text>
                      <Text style={styles.summaryValue}>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}</Text>
                    </View>

                    <View style={[styles.summaryRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Order Total</Text>
                      <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
                    </View>
                  </View>
                </>
              )}

              {/* Step 2: Address & Promo */}
              {currentStep === 2 && (
                <>
                  {/* Address */}
                  <View style={styles.addressCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(16) }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(8) }}>
                        <View style={{ width: rs(24), height: rs(24), backgroundColor: '#F1F5F9', borderRadius: rs(12), justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontSize: rm(12), fontWeight: 'bold', color: C.text }}>1</Text>
                        </View>
                        <Text style={{ fontSize: rm(16), fontWeight: 'bold', color: C.text }}>Shipping Address</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => setIsManualEntry(!isManualEntry)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: rs(12), paddingVertical: rv(6), borderRadius: radius.full }}
                      >
                        <Ionicons name="add" size={14} color={C.primary} />
                        <Text style={{ fontSize: rm(12), fontWeight: 'bold', color: C.primary }}>New Address</Text>
                      </TouchableOpacity>
                    </View>

                    {isManualEntry ? (
                      <View style={{ backgroundColor: '#F8FAFC', borderRadius: radius.lg, padding: rs(16), borderWidth: 1, borderColor: '#E2E8F0' }}>
                        <View style={{ flexDirection: 'row', gap: rs(8), marginBottom: rv(12) }}>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.md, paddingHorizontal: rs(12) }}>
                            <Ionicons name="search" size={16} color="#94A3B8" />
                            <TextInput
                              placeholder="Search for an address..."
                              placeholderTextColor="#94A3B8"
                              style={{ flex: 1, height: rv(40), marginLeft: rs(8), fontSize: rm(13), color: C.text }}
                              value={searchQuery}
                              onChangeText={setSearchQuery}
                            />
                          </View>
                          <TouchableOpacity
                            onPress={fetchCurrentAddress}
                            disabled={isFetchingLocation}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: rs(12), borderRadius: radius.md }}
                          >
                            {isFetchingLocation ? <ActivityIndicator size="small" color="#2563EB" /> : <Ionicons name="location" size={16} color="#2563EB" />}
                            <Text style={{ fontSize: rm(12), fontWeight: 'bold', color: '#2563EB' }}>Use Location</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={{ fontSize: rm(12), fontWeight: 'bold', color: '#64748B', marginBottom: rv(4) }}>Label (e.g. Home, Work)</Text>
                        <View style={{ flexDirection: 'row', gap: rs(8), marginBottom: rv(12) }}>
                          {['Home', 'Work', 'Other'].map(lbl => (
                            <TouchableOpacity
                              key={lbl}
                              onPress={() => setAddressTitle(lbl)}
                              style={{ paddingHorizontal: rs(16), paddingVertical: rv(6), borderRadius: radius.full, borderWidth: 1, borderColor: addressTitle === lbl ? C.primary : '#E2E8F0', backgroundColor: addressTitle === lbl ? '#ECFDF5' : '#fff' }}
                            >
                              <Text style={{ fontSize: rm(13), color: addressTitle === lbl ? C.primary : '#64748B', fontWeight: addressTitle === lbl ? 'bold' : 'normal' }}>{lbl}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <Text style={{ fontSize: rm(12), fontWeight: 'bold', color: '#64748B', marginBottom: rv(4) }}>Country</Text>
                        <TextInput
                          value="India"
                          editable={false}
                          style={[styles.manualInput, { backgroundColor: '#F1F5F9', color: '#94A3B8', marginBottom: rv(12), minHeight: rv(40) }]}
                        />

                        <Text style={{ fontSize: rm(12), fontWeight: 'bold', color: '#64748B', marginBottom: rv(4) }}>Street Address</Text>
                        <TextInput
                          placeholder="House No, Apartment name, street details"
                          placeholderTextColor="#94A3B8"
                          value={manualStreet}
                          onChangeText={setManualStreet}
                          style={[styles.manualInput, { marginBottom: rv(12), minHeight: rv(40) }]}
                        />

                        <Text style={{ fontSize: rm(12), fontWeight: 'bold', color: '#64748B', marginBottom: rv(4) }}>City</Text>
                        <TextInput
                          placeholder="City"
                          placeholderTextColor="#94A3B8"
                          value={manualCity}
                          onChangeText={setManualCity}
                          style={[styles.manualInput, { marginBottom: rv(12), minHeight: rv(40) }]}
                        />

                        <View style={{ flexDirection: 'row', gap: rs(10), marginBottom: rv(16) }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: rm(12), fontWeight: 'bold', color: '#64748B', marginBottom: rv(4) }}>State</Text>
                            <TextInput
                              placeholder="State"
                              placeholderTextColor="#94A3B8"
                              value={manualState}
                              onChangeText={setManualState}
                              style={[styles.manualInput, { minHeight: rv(40) }]}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: rm(12), fontWeight: 'bold', color: '#64748B', marginBottom: rv(4) }}>Zip Code</Text>
                            <TextInput
                              placeholder="Zip Code"
                              placeholderTextColor="#94A3B8"
                              value={manualZip}
                              onChangeText={setManualZip}
                              keyboardType="numeric"
                              style={[styles.manualInput, { minHeight: rv(40) }]}
                            />
                          </View>
                        </View>

                        <TouchableOpacity
                          style={{ backgroundColor: C.primary, paddingVertical: rv(12), borderRadius: radius.md, alignItems: 'center' }}
                          onPress={() => {
                            if (manualStreet.trim().length > 0 && manualCity.trim().length > 0) {
                              selectAddress({
                                title: addressTitle,
                                street: manualStreet.trim(),
                                city: manualCity.trim(),
                                state: manualState.trim(),
                                zipCode: manualZip.trim(),
                                country: 'India'
                              });
                              setIsManualEntry(false);
                            } else {
                              AlertService.show({ type: 'error', title: 'Error', message: 'Street and City are required.' });
                            }
                          }}
                        >
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: rm(14) }}>Save Address</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ backgroundColor: '#F8FAFC', padding: rs(16), borderRadius: radius.md, borderWidth: 1, borderColor: '#E2E8F0' }}>
                        <Text style={{ fontSize: rm(14), color: C.text, lineHeight: rv(20) }}>
                          {selectedAddress
                            ? `${selectedAddress.id !== 'current_loc' && selectedAddress.title ? `${selectedAddress.title} — ` : ''}${selectedAddress.street}${selectedAddress.city ? `, ${selectedAddress.city}` : ''}${selectedAddress.zipCode ? ` ${selectedAddress.zipCode}` : ''}`
                            : 'No address selected. Please select one or fetch current.'}
                        </Text>
                      </View>
                    )}
                  </View>

                </>
              )}

              {/* Step 3: Order Summary & Payment */}
              {currentStep === 3 && (
                <>
                  <Text style={styles.sectionLabel}>Delivery Address</Text>
                  <View style={[styles.paymentCard, { padding: rs(16), marginBottom: rv(16) }]}>
                    <Text style={{ fontSize: rm(14), color: C.text, lineHeight: rv(20) }}>
                      {selectedAddress
                        ? `${selectedAddress.id !== 'current_loc' && selectedAddress.title ? `${selectedAddress.title} — ` : ''}${selectedAddress.street}${selectedAddress.city ? `, ${selectedAddress.city}` : ''}${selectedAddress.zipCode ? ` ${selectedAddress.zipCode}` : ''}`
                        : 'No address selected.'}
                    </Text>
                  </View>

                  {/* Promo Code */}
                  <Text style={styles.sectionLabel}>Promo Code</Text>
                  <View style={[styles.paymentCard, { marginBottom: rv(16) }]}>
                    {appliedPromo ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: rs(16), backgroundColor: '#F0FDF4' }}>
                        <Text style={{ fontSize: rm(14), fontWeight: 'bold', color: '#166534' }}>{appliedPromo} Applied</Text>
                        <TouchableOpacity onPress={() => { setAppliedPromo(''); setAppliedPromoObj(null); }} style={{ backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                          <Text style={{ color: '#fff', fontSize: rm(12), fontWeight: 'bold' }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', padding: rs(16) }}>
                        <TextInput
                          style={{ flex: 1, height: rv(40), borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.md, paddingHorizontal: rs(12), backgroundColor: '#F8FAFC', color: C.text }}
                          placeholder="Enter promo code"
                          placeholderTextColor="#94A3B8"
                          value={promoCode}
                          onChangeText={setPromoCode}
                          autoCapitalize="characters"
                        />
                        <TouchableOpacity
                          style={{ marginLeft: rs(12), backgroundColor: C.primary, height: rv(40), paddingHorizontal: rs(20), borderRadius: radius.md, justifyContent: 'center' }}
                          disabled={isVerifyingPromo}
                          onPress={async () => {
                            if (!promoCode.trim()) return;
                            const code = promoCode.trim().toUpperCase();
                            setIsVerifyingPromo(true);
                            try {
                              const res = await api.post('/coupons/verify', { code, cartTotal });
                              if (res.data?.success) {
                                setAppliedPromo(code);
                                setAppliedPromoObj(res.data.data);
                                setPromoCode('');
                              } else {
                                AlertService.show({ type: 'error', title: 'Invalid Code', message: res.data?.message || 'Please enter a valid promo code.' });
                              }
                            } catch (error) {
                              AlertService.show({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to verify promo code.' });
                            } finally {
                              setIsVerifyingPromo(false);
                            }
                          }}
                        >
                          {isVerifyingPromo ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Apply</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <Text style={styles.sectionLabel}>Payment Method</Text>
                  <View style={styles.paymentCard}>
                    <TouchableOpacity
                      style={[styles.paymentOption, paymentMethod === 'COD' && styles.paymentOptionActive]}
                      onPress={() => setPaymentMethod('COD')}
                      activeOpacity={0.8}
                    >
                      <View style={styles.radio}>
                        {paymentMethod === 'COD' && <View style={styles.radioInner} />}
                      </View>
                      <Ionicons name="cash-outline" size={24} color={C.text} style={{ marginRight: 10 }} />
                      <Text style={styles.paymentText}>Cash on Delivery (COD)</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity
                      style={[styles.paymentOption, paymentMethod === 'PhonePe' && styles.paymentOptionActive]}
                      onPress={() => setPaymentMethod('PhonePe')}
                      activeOpacity={0.8}
                    >
                      <View style={styles.radio}>
                        {paymentMethod === 'PhonePe' && <View style={styles.radioInner} />}
                      </View>
                      <View style={styles.phonePeIcon}>
                        <Text style={styles.phonePeIconText}>Pe</Text>
                      </View>
                      <Text style={styles.paymentText}>PhonePe / UPI</Text>
                    </TouchableOpacity>
                  </View>

              {currentTokens > 0 && (
                <>
                  <Text style={styles.sectionLabel}>DoseBox Tokens</Text>
                  <View style={[styles.paymentCard, { padding: rs(16), marginBottom: rv(16), backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(12) }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="sparkles" size={18} color="#B45309" />
                        <Text style={{ fontSize: rm(14), fontWeight: 'bold', color: '#B45309' }}>DoseBox Tokens</Text>
                      </View>
                      <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: rs(10), paddingVertical: rv(4), borderRadius: radius.full }}>
                        <Text style={{ fontSize: rm(12), fontWeight: 'bold', color: '#D97706' }}>Balance: {currentTokens} Tokens</Text>
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: useDoseboxTokens ? rv(12) : 0 }}
                      onPress={() => {
                        const newVal = !useDoseboxTokens;
                        setUseDoseboxTokens(newVal);
                        if (newVal) {
                          setPointsInput(String(Math.floor(Math.min(currentTokens, finalTotal))));
                        } else {
                          setPointsInput('');
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#FCD34D', backgroundColor: useDoseboxTokens ? C.primary : '#fff', alignItems: 'center', justifyContent: 'center' }}>
                        {useDoseboxTokens && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      <Text style={{ fontSize: rm(14), fontWeight: '600', color: '#92400E' }}>Use tokens for this order</Text>
                    </TouchableOpacity>

                    {useDoseboxTokens && (
                      <View style={{ borderTopWidth: 1, borderTopColor: '#FDE68A', paddingTop: rv(12) }}>
                        <Text style={{ fontSize: rm(12), fontWeight: '600', color: '#B45309', marginBottom: rv(6) }}>Points to Apply</Text>
                        <TextInput
                          keyboardType="numeric"
                          value={pointsInput}
                          onChangeText={setPointsInput}
                          style={{ backgroundColor: pointsError ? '#FEF2F2' : '#fff', borderWidth: 1, borderColor: pointsError ? '#F87171' : '#FDE68A', borderRadius: radius.md, paddingHorizontal: rs(12), minHeight: rv(40), color: '#92400E', fontSize: rm(14) }}
                        />
                        {!!pointsError && <Text style={{ color: '#EF4444', fontSize: rm(12), fontWeight: 'bold', marginTop: rv(4) }}>{pointsError}</Text>}
                        
                        {!pointsError && Number(pointsInput) > 0 && (
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: rv(10) }}>
                            <Text style={{ fontSize: rm(13), fontWeight: 'bold', color: '#D97706' }}>Tokens Used ({pointsUsed})</Text>
                            <Text style={{ fontSize: rm(13), fontWeight: 'bold', color: '#D97706' }}>- ₹{pointsUsed}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </>
              )}

                  {/* Final Order Summary */}
                  <Text style={styles.sectionLabel}>Order Summary</Text>
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total MRP</Text>
                      <Text style={styles.summaryValue}>₹{totalMRP.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: '#059669' }]}>Dosebox Discount</Text>
                      <Text style={[styles.summaryValue, { color: '#059669' }]}>- ₹{doseboxDiscount.toFixed(2)}</Text>
                    </View>
                    {couponDiscount > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: '#4338CA', fontWeight: 'bold' }]}>Promo Discount ({appliedPromo})</Text>
                        <Text style={[styles.summaryValue, { color: '#4338CA', fontWeight: 'bold' }]}>- ₹{couponDiscount.toFixed(2)}</Text>
                      </View>
                    )}
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { fontWeight: '700', color: C.text }]}>Cart Total</Text>
                      <Text style={[styles.summaryValue, { fontWeight: '700' }]}>₹{cartTotal.toFixed(2)}</Text>
                    </View>
                    {couponDiscount > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: '#166534' }]}>Promo Discount</Text>
                        <Text style={[styles.summaryValue, { color: '#166534' }]}>-₹{couponDiscount.toFixed(2)}</Text>
                      </View>
                    )}
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>GST (5%)</Text>
                      <Text style={styles.summaryValue}>₹{gstAmount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Delivery Charges</Text>
                      <Text style={styles.summaryValue}>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}</Text>
                    </View>

                    <View style={[styles.summaryRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Order Total</Text>
                      <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
                    </View>
                    
                    {pointsUsed > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.border, paddingTop: rv(12), marginTop: rv(4) }}>
                        <Text style={{ fontSize: rm(15), fontWeight: '700', color: '#D97706' }}>Tokens Used</Text>
                        <Text style={{ fontSize: rm(15), fontWeight: '700', color: '#D97706' }}>- ₹{pointsUsed.toFixed(2)}</Text>
                      </View>
                    )}
                    
                    <View style={[styles.summaryRow, styles.totalRow, { marginTop: pointsUsed > 0 ? rv(12) : rv(4), borderTopWidth: pointsUsed > 0 ? 1 : 0, paddingTop: pointsUsed > 0 ? rv(12) : 0 }]}>
                      <Text style={styles.totalLabel}>Payable</Text>
                      <Text style={styles.totalValue}>₹{finalPayable.toFixed(2)}</Text>
                    </View>
                  </View>
                </>
              )}

            </ScrollView>
          </KeyboardAvoidingView>

          {/* Place Order Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + rv(16) }]}>
            {currentStep === 1 && (
              <TouchableOpacity
                style={styles.placeOrderBtn}
                onPress={async () => {
                  try {
                    if (isRestricted) {
                      AlertService.show({ type: 'error', title: 'Prescription Required', message: 'You must upload an approved prescription to checkout.' });
                      return;
                    }
                    const token = await AsyncStorage.getItem('accessToken');
                    if (!token) {
                      AlertService.show({ type: 'info', title: 'Login Required', message: 'Please login to continue checkout.' });
                      navigation.navigate('Login', { returnTo: 'CartCheckout' });
                    } else {
                      setCurrentStep(2);
                    }
                  } catch (e) {
                    if (!isRestricted) setCurrentStep(2);
                  }
                }}
                disabled={isRestricted}
                activeOpacity={0.85}
              >
                <Text style={styles.placeOrderText}>Proceed to Delivery</Text>
                <Ionicons name="arrow-forward" size={rs(20)} color={C.white} />
              </TouchableOpacity>
            )}

            {currentStep === 2 && (
              <TouchableOpacity
                style={styles.placeOrderBtn}
                onPress={() => {
                  if (!selectedAddress) {
                    AlertService.show({ type: 'error', title: 'Address Required', message: 'Please provide or select a shipping address.' });
                    return;
                  }
                  setCurrentStep(3);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.placeOrderText}>Proceed to Payment</Text>
                <Ionicons name="arrow-forward" size={rs(20)} color={C.white} />
              </TouchableOpacity>
            )}

            {currentStep === 3 && (
              <TouchableOpacity
                style={styles.placeOrderBtn}
                onPress={handlePlaceOrder}
                disabled={isPlacingOrder}
                activeOpacity={0.85}
              >
                {isPlacingOrder ? (
                  <ActivityIndicator color={C.white} />
                ) : (
                  <>
                    <Text style={styles.placeOrderText}>Place Order • ₹{finalPayable.toFixed(2)}</Text>
                    <Ionicons name="checkmark-circle" size={rs(20)} color={C.white} />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// ─── Styles: Main ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: rv(16), backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: rs(38), height: rs(38), borderRadius: rs(10), backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', marginRight: rs(12) },
  headerTitle: { flex: 1, fontSize: rm(20), fontWeight: '700', color: C.text },
  countBadge: { backgroundColor: C.primary, paddingHorizontal: rs(10), paddingVertical: rv(4), borderRadius: radius.full },
  countText: { color: C.white, fontSize: rm(12), fontWeight: '700' },
  scroll: { flex: 1 },
  sectionLabel: { fontSize: rm(13), fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: rv(20), marginBottom: rv(12) },
  cartRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: radius.lg, padding: rs(14), marginBottom: rv(10), borderWidth: 1, borderColor: C.border },
  cartItemIcon: { width: rs(44), height: rs(44), borderRadius: rs(10), backgroundColor: C.light, alignItems: 'center', justifyContent: 'center', marginRight: rs(12) },
  itemName: { fontSize: rm(15), fontWeight: '600', color: C.text },
  itemQty: { fontSize: rm(13), color: C.sub, marginTop: rv(3) },
  itemPrice: { fontSize: rm(16), fontWeight: '700', color: C.primary, marginTop: rv(2) },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: radius.md, padding: 2 },
  qtyBtn: { padding: rs(6), backgroundColor: C.white, borderRadius: radius.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  qtyText: { paddingHorizontal: rs(12), fontSize: rm(14), fontWeight: '700', color: C.text },
  summaryCard: { backgroundColor: C.white, borderRadius: radius.lg, padding: rs(16), marginTop: rv(4), marginBottom: rv(8), borderWidth: 1, borderColor: C.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rv(10) },
  summaryLabel: { fontSize: rm(14), color: C.sub },
  summaryValue: { fontSize: rm(14), color: C.text, fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: rv(12), marginTop: rv(4), marginBottom: 0 },
  totalLabel: { fontSize: rm(17), fontWeight: '700', color: C.text },
  totalValue: { fontSize: rm(17), fontWeight: '800', color: C.primary },

  addressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: rv(20), marginBottom: rv(12) },
  fetchBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.light, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  fetchBtnText: { color: C.primary, fontSize: rm(12), fontWeight: '700' },
  addressCard: {
    backgroundColor: C.white, borderRadius: radius.lg, padding: rs(16), borderWidth: 1,
    borderColor: C.border,
  },
  manualInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.sm,
    padding: spacing.md,
    color: '#0F172A',
    fontSize: rm(14),
    minHeight: rv(80),
    textAlignVertical: 'top',
    marginBottom: rv(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveAddressBtn: {
    backgroundColor: C.primary,
    paddingVertical: rv(10),
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  addressText: { fontSize: rm(14), color: C.text, lineHeight: rv(22) },

  paymentCard: { backgroundColor: C.white, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: rs(16), backgroundColor: C.white },
  paymentOptionActive: { backgroundColor: C.light },
  divider: { height: 1, backgroundColor: C.border },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  paymentText: { fontSize: rm(15), fontWeight: '500', color: C.text },
  phonePeIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#5f259f', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  phonePeIconText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  footer: { paddingHorizontal: spacing.md, paddingTop: rv(12), backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border },
  placeOrderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), backgroundColor: C.primary, paddingVertical: rv(16), borderRadius: radius.lg },
  placeOrderText: { color: C.white, fontSize: rm(16), fontWeight: '700' },

  stepperWrap: { paddingHorizontal: spacing.lg, paddingVertical: rv(16), backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: rv(8) },
  stepDot: { width: rs(24), height: rs(24), borderRadius: rs(12), backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: C.primary },
  stepDotText: { fontSize: rm(12), fontWeight: 'bold', color: C.sub },
  stepDotTextActive: { color: C.white },
  stepLine: { flex: 1, height: 2, backgroundColor: C.border, marginHorizontal: rs(4) },
  stepLineActive: { backgroundColor: C.primary },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: rs(4) },
  stepLabelText: { fontSize: rm(12), color: C.sub, fontWeight: '600' },
  stepLabelTextActive: { color: C.primary },
});

// ─── Styles: Empty ────────────────────────────────────────────
const emptyStyles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: rv(40) },
  iconWrap: { position: 'relative', marginBottom: rv(28) },
  iconCircle: { width: rs(130), height: rs(130), borderRadius: rs(65), backgroundColor: C.light, alignItems: 'center', justifyContent: 'center' },
  dot1: { position: 'absolute', top: rs(8), right: rs(-4), width: rs(16), height: rs(16), borderRadius: rs(8), backgroundColor: '#C8E6E0' },
  dot2: { position: 'absolute', bottom: rs(12), left: rs(-8), width: rs(10), height: rs(10), borderRadius: rs(5), backgroundColor: '#B2D8D0' },
  title: { fontSize: rm(24), fontWeight: '800', color: C.text, marginBottom: rv(8), textAlign: 'center' },
  sub: { fontSize: rm(14), color: C.sub, textAlign: 'center', lineHeight: rv(22), marginBottom: rv(36) },
  perks: { width: '100%', marginBottom: rv(36), gap: rv(14) },
  perkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: radius.lg, padding: rs(16), borderWidth: 1, borderColor: C.border, gap: rs(14) },
  perkIconWrap: { width: rs(40), height: rs(40), borderRadius: rs(10), backgroundColor: C.light, alignItems: 'center', justifyContent: 'center' },
  perkTitle: { fontSize: rm(14), fontWeight: '700', color: C.text, marginBottom: rv(2) },
  perkSub: { fontSize: rm(12), color: C.sub },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: C.primary, borderRadius: radius.xl, paddingVertical: rv(16), paddingHorizontal: rs(24) },
  btnText: { color: C.white, fontSize: rm(16), fontWeight: '700' },
  btnArrow: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});
