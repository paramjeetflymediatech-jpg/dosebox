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
  Platform,
  Dimensions,
  Modal
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
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
import MedicineCard from '../../components/MedicineCard';

const C = {
  primary: '#1F5C52',
  bg: '#F7F8FA',
  white: '#FFFFFF',
  text: '#0D1B2A',
  sub: '#64748B',
  border: '#E9EDF2',
  light: '#EAF4F2',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAT_CARD_WIDTH = Math.max(rs(150), (SCREEN_WIDTH - spacing.md * 2 - rs(8)) / 2);
const REC_CARD_GAP = rs(10);
const REC_SECTION_PAD = rs(14);
const REC_CARD_WIDTH = Math.floor((SCREEN_WIDTH - spacing.md * 2 - REC_SECTION_PAD * 2 - REC_CARD_GAP) / 2);

const PERKS = [
  { icon: 'refresh-outline', title: 'Easy Returns', sub: '7-day hassle-free return policy' },
  { icon: 'shield-checkmark-outline', title: 'Secure Payment', sub: '100% encrypted & safe checkout' },
  { icon: 'car-outline', title: 'Fast Delivery', sub: 'Delivered to your door in 2–4 hrs' },
];

// ─── Empty Cart State ─────────────────────────────────────────
function EmptyCart({ onExplore, recommendations = [] }) {
  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: rv(40) }}
      showsVerticalScrollIndicator={false}
    >
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

      {/* Recommended in Empty State */}
      {recommendations.length > 0 && (
        <View style={emptyStyles.recWrap}>
          <View style={emptyStyles.recHeader}>
            <Ionicons name="sparkles" size={14} color={C.primary} />
            <Text style={emptyStyles.recTitle}>Trending Healthcare Products</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: rv(4) }}
            snapToInterval={REC_CARD_WIDTH + REC_CARD_GAP}
            decelerationRate="fast"
          >
            {recommendations.map((med, idx) => (
              <MedicineCard
                key={med.id}
                med={med}
                containerStyle={{ 
                  width: REC_CARD_WIDTH, 
                  marginRight: idx === recommendations.length - 1 ? 0 : REC_CARD_GAP 
                }}
                compact
              />
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function CartCheckoutScreen({ navigation }) {
  const {
    items,
    totalPrice,
    clearCart,
    addToCart,
    removeFromCart,
    deleteFromCart,
    attachedPrescriptionStatus,
    setAttachedPrescriptionStatus,
    attachedPrescriptionId,
    setAttachedPrescriptionId,
    attachedPrescriptionUrl,
    setAttachedPrescriptionUrl,
  } = useCart();
  const { selectedAddress, selectAddress } = useLocation();
  const insets = useSafeAreaInsets();

  const [paymentMethod, setPaymentMethod] = useState('PhonePe');
  const [currentStep, setCurrentStep] = useState(1);
  const [currentTokens, setCurrentTokens] = useState(0);
  const [useDoseboxTokens, setUseDoseboxTokens] = useState(false);
  const [pointsInput, setPointsInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Structured UI States
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [savedPrescriptions, setSavedPrescriptions] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState(null);
  const [showSavedRxModal, setShowSavedRxModal] = useState(false);
  const [isUploadingRx, setIsUploadingRx] = useState(false);
  const [isPromoDropdownOpen, setIsPromoDropdownOpen] = useState(false);
  const [isSavingsExpanded, setIsSavingsExpanded] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem('user').then(str => {
      if (str) {
        try {
          const u = JSON.parse(str);
          setCurrentTokens(u.doseboxTokens || 0);
        } catch (e) {}
      }
    });

    let isMounted = true;
    const fetchCats = async () => {
      try {
        const res = await api.get('/medicines/categories');
        if (isMounted && res.data?.success && Array.isArray(res.data.data)) {
          setCategories(res.data.data);
          return;
        }
      } catch (e) {}

      try {
        const res = await api.get('/categories');
        if (isMounted && res.data?.success && Array.isArray(res.data.data)) {
          setCategories(res.data.data);
        }
      } catch (e) {}
    };
    fetchCats();

    const fetchRecs = async () => {
      try {
        const res = await api.get('/medicines/recommendations');
        if (isMounted && res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setRecommendations(res.data.data);
          return;
        }
      } catch (e) {}

      try {
        const fallbackRes = await api.get('/medicines?limit=10');
        if (isMounted && fallbackRes.data?.success && Array.isArray(fallbackRes.data.data)) {
          setRecommendations(fallbackRes.data.data);
        }
      } catch (e) {}
    };
    fetchRecs();

    const fetchCoupons = async () => {
      try {
        const res = await api.get('/coupons');
        if (isMounted && res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setAvailableCoupons(res.data.data);
          return;
        }
      } catch (e) {}

      if (isMounted) {
        setAvailableCoupons([
          { code: 'DOSEBOX10', discountType: 'Percentage', discountValue: 10, minOrderValue: 499 },
          { code: 'FLAT100', discountType: 'Fixed', discountValue: 100, minOrderValue: 999 },
          { code: 'HEALTHCARE15', discountType: 'Percentage', discountValue: 15, minOrderValue: 1499 },
        ]);
      }
    };
    fetchCoupons();

    fetchSavedAddresses();
    fetchSavedPrescriptions();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSavedAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const res = await api.get('/account/addresses');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSavedAddresses(res.data.data);
        if (!selectedAddress && res.data.data.length > 0) {
          const def = res.data.data.find(a => a.isDefault) || res.data.data[0];
          selectAddress(def);
        }
      }
    } catch (e) {
      console.log('Error fetching addresses:', e);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const fetchSavedPrescriptions = async () => {
    setIsLoadingPrescriptions(true);
    try {
      const res = await api.get('/prescriptions/customer');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSavedPrescriptions(res.data.data);
      }
    } catch (e) {
      console.log('Error fetching prescriptions:', e);
    } finally {
      setIsLoadingPrescriptions(false);
    }
  };

  const handlePickRxImage = async (fromCamera = false) => {
    try {
      const options = { mediaType: 'photo', quality: 0.8 };
      let res = null;
      if (fromCamera) {
        const hasPermission = await PermissionsService.requestCameraAndGalleryPermission();
        if (!hasPermission) return;
        res = await launchCamera(options);
      } else {
        res = await launchImageLibrary(options);
      }

      if (res.didCancel || !res.assets || res.assets.length === 0) return;

      const asset = res.assets[0];
      setIsUploadingRx(true);

      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'prescription.jpg',
      });

      const uploadRes = await api.post('/prescriptions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (uploadRes.data?.success && uploadRes.data?.data) {
        const newRx = uploadRes.data.data;
        const fileUrl = newRx.fileUrl ? getFullImageUrl(newRx.fileUrl) : asset.uri;
        if (setAttachedPrescriptionId) setAttachedPrescriptionId(String(newRx.id));
        if (setAttachedPrescriptionUrl) setAttachedPrescriptionUrl(fileUrl);
        if (setAttachedPrescriptionStatus) setAttachedPrescriptionStatus('Pending');
        AlertService.show({
          type: 'success',
          title: 'Prescription Uploaded',
          message: 'Your prescription has been attached to this order.'
        });
        fetchSavedPrescriptions();
      } else {
        AlertService.show({
          type: 'error',
          title: 'Upload Failed',
          message: uploadRes.data?.message || 'Failed to upload prescription.'
        });
      }
    } catch (err) {
      console.error('Rx upload error:', err);
      AlertService.show({
        type: 'error',
        title: 'Upload Error',
        message: err.response?.data?.message || err.message || 'Could not upload prescription.'
      });
    } finally {
      setIsUploadingRx(false);
    }
  };

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

  const recommendedMedicines = recommendations.filter(
    (rec) => !items.some((item) => item.id === rec.id)
  );

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

    if (requiresPrescription && !attachedPrescriptionId) {
      setCurrentStep(3);
      AlertService.show({
        type: 'warning',
        title: 'Prescription Required',
        message: 'Your order contains prescription medicines. Please upload or choose a prescription to continue.'
      });
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

  const prescriptionItemCount = items.filter(item => item.prescriptionRequired).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{currentStep === 1 ? 'My Cart' : 'Checkout'}</Text>
          {currentStep === 1 && items.length > 0 && (
            <Text style={styles.headerSubtitle}>{items.length} {items.length === 1 ? 'Item' : 'Items'} in your cart</Text>
          )}
          {currentStep >= 2 && (
            <Text style={styles.headerSubtitle}>
              {currentStep === 2 && 'Step 1 of 3 • Select Delivery Address'}
              {currentStep === 3 && 'Step 2 of 3 • Upload or Choose Prescription'}
              {currentStep === 4 && 'Step 3 of 3 • Select Payment & Confirm'}
            </Text>
          )}
        </View>

        {currentStep === 1 && items.length > 0 && (
          <TouchableOpacity
            style={styles.addMoreBtn}
            onPress={() => navigation.navigate('SearchScreen', { showAll: true, query: '' })}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={rs(16)} color={C.primary} />
            <Text style={styles.addMoreText}>Add more</Text>
          </TouchableOpacity>
        )}

        {currentStep >= 2 && (
          <View style={styles.secureBadge}>
            <Ionicons name="shield-checkmark" size={rs(13)} color="#059669" />
            <Text style={styles.secureBadgeText}>100% Secure</Text>
          </View>
        )}
      </View>

      {/* ── Category Strip — Only shown in Cart Review (Step 1) ── */}
      {currentStep === 1 && (
        <View style={styles.catStripWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catStripContent}
            snapToInterval={CAT_CARD_WIDTH + rs(8)}
            decelerationRate="fast"
          >
            {/* All Medicines pill */}
            <TouchableOpacity
              style={[styles.catPill, styles.catPillAll]}
              onPress={() => navigation.navigate('SearchScreen', { showAll: true, query: '' })}
              activeOpacity={0.7}
            >
              <View style={[styles.catIconWrap, { backgroundColor: '#D4ECE7' }]}>
                <Ionicons name="apps" size={rs(12)} color={C.primary} />
              </View>
              <Text style={[styles.catPillText, styles.catPillTextAll]}>All Medicines</Text>
            </TouchableOpacity>

            {/* Dynamic Categories */}
            {categories.map((cat) => (
              <CategoryPillItem
                key={cat.id || cat.slug || cat.name}
                cat={cat}
                navigation={navigation}
              />
            ))}

            {/* More Categories */}
            <TouchableOpacity
              style={[styles.catPill, styles.catPillMore]}
              onPress={() => navigation.navigate('Categories')}
              activeOpacity={0.7}
            >
              <View style={[styles.catIconWrap, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="grid-outline" size={rs(12)} color={C.sub} />
              </View>
              <Text style={[styles.catPillText, { color: C.sub }]}>More</Text>
              <Ionicons name="chevron-forward" size={rs(12)} color={C.sub} style={{ marginLeft: rs(2) }} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* ── Connected Modern Timeline Stepper — Shown during Checkout (Steps 2, 3, 4) ── */}
      {currentStep >= 2 && items.length > 0 && (
        <View style={styles.modernStepperWrap}>
          {/* Background Connecting Track Line */}
          <View style={styles.stepperTrackLine} />
          {/* Active Filled Teal Progress Track Line */}
          <View
            style={[
              styles.stepperTrackLineActive,
              { width: currentStep === 2 ? '0%' : currentStep === 3 ? '50%' : '100%' }
            ]}
          />

          <View style={styles.stepperNodesRow}>
            {/* Step 1 Node: Address */}
            <TouchableOpacity
              style={styles.stepperNode}
              onPress={() => setCurrentStep(2)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.stepperCircle,
                  selectedAddress && currentStep !== 2
                    ? styles.stepperCircleCompleted
                    : currentStep === 2
                    ? styles.stepperCircleActive
                    : styles.stepperCircleInactive
                ]}
              >
                {selectedAddress && currentStep !== 2 ? (
                  <Ionicons name="checkmark" size={rs(13)} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.stepperCircleNum,
                      currentStep === 2 && styles.stepperCircleNumActive
                    ]}
                  >
                    1
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepperNodeLabel,
                  currentStep === 2 && styles.stepperNodeLabelActive
                ]}
                numberOfLines={1}
              >
                Address
              </Text>
              <Text style={styles.stepperNodeSub} numberOfLines={1}>
                {selectedAddress ? (selectedAddress.title || 'Selected') : 'Add address'}
              </Text>
            </TouchableOpacity>

            {/* Step 2 Node: Prescription */}
            <TouchableOpacity
              style={styles.stepperNode}
              onPress={() => {
                if (!selectedAddress) {
                  AlertService.show({ type: 'warning', title: 'Address Required', message: 'Please select a delivery address first.' });
                  return;
                }
                setCurrentStep(3);
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.stepperCircle,
                  attachedPrescriptionId && currentStep !== 3
                    ? styles.stepperCircleCompleted
                    : currentStep === 3
                    ? styles.stepperCircleActive
                    : styles.stepperCircleInactive
                ]}
              >
                {attachedPrescriptionId && currentStep !== 3 ? (
                  <Ionicons name="checkmark" size={rs(13)} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.stepperCircleNum,
                      currentStep === 3 && styles.stepperCircleNumActive
                    ]}
                  >
                    2
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepperNodeLabel,
                  currentStep === 3 && styles.stepperNodeLabelActive
                ]}
                numberOfLines={1}
              >
                Prescription
              </Text>
              <Text
                style={[
                  styles.stepperNodeSub,
                  attachedPrescriptionId ? { color: '#059669', fontWeight: '700' } : (requiresPrescription ? { color: '#D97706', fontWeight: '700' } : null)
                ]}
                numberOfLines={1}
              >
                {attachedPrescriptionId ? 'Attached ✓' : (requiresPrescription ? 'Rx Required' : 'Optional')}
              </Text>
            </TouchableOpacity>

            {/* Step 3 Node: Payment */}
            <TouchableOpacity
              style={styles.stepperNode}
              onPress={() => {
                if (!selectedAddress) {
                  AlertService.show({ type: 'warning', title: 'Address Required', message: 'Please select a delivery address first.' });
                  return;
                }
                if (requiresPrescription && !attachedPrescriptionId) {
                  AlertService.show({ type: 'warning', title: 'Prescription Required', message: 'Please attach a prescription before proceeding to payment.' });
                  setCurrentStep(3);
                  return;
                }
                setCurrentStep(4);
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.stepperCircle,
                  currentStep === 4
                    ? styles.stepperCircleActive
                    : styles.stepperCircleInactive
                ]}
              >
                <Text
                  style={[
                    styles.stepperCircleNum,
                    currentStep === 4 && styles.stepperCircleNumActive
                  ]}
                >
                  3
                </Text>
              </View>
              <Text
                style={[
                  styles.stepperNodeLabel,
                  currentStep === 4 && styles.stepperNodeLabelActive
                ]}
                numberOfLines={1}
              >
                Payment
              </Text>
              <Text style={styles.stepperNodeSub} numberOfLines={1}>
                {paymentMethod === 'COD' ? 'Cash on Del.' : 'Online / UPI'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {items.length === 0 ? (
        /* ── EMPTY STATE ── */
        <EmptyCart 
          onExplore={() => navigation.navigate('MainTabs', { screen: 'ExploreTab' })} 
          recommendations={recommendedMedicines}
        />
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
                  {/* Items Header */}
                  <View style={styles.cartItemsHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(8) }}>
                      <Text style={styles.sectionLabelCustom}>Cart Items</Text>
                      <View style={styles.itemCountPill}>
                        <Text style={styles.itemCountPillText}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>
                      </View>
                    </View>
                    {items.length > 1 && (
                      <TouchableOpacity 
                        onPress={() => {
                          AlertService.show({
                            type: 'warning',
                            title: 'Clear Cart?',
                            message: 'Are you sure you want to remove all items from your cart?',
                            buttons: [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Clear All', style: 'destructive', onPress: clearCart }
                            ]
                          });
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.clearCartText}>Clear All</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Prescription Items Notice */}
                  {prescriptionItemCount > 0 && (
                    <View style={styles.prescriptionNotice}>
                      <View style={styles.prescriptionNoticeLeft}>
                        <View style={styles.prescriptionNoticeIcon}>
                          <Ionicons name="document-text" size={rs(14)} color="#DC2626" />
                        </View>
                        <Text style={styles.prescriptionNoticeText}>
                          <Text style={{ fontWeight: '800' }}>{prescriptionItemCount} Prescription</Text> {prescriptionItemCount === 1 ? 'Item' : 'Items'} in your cart
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('UploadPrescription')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.prescriptionNoticeLink}>Upload Rx</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {items.map((item) => {
                    const unitPrice = Number(item.discountPrice || item.price);
                    const mrp = Number(item.price);
                    const hasDiscount = item.discountPrice && Number(item.discountPrice) < mrp;
                    const discountPct = hasDiscount ? Math.round(((mrp - unitPrice) / mrp) * 100) : 0;
                    const itemTotal = unitPrice * item.qty;

                    const packInfo = item.packSize || item.pack || (item.dosageForm ? `${item.dosageForm}` : null);
                    const brandText = item.brandName || item.brand?.name || item.manufacturer || null;
                    const moleculeText = item.molecule || item.composition || item.genericName || null;
                    const isCold = Boolean(item.coldChain || item.isColdChain);

                    return (
                      <View key={item.id} style={styles.cartCard}>
                        {/* Top: Image, Details & Trash Icon */}
                        <View style={styles.cartCardTopRow}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('MedicineDetail', { medicine: item })}
                            style={styles.cartCardImageWrap}
                          >
                            {item.image ? (
                              <Image 
                                source={{ uri: getFullImageUrl(item.image) }} 
                                style={styles.cartCardImage} 
                                resizeMode="contain" 
                              />
                            ) : (
                              <View style={styles.cartCardImageFallback}>
                                <Ionicons name="medical" size={rs(24)} color="#CBD5E1" />
                              </View>
                            )}
                            {/* Discount Badge on Image */}
                            {hasDiscount && discountPct > 0 && (
                              <View style={styles.imgDiscountBadge}>
                                <Text style={styles.imgDiscountText}>{discountPct}% Off</Text>
                              </View>
                            )}
                            {/* Rx & Cold Chain Badges on Image */}
                            <View style={styles.imgBadgeRow}>
                              {item.prescriptionRequired && (
                                <View style={styles.imgRxBadge}>
                                  <Text style={styles.imgRxBadgeText}>Rx</Text>
                                </View>
                              )}
                              {isCold && (
                                <View style={styles.imgColdBadge}>
                                  <Text style={styles.imgColdBadgeText}>❄</Text>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>

                          <View style={styles.cartCardInfo}>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => navigation.navigate('MedicineDetail', { medicine: item })}
                            >
                              <Text style={styles.cartCardName} numberOfLines={2}>
                                {item.name}
                              </Text>
                            </TouchableOpacity>

                            {/* Manufacturer — "By BRAND NAME" */}
                            {brandText && (
                              <Text style={styles.cartCardBrand} numberOfLines={1}>
                                By {brandText.toUpperCase()}
                              </Text>
                            )}

                            {/* Pack Size Info */}
                            {packInfo && (
                              <Text style={styles.cartCardPackInfo} numberOfLines={1}>
                                {packInfo}
                              </Text>
                            )}

                            {/* Active Composition / Molecule */}
                            {moleculeText && (
                              <Text style={styles.cartCardMolecule} numberOfLines={1}>
                                {moleculeText}
                              </Text>
                            )}

                            {/* Badges Row */}
                            <View style={styles.cartCardBadgesRow}>
                              {item.prescriptionRequired && (
                                <View style={styles.rxMiniBadge}>
                                  <Ionicons name="document-text-outline" size={10} color="#DC2626" />
                                  <Text style={styles.rxMiniBadgeText}>Rx Required</Text>
                                </View>
                              )}
                              {isCold && (
                                <View style={styles.coldMiniBadge}>
                                  <Ionicons name="snow" size={10} color="#0284C7" />
                                  <Text style={styles.coldMiniBadgeText}>Cold Chain</Text>
                                </View>
                              )}
                            </View>

                            {/* Unit Price Row */}
                            <View style={styles.cartCardPriceRow}>
                              <Text style={styles.cartCardEffectivePrice}>₹{parseFloat(unitPrice.toFixed(2))}</Text>
                              {hasDiscount && (
                                <>
                                  <Text style={styles.cartCardMrp}>₹{parseFloat(mrp.toFixed(2))}</Text>
                                  <View style={styles.cartCardDiscountBadge}>
                                    <Text style={styles.cartCardDiscountText}>{discountPct}% OFF</Text>
                                  </View>
                                </>
                              )}
                            </View>
                          </View>

                          {/* Quick Delete */}
                          <TouchableOpacity
                            style={styles.cartCardDeleteBtn}
                            onPress={() => {
                              if (deleteFromCart) deleteFromCart(item.id);
                              else removeFromCart(item.id);
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityLabel="Remove item"
                          >
                            <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                          </TouchableOpacity>
                        </View>

                        {/* Bottom: Subtotal & Stepper */}
                        <View style={styles.cartCardFooter}>
                          <View style={styles.cartCardSubtotalWrap}>
                            <Text style={styles.cartCardSubtotalLabel}>Item Total</Text>
                            <Text style={styles.cartCardSubtotalValue}>₹{parseFloat(itemTotal.toFixed(2))}</Text>
                          </View>

                          {/* Stepper Pill */}
                          <View style={styles.advQtyWrap}>
                            <TouchableOpacity 
                              style={styles.advQtyBtn} 
                              onPress={() => removeFromCart(item.id)}
                              activeOpacity={0.7}
                              accessibilityLabel="Decrease quantity"
                            >
                              {item.qty === 1 ? (
                                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                              ) : (
                                <Ionicons name="remove" size={14} color={C.text} />
                              )}
                            </TouchableOpacity>

                            <View style={styles.advQtyNumberWrap}>
                              <Text style={styles.advQtyText}>{item.qty}</Text>
                            </View>

                            <TouchableOpacity 
                              style={[styles.advQtyBtn, styles.advQtyBtnPlus]} 
                              onPress={() => addToCart(item, true)}
                              activeOpacity={0.7}
                              accessibilityLabel="Increase quantity"
                            >
                              <Ionicons name="add" size={14} color={C.white} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}

                  {/* Prescription Notice Card (Informative & Friendly) */}
                  {prescriptionItemCount > 0 && (
                    <View style={styles.rxCartNoticeCard}>
                      <View style={styles.rxCartNoticeHeader}>
                        <View style={styles.rxNoticeBadge}>
                          <Ionicons name="document-text" size={rs(14)} color="#DC2626" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rxNoticeTitle}>
                            {prescriptionItemCount} {prescriptionItemCount === 1 ? 'Medicine requires' : 'Medicines require'} Prescription
                          </Text>
                          <Text style={styles.rxNoticeSub}>
                            You can upload or select your doctor's Rx in Checkout Step 2.
                          </Text>
                        </View>
                        {attachedPrescriptionId ? (
                          <View style={styles.rxAttachedPill}>
                            <Ionicons name="checkmark-circle" size={12} color="#059669" />
                            <Text style={styles.rxAttachedText}>Attached</Text>
                          </View>
                        ) : (
                          <View style={styles.rxPendingPill}>
                            <Text style={styles.rxPendingText}>Step 2</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* ── Interactive Promo Code Dropdown Accordion ── */}
                  <View style={[styles.promoAccordionCard, appliedPromo && styles.promoAccordionCardApplied]}>
                    <TouchableOpacity
                      style={styles.promoAccordionHeader}
                      onPress={() => setIsPromoDropdownOpen(!isPromoDropdownOpen)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.promoHeaderLeft}>
                        <View style={[styles.promoIconWrap, appliedPromo && styles.promoIconWrapApplied]}>
                          <Ionicons
                            name={appliedPromo ? "checkmark-circle" : "pricetag"}
                            size={rs(18)}
                            color={appliedPromo ? "#059669" : C.primary}
                          />
                        </View>
                        <View style={styles.promoHeaderTextWrap}>
                          <Text style={styles.promoHeaderTitle}>
                            {appliedPromo ? `Coupon: ${appliedPromo}` : 'Apply Coupon'}
                          </Text>
                          <Text style={styles.promoHeaderSub}>
                            {appliedPromo
                              ? `Saved ₹${couponDiscount.toFixed(2)} on this order`
                              : 'Unlock extra discounts on your order'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.promoHeaderRight}>
                        {appliedPromo ? (
                          <View style={styles.appliedPill}>
                            <Ionicons name="checkmark-done" size={rs(12)} color="#047857" />
                            <Text style={styles.appliedPillText}>APPLIED</Text>
                          </View>
                        ) : (
                          <Text style={styles.promoActionHint}>
                            {isPromoDropdownOpen ? 'Close' : 'Select'}
                          </Text>
                        )}
                        <Ionicons
                          name={isPromoDropdownOpen ? "chevron-up" : "chevron-down"}
                          size={rs(18)}
                          color="#64748B"
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Expandable Accordion Body */}
                    {isPromoDropdownOpen && (
                      <View style={styles.promoAccordionBody}>
                        {appliedPromo ? (
                          <View style={styles.appliedPromoBox}>
                            <View style={styles.appliedPromoLeft}>
                              <View style={styles.appliedCheckCircle}>
                                <Ionicons name="checkmark" size={rs(14)} color="#FFFFFF" />
                              </View>
                              <View style={styles.appliedCodeDetails}>
                                <View style={styles.appliedCodeRow}>
                                  <Text style={styles.appliedCodeName}>{appliedPromo}</Text>
                                  <View style={styles.appliedSavingsTag}>
                                    <Text style={styles.appliedSavingsTagText}>-₹{couponDiscount.toFixed(2)}</Text>
                                  </View>
                                </View>
                                <Text style={styles.appliedCodeDesc}>
                                  Coupon applied! You unlocked extra pharmacy savings.
                                </Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              onPress={() => {
                                setAppliedPromo('');
                                setAppliedPromoObj(null);
                              }}
                              style={styles.removeCouponBtn}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.removeCouponText}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View>
                            <View style={styles.promoInputRow}>
                              <View style={styles.promoInputWrap}>
                                <Ionicons name="ticket-outline" size={rs(16)} color="#94A3B8" style={{ marginRight: rs(8) }} />
                                <TextInput
                                  style={styles.promoTextInput}
                                  placeholder="Enter coupon code (e.g. WELCOME10)"
                                  placeholderTextColor="#94A3B8"
                                  value={promoCode}
                                  onChangeText={setPromoCode}
                                  autoCapitalize="characters"
                                  autoCorrect={false}
                                />
                              </View>
                              <TouchableOpacity
                                style={[
                                  styles.applyCouponBtn,
                                  (!promoCode.trim() || isVerifyingPromo) && styles.applyCouponBtnDisabled
                                ]}
                                disabled={isVerifyingPromo || !promoCode.trim()}
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
                                      AlertService.show({
                                        type: 'success',
                                        title: 'Coupon Applied!',
                                        message: `Code ${code} has been successfully applied.`
                                      });
                                    } else {
                                      AlertService.show({
                                        type: 'error',
                                        title: 'Invalid Code',
                                        message: res.data?.message || 'Please enter a valid promo code.'
                                      });
                                    }
                                  } catch (error) {
                                    AlertService.show({
                                      type: 'error',
                                      title: 'Error',
                                      message: error.response?.data?.message || 'Failed to verify promo code.'
                                    });
                                  } finally {
                                    setIsVerifyingPromo(false);
                                  }
                                }}
                                activeOpacity={0.8}
                              >
                                {isVerifyingPromo ? (
                                  <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                  <Text style={styles.applyCouponText}>Apply</Text>
                                )}
                              </TouchableOpacity>
                            </View>

                            {/* Suggested Quick Coupons — Dynamic */}
                            {availableCoupons.length > 0 && (
                              <View style={styles.suggestedCouponsRow}>
                                <Text style={styles.suggestedLabel}>Popular:</Text>
                                <ScrollView
                                  horizontal
                                  showsHorizontalScrollIndicator={false}
                                  contentContainerStyle={{ gap: rs(6), alignItems: 'center' }}
                                >
                                  {availableCoupons.map((item) => {
                                    const code = typeof item === 'string' ? item : item.code;
                                    const discountBadge = typeof item === 'object' && item.discountType === 'Percentage'
                                      ? `${item.discountValue}% OFF`
                                      : typeof item === 'object' && item.discountValue
                                      ? `₹${item.discountValue} OFF`
                                      : null;

                                    return (
                                      <TouchableOpacity
                                        key={code}
                                        style={[
                                          styles.suggestedPill,
                                          promoCode === code && styles.suggestedPillActive
                                        ]}
                                        onPress={() => setPromoCode(code)}
                                        activeOpacity={0.7}
                                      >
                                        <Text style={styles.suggestedPillText}>{code}</Text>
                                        {discountBadge && (
                                          <View style={styles.couponDiscBadge}>
                                            <Text style={styles.couponDiscBadgeText}>{discountBadge}</Text>
                                          </View>
                                        )}
                                      </TouchableOpacity>
                                    );
                                  })}
                                </ScrollView>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* ── Interactive Celebration Savings Banner with Expandable Breakdown ── */}
                  {(doseboxDiscount > 0 || couponDiscount > 0) && (
                    <View style={styles.celebrationSavingsCard}>
                      <TouchableOpacity
                        style={styles.celebrationHeader}
                        onPress={() => setIsSavingsExpanded(!isSavingsExpanded)}
                        activeOpacity={0.8}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(10), flex: 1 }}>
                          <Text style={{ fontSize: rs(22) }}>🎉</Text>
                          <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6) }}>
                              <Text style={styles.celebrationAmount}>
                                ₹{(doseboxDiscount + couponDiscount).toFixed(2)} Saved
                              </Text>
                              <View style={styles.savingsPctBadge}>
                                <Text style={styles.savingsPctText}>
                                  {totalMRP > 0 ? Math.round(((doseboxDiscount + couponDiscount) / totalMRP) * 100) : 0}% OFF
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.celebrationSub}>Total savings on this order</Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(4) }}>
                          <Text style={styles.detailsToggleText}>
                            {isSavingsExpanded ? 'Hide' : 'Breakdown'}
                          </Text>
                          <Ionicons
                            name={isSavingsExpanded ? "chevron-up" : "chevron-down"}
                            size={rs(16)}
                            color="#D97706"
                          />
                        </View>
                      </TouchableOpacity>

                      {/* Expandable Breakdown Drawer */}
                      {isSavingsExpanded && (
                        <View style={styles.savingsBreakdownDrawer}>
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Total Item MRP</Text>
                            <Text style={styles.breakdownValue}>₹{totalMRP.toFixed(2)}</Text>
                          </View>
                          <View style={styles.breakdownRow}>
                            <Text style={[styles.breakdownLabel, { color: '#059669' }]}>
                              Specialty Direct Discount
                            </Text>
                            <Text style={[styles.breakdownValue, { color: '#059669', fontWeight: '700' }]}>
                              -₹{doseboxDiscount.toFixed(2)}
                            </Text>
                          </View>
                          {couponDiscount > 0 && (
                            <View style={styles.breakdownRow}>
                              <Text style={[styles.breakdownLabel, { color: '#4338CA' }]}>
                                Promo Coupon ({appliedPromo})
                              </Text>
                              <Text style={[styles.breakdownValue, { color: '#4338CA', fontWeight: '700' }]}>
                                -₹{couponDiscount.toFixed(2)}
                              </Text>
                            </View>
                          )}
                          <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: '#FDE68A', paddingTop: rv(6), marginTop: rv(4) }]}>
                            <Text style={[styles.breakdownLabel, { fontWeight: '800', color: '#92400E' }]}>
                              Net Pocket Savings
                            </Text>
                            <Text style={[styles.breakdownValue, { fontWeight: '800', color: '#92400E' }]}>
                              ₹{(doseboxDiscount + couponDiscount).toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Summary — Enhanced with clean dashed border style */}
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryCardHeader}>
                      <Ionicons name="receipt-outline" size={rs(16)} color={C.primary} />
                      <Text style={styles.summaryCardTitle}>Price Details</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total MRP</Text>
                      <Text style={styles.summaryValue}>₹{totalMRP.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: '#059669' }]}>DoseBox Discount</Text>
                      <Text style={[styles.summaryValue, { color: '#059669', fontWeight: '700' }]}>-₹{doseboxDiscount.toFixed(2)}</Text>
                    </View>
                    {couponDiscount > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: '#4338CA', fontWeight: 'bold' }]}>Promo Discount ({appliedPromo})</Text>
                        <Text style={[styles.summaryValue, { color: '#4338CA', fontWeight: 'bold' }]}>-₹{couponDiscount.toFixed(2)}</Text>
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
                      <Text style={[styles.summaryValue, deliveryFee === 0 && { color: '#059669', fontWeight: '700' }]}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</Text>
                    </View>

                    <View style={[styles.summaryRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Order Total</Text>
                      <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
                    </View>
                  </View>

                  {/* Need Support? Section */}
                  <View style={styles.supportCard}>
                    <Text style={styles.supportTitle}>Need Support?</Text>
                    <View style={styles.supportActions}>
                      <TouchableOpacity 
                        style={styles.supportBtn}
                        onPress={() => Linking.openURL('tel:+919876543210')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="call" size={rs(18)} color="#1F5C52" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.supportBtn}
                        onPress={() => Linking.openURL('https://wa.me/919876543210')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="logo-whatsapp" size={rs(18)} color="#25D366" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.supportBtn}
                        onPress={() => Linking.openURL('mailto:support@dosebox.in')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="chatbubble-ellipses" size={rs(18)} color="#3B82F6" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* ── RECOMMENDED MEDICINES SECTION ── */}
                  {recommendedMedicines.length > 0 && (
                    <View style={styles.recSection}>
                      <View style={styles.recHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.recBadgeRow}>
                            <Ionicons name="sparkles" size={12} color={C.primary} />
                            <Text style={styles.recOverline}>YOU MAY ALSO NEED</Text>
                          </View>
                          <Text style={styles.recTitle}>Recommended for You</Text>
                          <Text style={styles.recSub}>Common health essentials & popular add-ons</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.recViewAllBtn}
                          onPress={() => navigation.navigate('MainTabs', { screen: 'ExploreTab' })}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.recViewAllText}>View all</Text>
                          <Ionicons name="chevron-forward" size={11} color={C.primary} />
                        </TouchableOpacity>
                      </View>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.recList}
                        snapToInterval={REC_CARD_WIDTH + REC_CARD_GAP}
                        decelerationRate="fast"
                      >
                        {recommendedMedicines.map((med, idx) => (
                          <MedicineCard
                            key={med.id}
                            med={med}
                            containerStyle={[
                              styles.recCard,
                              {
                                width: REC_CARD_WIDTH,
                                marginRight: idx === recommendedMedicines.length - 1 ? 0 : REC_CARD_GAP
                              }
                            ]}
                            compact
                          />
                        ))}
                      </ScrollView>
                    </View>
                  )}
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
                      <View>
                        {savedAddresses.length > 0 ? (
                          <View style={{ gap: rs(8) }}>
                            {savedAddresses.map((addr) => {
                              const isSelected = selectedAddress?.id === addr.id;
                              return (
                                <TouchableOpacity
                                  key={addr.id}
                                  style={[
                                    styles.savedAddressCard,
                                    isSelected && styles.savedAddressCardActive
                                  ]}
                                  onPress={() => selectAddress(addr)}
                                  activeOpacity={0.8}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: rs(10) }}>
                                    <View style={[styles.radio, { marginTop: 2, marginRight: 0 }]}>
                                      {isSelected && <View style={styles.radioInner} />}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: 2 }}>
                                        <Text style={{ fontSize: rm(14), fontWeight: '700', color: C.text }}>
                                          {addr.title || 'Address'}
                                        </Text>
                                        {addr.isDefault && (
                                          <View style={{ backgroundColor: '#EAF4F2', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                                            <Text style={{ fontSize: rm(10), fontWeight: '700', color: C.primary }}>Default</Text>
                                          </View>
                                        )}
                                      </View>
                                      <Text style={{ fontSize: rm(12), color: '#64748B', lineHeight: rv(17) }}>
                                        {addr.street}, {addr.city}{addr.state ? `, ${addr.state}` : ''} - {addr.zipCode}
                                      </Text>
                                    </View>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        ) : (
                          <View style={{ backgroundColor: '#F8FAFC', padding: rs(16), borderRadius: radius.md, borderWidth: 1, borderColor: '#E2E8F0' }}>
                            <Text style={{ fontSize: rm(14), color: C.text, lineHeight: rv(20) }}>
                              {selectedAddress
                                ? `${selectedAddress.id !== 'current_loc' && selectedAddress.title ? `${selectedAddress.title} — ` : ''}${selectedAddress.street}${selectedAddress.city ? `, ${selectedAddress.city}` : ''}${selectedAddress.zipCode ? ` ${selectedAddress.zipCode}` : ''}`
                                : 'No address selected. Please tap "Use Location" or "+ New Address" above.'}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                </>
              )}

              {/* Step 3: Doctor's Prescription */}
              {currentStep === 3 && (
                <>
                  {/* Step Header */}
                  <View style={styles.rxStepHeaderCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rv(8) }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(8) }}>
                        <View style={{ width: rs(26), height: rs(26), backgroundColor: '#EAF4F2', borderRadius: rs(13), justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="document-text" size={rs(15)} color={C.primary} />
                        </View>
                        <Text style={{ fontSize: rm(16), fontWeight: '800', color: C.text }}>Doctor's Prescription</Text>
                      </View>

                      {requiresPrescription ? (
                        <View style={styles.rxRequiredTag}>
                          <Text style={styles.rxRequiredTagText}>Rx Required</Text>
                        </View>
                      ) : (
                        <View style={styles.rxOptionalTag}>
                          <Text style={styles.rxOptionalTagText}>Optional (OTC)</Text>
                        </View>
                      )}
                    </View>

                    <Text style={{ fontSize: rm(12), color: C.sub, lineHeight: rv(18) }}>
                      {requiresPrescription
                        ? 'Your cart contains prescription medications. A valid doctor\'s prescription is required before dispensing.'
                        : 'Your cart contains over-the-counter medicines. Attaching a prescription is optional.'}
                    </Text>
                  </View>

                  {/* Attached State */}
                  {attachedPrescriptionId ? (
                    <View style={styles.rxUploadCard}>
                      <View style={styles.rxAttachedCard}>
                        {/* Small Card Thumbnail with Tap-to-Zoom */}
                        <TouchableOpacity
                          style={styles.rxThumbnailWrap}
                          onPress={() => attachedPrescriptionUrl && setSelectedImageModal(attachedPrescriptionUrl)}
                          activeOpacity={0.8}
                        >
                          {attachedPrescriptionUrl ? (
                            <Image
                              source={{ uri: attachedPrescriptionUrl }}
                              style={styles.rxThumbnailImg}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.rxThumbnailFallback}>
                              <Ionicons name="document-text" size={rs(26)} color={C.primary} />
                            </View>
                          )}
                          <View style={styles.rxZoomIconPill}>
                            <Ionicons name="scan-outline" size={rs(10)} color="#FFFFFF" />
                            <Text style={styles.rxZoomText}>ZOOM</Text>
                          </View>
                        </TouchableOpacity>

                        {/* Meta info */}
                        <View style={styles.rxAttachedInfo}>
                          <View style={styles.rxStatusRow}>
                            <View style={styles.rxStatusPill}>
                              <Ionicons name="checkmark-circle" size={rs(11)} color="#047857" />
                              <Text style={styles.rxStatusPillText}>{attachedPrescriptionStatus || 'Approved ✓'}</Text>
                            </View>
                            <Text style={styles.rxIdText}>#RX-{attachedPrescriptionId}</Text>
                          </View>

                          <Text style={styles.rxAttachedNote}>Doctor's Prescription Attached</Text>

                          <View style={styles.rxAttachedActions}>
                            {attachedPrescriptionUrl && (
                              <TouchableOpacity
                                style={styles.rxViewFullBtn}
                                onPress={() => setSelectedImageModal(attachedPrescriptionUrl)}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="eye-outline" size={rs(12)} color={C.primary} />
                                <Text style={styles.rxViewFullText}>Preview</Text>
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity
                              style={styles.rxViewFullBtn}
                              onPress={() => {
                                AlertService.show({
                                  type: 'info',
                                  title: 'Change Prescription',
                                  message: 'Choose how to attach a new prescription:',
                                  buttons: [
                                    { text: 'Camera', onPress: () => handlePickRxImage(true) },
                                    { text: 'Gallery', onPress: () => handlePickRxImage(false) },
                                    ...(savedPrescriptions.length > 0 ? [{ text: 'Saved Rx', onPress: () => setShowSavedRxModal(true) }] : []),
                                    { text: 'Cancel', style: 'cancel' }
                                  ]
                                });
                              }}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="swap-horizontal" size={rs(12)} color={C.primary} />
                              <Text style={styles.rxViewFullText}>Change</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.rxRemoveBtn}
                              onPress={() => {
                                setAttachedPrescriptionId(null);
                                setAttachedPrescriptionUrl(null);
                                setAttachedPrescriptionStatus(null);
                              }}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="trash-outline" size={rs(12)} color="#E11D48" />
                              <Text style={styles.rxRemoveText}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  ) : (
                    /* Upload / Select Dropzone */
                    <View style={styles.rxDropzoneCard}>
                      {isUploadingRx ? (
                        <View style={styles.rxUploadingBox}>
                          <ActivityIndicator size="small" color={C.primary} />
                          <Text style={styles.rxUploadingText}>Uploading & verifying prescription...</Text>
                        </View>
                      ) : (
                        <>
                          <View style={styles.rxDropzonePrompt}>
                            <Ionicons name="cloud-upload-outline" size={rs(28)} color={C.primary} />
                            <Text style={styles.rxDropzonePromptTitle}>Upload Doctor's Prescription</Text>
                            <Text style={styles.rxDropzonePromptSub}>Supports Camera capture, JPG, PNG & PDF</Text>
                          </View>

                          <View style={styles.rxButtonRow}>
                            <TouchableOpacity
                              style={[styles.rxActionBtn, styles.rxActionBtnPrimary]}
                              onPress={() => handlePickRxImage(true)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="camera" size={rs(15)} color="#FFFFFF" />
                              <Text style={styles.rxActionBtnTextPrimary}>Camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.rxActionBtn, styles.rxActionBtnSecondary]}
                              onPress={() => handlePickRxImage(false)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="image" size={rs(15)} color={C.primary} />
                              <Text style={styles.rxActionBtnTextSecondary}>Gallery</Text>
                            </TouchableOpacity>

                            {savedPrescriptions.length > 0 && (
                              <TouchableOpacity
                                style={[styles.rxActionBtn, styles.rxActionBtnSaved]}
                                onPress={() => setShowSavedRxModal(true)}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="folder-open-outline" size={rs(15)} color="#475569" />
                                <Text style={styles.rxActionBtnTextSaved}>Saved ({savedPrescriptions.length})</Text>
                              </TouchableOpacity>
                            )}
                          </View>

                          {/* Rx Guidelines Card */}
                          <View style={styles.rxGuidelineBox}>
                            <Ionicons name="information-circle-outline" size={rs(15)} color="#0369A1" />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.rxGuidelineTitle}>Prescription Guidelines</Text>
                              <Text style={styles.rxGuidelineText}>• Must contain Doctor name & Clinic details</Text>
                              <Text style={styles.rxGuidelineText}>• Patient name & recent date must be visible</Text>
                              <Text style={styles.rxGuidelineText}>• Medicine names and dosage must be readable</Text>
                            </View>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </>
              )}

              {/* Step 4: Order Summary & Payment */}
              {currentStep === 4 && (
                <>
                  {/* Delivery Address Recap */}
                  <View style={styles.recapCard}>
                    <View style={styles.recapHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6) }}>
                        <Ionicons name="location" size={rs(15)} color={C.primary} />
                        <Text style={styles.recapTitle}>Delivery Address</Text>
                      </View>
                      <TouchableOpacity onPress={() => setCurrentStep(2)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.recapChangeBtn}>Change</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.recapAddressText}>
                      {selectedAddress
                        ? `${selectedAddress.id !== 'current_loc' && selectedAddress.title ? `${selectedAddress.title} — ` : ''}${selectedAddress.street}${selectedAddress.city ? `, ${selectedAddress.city}` : ''}${selectedAddress.zipCode ? ` ${selectedAddress.zipCode}` : ''}`
                        : 'No address selected.'}
                    </Text>
                  </View>

                  {/* Doctor's Prescription Recap */}
                  <View style={styles.recapCard}>
                    <View style={styles.recapHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6) }}>
                        <Ionicons name="document-text" size={rs(15)} color={C.primary} />
                        <Text style={styles.recapTitle}>Doctor's Prescription</Text>
                      </View>
                      <TouchableOpacity onPress={() => setCurrentStep(3)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.recapChangeBtn}>Change</Text>
                      </TouchableOpacity>
                    </View>
                    {attachedPrescriptionId ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(10) }}>
                        <TouchableOpacity
                          onPress={() => attachedPrescriptionUrl && setSelectedImageModal(attachedPrescriptionUrl)}
                          style={styles.recapRxThumb}
                          activeOpacity={0.8}
                        >
                          {attachedPrescriptionUrl ? (
                            <Image source={{ uri: attachedPrescriptionUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          ) : (
                            <Ionicons name="document-text" size={rs(18)} color={C.primary} />
                          )}
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6) }}>
                            <Text style={{ fontSize: rm(13), fontWeight: '700', color: C.text }}>
                              Prescription #RX-{attachedPrescriptionId}
                            </Text>
                            <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: rs(6), paddingVertical: rv(1), borderRadius: radius.full }}>
                              <Text style={{ fontSize: rm(10), fontWeight: '700', color: '#059669' }}>Attached ✓</Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: rm(11), color: '#64748B', marginTop: rv(2) }}>Tap thumbnail to zoom</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={{ fontSize: rm(12), color: '#64748B' }}>
                        {requiresPrescription ? '⚠️ Prescription required' : 'No prescription attached (OTC Order)'}
                      </Text>
                    )}
                  </View>

                  {/* Promo Code */}
                  {/* <Text style={styles.sectionLabel}>Promo Code</Text>
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
                  </View> */}

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

          {/* Place Order Footer — Enhanced */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + rv(16) }]}>
            <View style={styles.footerContent}>
              {/* Price Summary in Footer */}
              <View style={styles.footerPriceWrap}>
                <Text style={styles.footerPriceLabel}>Total</Text>
                <Text style={styles.footerPriceValue}>₹{finalTotal.toFixed(2)}</Text>
                {doseboxDiscount > 0 && (
                  <Text style={styles.footerSavings}>You save ₹{(doseboxDiscount + couponDiscount).toFixed(2)}</Text>
                )}
              </View>

              {/* CTA Button */}
              {currentStep === 1 && (
                <TouchableOpacity
                  style={styles.placeOrderBtn}
                  onPress={async () => {
                    try {
                      const token = await AsyncStorage.getItem('accessToken');
                      if (!token) {
                        AlertService.show({ type: 'info', title: 'Login Required', message: 'Please login to continue checkout.' });
                        navigation.navigate('Login', { returnTo: 'CartCheckout' });
                      } else {
                        setCurrentStep(2);
                      }
                    } catch (e) {
                      setCurrentStep(2);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.placeOrderText}>Next</Text>
                  <Ionicons name="arrow-forward" size={rs(16)} color="#FFFFFF" />
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
                  <Text style={styles.placeOrderText}>Next</Text>
                  <Ionicons name="arrow-forward" size={rs(16)} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              {currentStep === 3 && (
                <TouchableOpacity
                  style={[
                    styles.placeOrderBtn,
                    requiresPrescription && !attachedPrescriptionId && styles.placeOrderBtnDisabled
                  ]}
                  onPress={() => {
                    if (requiresPrescription && !attachedPrescriptionId) {
                      AlertService.show({
                        type: 'warning',
                        title: 'Prescription Required',
                        message: 'Your cart contains prescription medicines. Please upload or choose a prescription before continuing.'
                      });
                      return;
                    }
                    setCurrentStep(4);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.placeOrderText}>
                    {requiresPrescription && !attachedPrescriptionId ? 'Attach Rx' : 'Proceed'}
                  </Text>
                  <Ionicons name="arrow-forward" size={rs(16)} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              {currentStep === 4 && (
                <TouchableOpacity
                  style={styles.placeOrderBtn}
                  onPress={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  activeOpacity={0.85}
                >
                  {isPlacingOrder ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="lock-closed" size={rs(15)} color="#FFFFFF" />
                      <Text style={styles.placeOrderText}>
                        Payment • ₹{finalPayable.toFixed(2)}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      )}
    
      {/* ── Prescription Lightbox Zoom Modal ── */}
      <Modal
        visible={!!selectedImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImageModal(null)}
      >
        <View style={styles.lightboxOverlay}>
          <SafeAreaView style={styles.lightboxSafeWrap}>
            <View style={styles.lightboxHeader}>
              <Text style={styles.lightboxHeaderTitle}>Prescription Preview</Text>
              <TouchableOpacity
                style={styles.lightboxCloseBtn}
                onPress={() => setSelectedImageModal(null)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Ionicons name="close" size={rs(22)} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.lightboxBody}>
              {selectedImageModal && (
                <Image
                  source={{ uri: selectedImageModal }}
                  style={styles.lightboxImg}
                  resizeMode="contain"
                />
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── Saved Prescriptions Picker Modal ── */}
      <Modal
        visible={showSavedRxModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSavedRxModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.savedRxModalSheet}>
            <View style={styles.savedRxModalHeader}>
              <View>
                <Text style={styles.savedRxModalTitle}>Choose Saved Prescription</Text>
                <Text style={styles.savedRxModalSub}>Select from your past orders or uploads</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSavedRxModal(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.savedRxCloseBtn}
              >
                <Ionicons name="close" size={rs(20)} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: rv(380) }} showsVerticalScrollIndicator={false}>
              {savedPrescriptions.map((rx) => {
                const rxImg = rx.fileUrl ? getFullImageUrl(rx.fileUrl) : null;
                const isCurrent = String(rx.id) === String(attachedPrescriptionId);
                return (
                  <TouchableOpacity
                    key={rx.id}
                    style={[styles.savedRxItemCard, isCurrent && styles.savedRxItemCardActive]}
                    onPress={() => {
                      setAttachedPrescriptionId(String(rx.id));
                      if (rxImg) setAttachedPrescriptionUrl(rxImg);
                      setAttachedPrescriptionStatus(rx.status || 'Approved');
                      setShowSavedRxModal(false);
                      AlertService.show({
                        type: 'success',
                        title: 'Prescription Attached',
                        message: `Saved Prescription #RX-${rx.id} attached to order.`
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.savedRxThumbWrap}>
                      {rxImg ? (
                        <Image source={{ uri: rxImg }} style={styles.savedRxThumbImg} resizeMode="cover" />
                      ) : (
                        <Ionicons name="document-text" size={rs(20)} color={C.primary} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.savedRxItemId}>Prescription #RX-{rx.id}</Text>
                      <Text style={styles.savedRxItemDate}>
                        Uploaded {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : 'Recently'}
                      </Text>
                    </View>
                    <View style={[styles.savedRxSelectBtn, isCurrent && styles.savedRxSelectBtnActive]}>
                      <Text style={[styles.savedRxSelectText, isCurrent && styles.savedRxSelectTextActive]}>
                        {isCurrent ? 'Attached ✓' : 'Select'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Styles: Main ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: rv(12), backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: rs(38), height: rs(38), borderRadius: rs(10), backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', marginRight: rs(12) },
  headerTitle: { fontSize: rm(20), fontWeight: '800', color: C.text },
  headerSubtitle: { fontSize: rm(12), fontWeight: '500', color: C.sub, marginTop: rv(2) },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(4), backgroundColor: C.light, paddingHorizontal: rs(12), paddingVertical: rv(6), borderRadius: radius.full },
  addMoreText: { fontSize: rm(12), fontWeight: '700', color: C.primary },
  countBadge: { backgroundColor: C.primary, paddingHorizontal: rs(10), paddingVertical: rv(4), borderRadius: radius.full },
  countText: { color: C.white, fontSize: rm(12), fontWeight: '700' },
  scroll: { flex: 1 },
  sectionLabel: { fontSize: rm(13), fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: rv(20), marginBottom: rv(12) },
  cartItemsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: rv(20), marginBottom: rv(12) },
  sectionLabelCustom: { fontSize: rm(13), fontWeight: '800', color: C.text, textTransform: 'uppercase', letterSpacing: 0.6 },
  itemCountPill: { backgroundColor: C.light, paddingHorizontal: rs(8), paddingVertical: rv(2), borderRadius: radius.full },
  itemCountPillText: { fontSize: rm(11), fontWeight: '700', color: C.primary },
  clearCartText: { fontSize: rm(12), fontWeight: '700', color: '#EF4444' },

  cartCard: {
    backgroundColor: C.white,
    borderRadius: radius.xl,
    padding: rs(16),
    marginBottom: rv(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  cartCardTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cartCardImageWrap: {
    width: rs(80),
    height: rs(80),
    borderRadius: radius.lg,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: rs(6),
    marginRight: rs(12),
    position: 'relative',
    overflow: 'visible',
  },
  cartCardImage: { width: '100%', height: '100%' },
  cartCardImageFallback: { alignItems: 'center', justifyContent: 'center' },
  // Discount badge overlaid on product image
  imgDiscountBadge: {
    position: 'absolute',
    top: -rv(4),
    left: -rs(4),
    backgroundColor: '#EF4444',
    paddingHorizontal: rs(6),
    paddingVertical: rv(2),
    borderRadius: rs(6),
    zIndex: 10,
  },
  imgDiscountText: {
    fontSize: rm(9),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  imgBadgeRow: {
    position: 'absolute',
    bottom: -rv(4),
    left: 0,
    flexDirection: 'row',
    gap: rs(3),
    zIndex: 10,
  },
  imgRxBadge: {
    width: rs(20),
    height: rs(20),
    borderRadius: rs(10),
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgRxBadgeText: {
    fontSize: rm(8),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  imgColdBadge: {
    width: rs(20),
    height: rs(20),
    borderRadius: rs(10),
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgColdBadgeText: {
    fontSize: rm(10),
  },
  cartCardInfo: { flex: 1, paddingRight: rs(6) },
  cartCardName: { fontSize: rm(14.5), fontWeight: '700', color: C.text, lineHeight: rv(19) },
  cartCardBrand: { fontSize: rm(11), fontWeight: '500', color: '#64748B', marginTop: rv(3) },
  cartCardPackInfo: { fontSize: rm(11), fontWeight: '600', color: '#64748B', marginTop: rv(2) },
  cartCardMolecule: { fontSize: rm(11), fontWeight: '600', color: '#0284C7', marginTop: rv(1.5), textTransform: 'uppercase' },
  cartCardBadgesRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginTop: rv(4), flexWrap: 'wrap' },
  rxMiniBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(3), backgroundColor: '#FEF2F2', paddingHorizontal: rs(6), paddingVertical: rv(2), borderRadius: radius.sm },
  rxMiniBadgeText: { fontSize: rm(9.5), fontWeight: '700', color: '#DC2626' },
  coldMiniBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(3), backgroundColor: '#E0F2FE', paddingHorizontal: rs(6), paddingVertical: rv(2), borderRadius: radius.sm },
  coldMiniBadgeText: { fontSize: rm(9.5), fontWeight: '700', color: '#0284C7' },
  cartCardPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: rs(6), marginTop: rv(6) },
  cartCardEffectivePrice: { fontSize: rm(16), fontWeight: '800', color: C.primary },
  cartCardMrp: { fontSize: rm(12), color: '#94A3B8', textDecorationLine: 'line-through' },
  cartCardDiscountBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: rs(5), paddingVertical: rv(1), borderRadius: radius.sm },
  cartCardDiscountText: { fontSize: rm(9.5), fontWeight: '800', color: '#166534' },
  cartCardDeleteBtn: { padding: rs(6), marginTop: -rv(2) },

  cartCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: rv(10),
    marginTop: rv(10),
  },
  cartCardSubtotalWrap: { flexDirection: 'column' },
  cartCardSubtotalLabel: { fontSize: rm(11), color: C.sub, fontWeight: '500' },
  cartCardSubtotalValue: { fontSize: rm(15), fontWeight: '800', color: C.text, marginTop: rv(1) },

  advQtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 2,
  },
  advQtyBtn: {
    width: rs(28),
    height: rs(28),
    borderRadius: radius.full,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  advQtyBtnPlus: {
    backgroundColor: C.primary,
  },
  advQtyNumberWrap: {
    minWidth: rs(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  advQtyText: {
    fontSize: rm(13),
    fontWeight: '800',
    color: C.text,
  },
  summaryCard: {
    backgroundColor: C.white,
    borderRadius: radius.lg,
    padding: rs(16),
    marginTop: rv(4),
    marginBottom: rv(10),
    borderWidth: 1,
    borderColor: C.primary,
    borderStyle: 'dashed',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    marginBottom: rv(14),
    paddingBottom: rv(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryCardTitle: {
    fontSize: rm(15),
    fontWeight: '800',
    color: C.text,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rv(10) },
  summaryLabel: { fontSize: rm(14), color: C.sub },
  summaryValue: { fontSize: rm(14), color: C.text, fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: rv(12), marginTop: rv(4), marginBottom: 0 },
  totalLabel: { fontSize: rm(17), fontWeight: '700', color: C.text },
  totalValue: { fontSize: rm(17), fontWeight: '800', color: C.primary },

  // Prescription Notice
  prescriptionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    paddingHorizontal: rs(12),
    paddingVertical: rv(10),
    marginBottom: rv(12),
  },
  prescriptionNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
  },
  prescriptionNoticeIcon: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prescriptionNoticeText: {
    fontSize: rm(12.5),
    color: '#991B1B',
    fontWeight: '500',
  },
  prescriptionNoticeLink: {
    fontSize: rm(12),
    fontWeight: '800',
    color: '#DC2626',
    textDecorationLine: 'underline',
  },


  /* Secure Badge */
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    backgroundColor: '#F0FDF4',
    paddingHorizontal: rs(10),
    paddingVertical: rv(5),
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  secureBadgeText: {
    fontSize: rm(11),
    fontWeight: '700',
    color: '#166534',
  },

  /* Modern Stepper */
  modernStepperWrap: {
    backgroundColor: C.white,
    paddingHorizontal: spacing.lg,
    paddingTop: rv(14),
    paddingBottom: rv(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
  },
  stepperTrackLine: {
    position: 'absolute',
    top: rv(28),
    left: rs(48),
    right: rs(48),
    height: 2,
    backgroundColor: '#E2E8F0',
    zIndex: 1,
  },
  stepperTrackLineActive: {
    position: 'absolute',
    top: rv(28),
    left: rs(48),
    height: 2,
    backgroundColor: C.primary,
    zIndex: 2,
  },
  stepperNodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  stepperNode: {
    alignItems: 'center',
    width: rs(70),
  },
  stepperCircle: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: rv(4),
  },
  stepperCircleActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  stepperCircleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepperCircleInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  stepperCircleNum: {
    fontSize: rm(11.5),
    fontWeight: '800',
    color: '#64748B',
  },
  stepperCircleNumActive: {
    color: '#FFFFFF',
  },
  stepperNodeLabel: {
    fontSize: rm(11),
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  stepperNodeLabelActive: {
    color: C.primary,
    fontWeight: '800',
  },
  stepperNodeSub: {
    fontSize: rm(9.5),
    color: '#94A3B8',
    marginTop: rv(1),
  },

  /* Rx Notice Card */
  rxCartNoticeCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.lg,
    padding: rs(12),
    marginBottom: rv(12),
  },
  rxCartNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
  },
  rxNoticeBadge: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(8),
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxNoticeTitle: {
    fontSize: rm(13),
    fontWeight: '700',
    color: '#92400E',
  },
  rxNoticeSub: {
    fontSize: rm(11),
    color: '#B45309',
    marginTop: rv(1),
  },
  rxAttachedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    backgroundColor: '#DCFCE7',
    paddingHorizontal: rs(8),
    paddingVertical: rv(4),
    borderRadius: radius.full,
  },
  rxAttachedText: {
    fontSize: rm(11),
    fontWeight: '700',
    color: '#059669',
  },
  rxPendingPill: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: rs(8),
    paddingVertical: rv(4),
    borderRadius: radius.full,
  },
  rxPendingText: {
    fontSize: rm(10.5),
    fontWeight: '700',
    color: '#B45309',
  },

  /* Promo Accordion Card — Ultra Structured & Sleek */
  promoAccordionCard: {
    backgroundColor: C.white,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: rv(14),
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  promoAccordionCardApplied: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  promoAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(14),
    paddingVertical: rv(12),
  },
  promoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    flex: 1,
  },
  promoIconWrap: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(10),
    backgroundColor: '#EAF4F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoIconWrapApplied: {
    backgroundColor: '#DCFCE7',
  },
  promoHeaderTextWrap: {
    flex: 1,
  },
  promoHeaderTitle: {
    fontSize: rm(13.5),
    fontWeight: '700',
    color: '#0F172A',
  },
  promoHeaderSub: {
    fontSize: rm(11),
    fontWeight: '500',
    color: '#64748B',
    marginTop: rv(1),
  },
  promoHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
  },
  appliedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(3),
    backgroundColor: '#DCFCE7',
    paddingHorizontal: rs(8),
    paddingVertical: rv(3),
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  appliedPillText: {
    fontSize: rm(10),
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  promoActionHint: {
    fontSize: rm(11.5),
    fontWeight: '700',
    color: C.primary,
  },
  promoAccordionBody: {
    paddingHorizontal: rs(14),
    paddingTop: rv(4),
    paddingBottom: rv(14),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    marginTop: rv(10),
  },
  promoInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: radius.lg,
    paddingHorizontal: rs(12),
    height: rv(44),
  },
  promoTextInput: {
    flex: 1,
    fontSize: rm(13),
    fontWeight: '700',
    color: '#0F172A',
    padding: 0,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  applyCouponBtn: {
    backgroundColor: C.primary,
    height: rv(44),
    paddingHorizontal: rs(18),
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  applyCouponBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  applyCouponText: {
    color: '#FFFFFF',
    fontSize: rm(13),
    fontWeight: '700',
  },
  suggestedCouponsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: rs(6),
    marginTop: rv(10),
  },
  suggestedLabel: {
    fontSize: rm(11),
    fontWeight: '600',
    color: '#64748B',
  },
  suggestedPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: radius.full,
    paddingHorizontal: rs(8),
    paddingVertical: rv(3),
  },
  suggestedPillText: {
    fontSize: rm(10.5),
    fontWeight: '700',
    color: C.primary,
  },
  suggestedPillActive: {
    backgroundColor: '#EAF4F2',
    borderColor: C.primary,
    borderStyle: 'solid',
  },
  couponDiscBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: rs(5),
    paddingVertical: rv(1),
    borderRadius: radius.full,
    marginLeft: rs(4),
  },
  couponDiscBadgeText: {
    fontSize: rm(9),
    fontWeight: '800',
    color: '#047857',
  },
  appliedPromoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: radius.lg,
    padding: rs(12),
    marginTop: rv(8),
  },
  appliedPromoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    flex: 1,
  },
  appliedCheckCircle: {
    width: rs(24),
    height: rs(24),
    borderRadius: rs(12),
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedCodeDetails: {
    flex: 1,
  },
  appliedCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
  },
  appliedCodeName: {
    fontSize: rm(13),
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  appliedSavingsTag: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: rs(6),
    paddingVertical: rv(1),
    borderRadius: radius.sm,
  },
  appliedSavingsTagText: {
    fontSize: rm(10),
    fontWeight: '800',
    color: '#059669',
  },
  appliedCodeDesc: {
    fontSize: rm(10.5),
    color: '#047857',
    marginTop: rv(1),
  },
  removeCouponBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: rs(10),
    paddingVertical: rv(5),
    borderRadius: radius.sm,
  },
  removeCouponText: {
    fontSize: rm(11),
    fontWeight: '700',
    color: '#E11D48',
  },

  /* Celebration Savings Card */
  celebrationSavingsCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: radius.xl,
    paddingHorizontal: rs(14),
    paddingVertical: rv(12),
    marginBottom: rv(14),
    overflow: 'hidden',
  },
  celebrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  celebrationAmount: {
    fontSize: rm(14),
    fontWeight: '800',
    color: '#92400E',
  },
  savingsPctBadge: {
    backgroundColor: '#D97706',
    paddingHorizontal: rs(6),
    paddingVertical: rv(1),
    borderRadius: radius.full,
  },
  savingsPctText: {
    fontSize: rm(9.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  celebrationSub: {
    fontSize: rm(11),
    color: '#B45309',
    marginTop: rv(1),
  },
  detailsToggleText: {
    fontSize: rm(11.5),
    fontWeight: '700',
    color: '#D97706',
  },
  savingsBreakdownDrawer: {
    marginTop: rv(10),
    paddingTop: rv(10),
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rv(4),
  },
  breakdownLabel: {
    fontSize: rm(12),
    color: '#78350F',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: rm(12),
    fontWeight: '600',
    color: '#78350F',
  },


  /* Prescription Upload Section Styles */
  rxUploadCard: {
    backgroundColor: C.white,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: rs(14),
    marginBottom: rv(14),
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  rxUploadCardAttached: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  rxUploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    marginBottom: rv(12),
  },
  rxUploadIconWrap: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(10),
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxUploadIconWrapAttached: {
    backgroundColor: '#DCFCE7',
  },
  rxUploadTitle: {
    fontSize: rm(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  rxReqBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: rs(6),
    paddingVertical: rv(1),
    borderRadius: radius.sm,
  },
  rxReqBadgeAttached: {
    backgroundColor: '#DCFCE7',
  },
  rxReqBadgeText: {
    fontSize: rm(9.5),
    fontWeight: '800',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  rxReqBadgeTextAttached: {
    color: '#059669',
  },
  rxUploadSub: {
    fontSize: rm(11),
    color: '#64748B',
    marginTop: rv(1),
  },

  /* Attached Prescription Card with Thumbnail */
  rxAttachedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.lg,
    padding: rs(10),
  },
  rxThumbnailWrap: {
    width: rs(64),
    height: rs(76),
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxThumbnailImg: {
    width: '100%',
    height: '100%',
  },
  rxThumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxZoomIconPill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(3),
    paddingVertical: rv(2),
  },
  rxZoomText: {
    fontSize: rm(8.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rxAttachedInfo: {
    flex: 1,
  },
  rxStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    marginBottom: rv(2),
  },
  rxStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(3),
    backgroundColor: '#DCFCE7',
    paddingHorizontal: rs(6),
    paddingVertical: rv(2),
    borderRadius: radius.full,
  },
  rxStatusPillText: {
    fontSize: rm(10),
    fontWeight: '800',
    color: '#047857',
  },
  rxIdText: {
    fontSize: rm(11),
    fontWeight: '700',
    color: '#64748B',
  },
  rxAttachedNote: {
    fontSize: rm(11),
    color: '#334155',
    marginBottom: rv(6),
  },
  rxAttachedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
  },
  rxViewFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    backgroundColor: '#EAF4F2',
    paddingHorizontal: rs(8),
    paddingVertical: rv(4),
    borderRadius: radius.sm,
  },
  rxViewFullText: {
    fontSize: rm(11),
    fontWeight: '700',
    color: '#1F5C52',
  },
  rxRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    backgroundColor: '#FFF1F2',
    paddingHorizontal: rs(8),
    paddingVertical: rv(4),
    borderRadius: radius.sm,
  },
  rxRemoveText: {
    fontSize: rm(11),
    fontWeight: '700',
    color: '#E11D48',
  },

  /* Dropzone when not yet attached */
  rxDropzoneCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: rs(12),
  },
  rxDropzonePrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rv(10),
  },
  rxDropzonePromptTitle: {
    fontSize: rm(12.5),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: rv(4),
  },
  rxDropzonePromptSub: {
    fontSize: rm(10.5),
    color: '#64748B',
    marginTop: rv(1),
  },
  rxButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
  },
  rxActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(5),
    height: rv(38),
    borderRadius: radius.md,
  },
  rxActionBtnPrimary: {
    backgroundColor: C.primary,
  },
  rxActionBtnTextPrimary: {
    fontSize: rm(12),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rxActionBtnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.primary,
  },
  rxActionBtnTextSecondary: {
    fontSize: rm(12),
    fontWeight: '700',
    color: C.primary,
  },
  rxActionBtnSaved: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  rxActionBtnTextSaved: {
    fontSize: rm(11.5),
    fontWeight: '600',
    color: '#475569',
  },
  rxUploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    paddingVertical: rv(12),
  },
  rxUploadingText: {
    fontSize: rm(12.5),
    fontWeight: '600',
    color: C.primary,
  },

  /* Lightbox Zoom Modal */
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  lightboxSafeWrap: {
    flex: 1,
  },
  lightboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16),
    paddingVertical: rv(12),
  },
  lightboxHeaderTitle: {
    fontSize: rm(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lightboxCloseBtn: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: rs(12),
  },
  lightboxImg: {
    width: '100%',
    height: '100%',
  },

  /* Saved Rx Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  savedRxModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: rs(16),
    maxHeight: '80%',
  },
  savedRxModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rv(14),
    paddingBottom: rv(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  savedRxModalTitle: {
    fontSize: rm(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  savedRxModalSub: {
    fontSize: rm(11.5),
    color: '#64748B',
    marginTop: rv(1),
  },
  savedRxCloseBtn: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedRxItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.lg,
    padding: rs(10),
    marginBottom: rv(8),
  },
  savedRxItemCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  savedRxThumbWrap: {
    width: rs(44),
    height: rs(52),
    borderRadius: radius.sm,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedRxThumbImg: {
    width: '100%',
    height: '100%',
  },
  savedRxItemId: {
    fontSize: rm(13),
    fontWeight: '700',
    color: '#0F172A',
  },
  savedRxItemDate: {
    fontSize: rm(11),
    color: '#64748B',
    marginTop: rv(1),
  },
  savedRxSelectBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: rs(12),
    paddingVertical: rv(6),
    borderRadius: radius.md,
  },
  savedRxSelectBtnActive: {
    backgroundColor: '#10B981',
  },
  savedRxSelectText: {
    fontSize: rm(11.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  savedRxSelectTextActive: {
    color: '#FFFFFF',
  },

  // Savings Banner
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.lg,
    paddingHorizontal: rs(14),
    paddingVertical: rv(12),
    marginBottom: rv(10),
  },
  savingsBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
  },
  savingsEmoji: {
    fontSize: rm(22),
  },
  savingsAmount: {
    fontSize: rm(15),
    fontWeight: '800',
    color: '#B45309',
  },
  savingsSub: {
    fontSize: rm(11),
    fontWeight: '500',
    color: '#D97706',
    marginTop: rv(1),
  },

  // Offers Card
  offersCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.lg,
    paddingHorizontal: rs(14),
    paddingVertical: rv(14),
    marginBottom: rv(10),
  },
  offersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
  },
  offersIcon: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offersText: {
    fontSize: rm(14),
    fontWeight: '700',
    color: '#166534',
  },

  // Support Section
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: radius.lg,
    paddingHorizontal: rs(16),
    paddingVertical: rv(14),
    marginBottom: rv(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  supportTitle: {
    fontSize: rm(15),
    fontWeight: '800',
    color: C.text,
  },
  supportActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
  },
  supportBtn: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Recommendation Section Styles
  recSection: {
    marginTop: rv(16),
    marginBottom: rv(8),
    backgroundColor: C.white,
    borderRadius: radius.xl,
    padding: REC_SECTION_PAD,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  recHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: rv(12),
  },
  recBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    marginBottom: rv(2),
  },
  recOverline: {
    fontSize: rm(10),
    fontWeight: '800',
    color: C.primary,
    letterSpacing: 0.8,
  },
  recTitle: {
    fontSize: rm(16),
    fontWeight: '800',
    color: C.text,
  },
  recSub: {
    fontSize: rm(11.5),
    color: C.sub,
    marginTop: rv(1),
  },
  recViewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(2),
    backgroundColor: C.light,
    paddingHorizontal: rs(10),
    paddingVertical: rv(5),
    borderRadius: radius.full,
    marginTop: rv(2),
  },
  recViewAllText: {
    fontSize: rm(11.5),
    fontWeight: '700',
    color: C.primary,
  },
  recList: {
    paddingVertical: rv(4),
  },
  recCard: {
    minHeight: rv(250),
  },

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

  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: rv(12),
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
  },
  footerPriceWrap: {
    flexShrink: 0,
    minWidth: rs(80),
    maxWidth: rs(115),
  },
  footerPriceLabel: {
    fontSize: rm(10.5),
    fontWeight: '500',
    color: C.sub,
  },
  footerPriceValue: {
    fontSize: rm(17),
    fontWeight: '800',
    color: C.text,
  },
  footerSavings: {
    fontSize: rm(9.5),
    fontWeight: '700',
    color: '#059669',
    marginTop: rv(1),
  },
  placeOrderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    backgroundColor: C.primary,
    minHeight: rv(48),
    paddingHorizontal: rs(16),
    borderRadius: radius.lg,
  },
  placeOrderBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.7,
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: rm(15),
    fontWeight: '700',
  },

  stepperWrap: { paddingHorizontal: spacing.lg, paddingVertical: rv(16), backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: rv(8) },
  stepDot: { width: rs(30), height: rs(30), borderRadius: rs(15), backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: C.primary },
  stepDotText: { fontSize: rm(12), fontWeight: 'bold', color: C.sub },
  stepDotTextActive: { color: C.white },
  stepLine: { flex: 1, height: 2, backgroundColor: C.border, marginHorizontal: rs(4) },
  stepLineActive: { backgroundColor: C.primary },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: rs(4) },
  stepLabelText: { fontSize: rm(12), color: C.sub, fontWeight: '600' },
  stepLabelTextActive: { color: C.primary },

  // Step 2 & 4 Recap and Saved Address Styles
  savedAddressCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: rs(12),
  },
  savedAddressCardActive: {
    borderColor: C.primary,
    backgroundColor: '#EAF4F2',
  },
  recapCard: {
    backgroundColor: C.white,
    borderRadius: radius.lg,
    padding: rs(14),
    marginBottom: rv(12),
    borderWidth: 1,
    borderColor: C.border,
  },
  recapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rv(6),
  },
  recapTitle: {
    fontSize: rm(13),
    fontWeight: '700',
    color: C.text,
  },
  recapChangeBtn: {
    fontSize: rm(12),
    fontWeight: '700',
    color: C.primary,
  },
  recapAddressText: {
    fontSize: rm(13),
    color: '#475569',
    lineHeight: rv(19),
  },
  recapRxThumb: {
    width: rs(44),
    height: rs(54),
    borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxStepHeaderCard: {
    backgroundColor: C.white,
    borderRadius: radius.xl,
    padding: rs(16),
    marginBottom: rv(14),
    borderWidth: 1,
    borderColor: C.border,
  },
  rxRequiredTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: rs(8),
    paddingVertical: rv(3),
    borderRadius: radius.full,
  },
  rxRequiredTagText: {
    fontSize: rm(10),
    fontWeight: '800',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  rxOptionalTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: rs(8),
    paddingVertical: rv(3),
    borderRadius: radius.full,
  },
  rxOptionalTagText: {
    fontSize: rm(10),
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  rxGuidelineBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(8),
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.md,
    padding: rs(12),
    marginTop: rv(12),
  },
  rxGuidelineTitle: {
    fontSize: rm(12),
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: rv(2),
  },
  rxGuidelineText: {
    fontSize: rm(11),
    color: '#0C4A6E',
    lineHeight: rv(16),
  },

  // Horizontal Category Strip Styles
  catStripWrap: {
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: rv(8),
  },
  catStripContent: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  catPill: {
    width: CAT_CARD_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(10),
    paddingVertical: rv(8),
    borderRadius: radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: rs(8),
  },
  catPillAll: {
    backgroundColor: '#EAF4F2',
    borderColor: '#B2D8D0',
  },
  catPillMore: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  catPillText: {
    fontSize: rm(12),
    fontWeight: '600',
    color: '#334155',
    flexShrink: 1,
  },
  catPillTextAll: {
    color: C.primary,
    fontWeight: '700',
  },
  catIconWrap: {
    width: rs(22),
    height: rs(22),
    borderRadius: rs(11),
    backgroundColor: '#EAF4F2',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: rs(6),
  },
  catIconImg: {
    width: '100%',
    height: '100%',
    borderRadius: rs(11),
  },
});

// ─── Category Helper Functions & Pill Item ─────────────────────
const getCategoryPhotoUrl = (cat) => {
  const slug = (cat.slug || '').toLowerCase();
  const name = (cat.name || '').toLowerCase();

  if (cat.image && typeof cat.image === 'string' && cat.image.trim() !== '' && cat.image !== 'url' && cat.image !== '[]') {
    return getFullImageUrl(cat.image);
  }

  // Curated photographic images matching website
  if (slug === 'allergy-medication' || name.includes('allergy')) return getFullImageUrl('/categories/allergy-medication.jpg');
  if (slug === 'alzheimers' || name.includes('alzheimer') || name.includes('dementia')) return getFullImageUrl('/categories/alzheimers.jpg');
  if (slug === 'anaesthetics' || name.includes('anaesthetic') || name.includes('anesthetic')) return getFullImageUrl('/categories/anaesthetics.jpg');
  if (slug === 'anemia' || name.includes('anemia')) return getFullImageUrl('/categories/anemia.jpg');
  if (slug === 'anti-cancer' || name.includes('cancer') || name.includes('oncology')) return getFullImageUrl('/categories/anti-cancer.jpg');
  if (slug === 'antibacterials' || slug === 'anti-bacterials' || name.includes('antibacterial') || name.includes('bacterial')) return getFullImageUrl('/categories/antibacterials.jpg');
  if (slug === 'anticoagulants' || name.includes('anticoagulant') || name.includes('coagulant')) return getFullImageUrl('/categories/anticoagulants.jpg');
  if (slug === 'anti-fungals' || name.includes('fungal')) return getFullImageUrl('/categories/anti-cancer.jpg');
  if (slug === 'kidney-care' || name.includes('kidney')) return getFullImageUrl('/categories/anemia.jpg');

  return null;
};

const getCategoryIconName = (cat) => {
  if (cat.icon && typeof cat.icon === 'string' && !cat.icon.startsWith('http') && !cat.icon.includes('/')) {
    return cat.icon;
  }
  const name = (cat.name || '').toLowerCase();
  if (name.includes('cardio') || name.includes('heart')) return 'heart-outline';
  if (name.includes('diabet') || name.includes('sugar')) return 'water-outline';
  if (name.includes('cancer') || name.includes('oncol')) return 'ribbon-outline';
  if (name.includes('allergy') || name.includes('asthma') || name.includes('breath')) return 'leaf-outline';
  if (name.includes('kidney') || name.includes('renal')) return 'shield-checkmark-outline';
  if (name.includes('neuro') || name.includes('brain') || name.includes('alzheimer')) return 'bulb-outline';
  if (name.includes('eye') || name.includes('vision') || name.includes('ophthal')) return 'eye-outline';
  if (name.includes('skin') || name.includes('derma')) return 'sparkles-outline';
  if (name.includes('bacteri') || name.includes('infect')) return 'bandage-outline';
  if (name.includes('anemia') || name.includes('blood') || name.includes('coagulant')) return 'pulse-outline';
  return 'medical-outline';
};

function CategoryPillItem({ cat, navigation }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = getCategoryPhotoUrl(cat);
  const iconName = getCategoryIconName(cat);

  return (
    <TouchableOpacity
      style={styles.catPill}
      onPress={() =>
        navigation.navigate('SearchScreen', {
          query: cat.name,
          categorySlug: cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-'),
        })
      }
      activeOpacity={0.7}
    >
      <View style={styles.catIconWrap}>
        {!imgError && photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.catIconImg}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Ionicons name={iconName} size={rs(12)} color={C.primary} />
        )}
      </View>
      <Text style={styles.catPillText} numberOfLines={1}>
        {cat.name}
      </Text>
    </TouchableOpacity>
  );
}

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
  recWrap: { marginTop: rv(28), paddingBottom: rv(16) },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(6), paddingHorizontal: spacing.lg, marginBottom: rv(12) },
  recTitle: { fontSize: rm(16), fontWeight: '800', color: C.text },
});
