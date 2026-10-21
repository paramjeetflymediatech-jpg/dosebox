import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  FlatList,
  Modal,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Linking,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { rs, rv, rm, isTablet, spacing, radius } from '../../utils/responsive';
import { useCart } from '../../context/CartContext';
import MedicineCard from '../../components/MedicineCard';
import { useLocation } from '../../context/LocationContext';
import api from '../../services/api';
import { getFullImageUrl } from '../../utils/image';
import Geolocation from '@react-native-community/geolocation';
import PermissionsService from '../../services/PermissionsService';
import { AlertService } from '../../services/AlertService';

// ─── Color Tokens ────────────────────────────────────────────
const C = {
  primary: '#0c888d', // Web brand color
  primaryLight: '#EAF4F2',
  accent: '#e68a7f', // Reddish discount color
  bg: '#F8FAFC',
  white: '#FFFFFF',
  text: '#2d3748', // Dark text
  sub: '#8c8c8c', // Subtext
  border: '#E9EDF2',
  card: '#FFFFFF',
  red: '#e68a7f',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAT_CARD_GAP = rs(10);
const CAT_VISIBLE_COUNT = isTablet ? 4 : 2;
const CAT_CARD_WIDTH = Math.floor(
  (SCREEN_WIDTH - spacing.md * 2 - CAT_CARD_GAP * (CAT_VISIBLE_COUNT - 1)) / CAT_VISIBLE_COUNT
);

const MED_CARD_GAP = rs(10);
const MED_VISIBLE_COUNT = isTablet ? 4 : 2;
const MED_CARD_WIDTH = Math.floor(
  (SCREEN_WIDTH - spacing.md * 2 - MED_CARD_GAP * (MED_VISIBLE_COUNT - 1)) / MED_VISIBLE_COUNT
);

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

  return getFullImageUrl('/categories/allergy-medication.jpg');
};

const CATEGORY_GRADIENTS = [
  ['#4f87c5', '#6fa3e0'],
  ['#0c888d', '#29b5bb'],
  ['#e8783a', '#f0974e'],
  ['#7c6fc4', '#a494e0'],
  ['#3ea8b0', '#5dc8d0'],
];

const AnimatedQuickLink = ({ item, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.quickCard, { backgroundColor: item.bg, transform: [{ scale }] }]}>
      <TouchableOpacity
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <View style={styles.quickIconWrap}>
          <Ionicons name={item.icon} size={26} color={item.color} />
        </View>
        <Text style={styles.quickLabel}>{item.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AnimatedMedicalCard = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={{ marginHorizontal: spacing.md, marginBottom: rv(32), backgroundColor: '#0D9488', borderRadius: radius.xl, padding: rs(20), overflow: 'hidden', shadowColor: '#0D9488', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }}>
      {/* Background decorations */}
      <View style={{ position: 'absolute', top: -rs(30), right: -rs(20), width: rs(120), height: rs(120), borderRadius: rs(60), backgroundColor: 'rgba(255,255,255,0.08)' }} />
      <View style={{ position: 'absolute', bottom: -rs(40), left: -rs(20), width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: 'rgba(255,255,255,0.05)' }} />

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }], width: rs(52), height: rs(52), borderRadius: rs(26), backgroundColor: '#CCFBF1', alignItems: 'center', justifyContent: 'center', marginRight: rs(16), shadowColor: '#34D399', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 8 }}>
          <Ionicons name="pulse" size={28} color="#0D9488" />
        </Animated.View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: rm(17), fontWeight: '800', color: '#F0FDFA', marginBottom: rv(2) }}>DoseBox Care+</Text>
          <Text style={{ fontSize: rm(12), color: '#99F6E4', lineHeight: rv(16) }}>24/7 Expert pharmacists & doctors on standby for your health.</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: rv(20), borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: rv(16) }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Ionicons name="shield-checkmark" size={20} color="#5EEAD4" />
          <Text style={{ fontSize: rm(11), color: '#F0FDFA', marginTop: rv(4), fontWeight: '600' }}>100% Genuine</Text>
        </View>
        <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Ionicons name="thermometer" size={20} color="#5EEAD4" />
          <Text style={{ fontSize: rm(11), color: '#F0FDFA', marginTop: rv(4), fontWeight: '600' }}>Lab Tested</Text>
        </View>
        <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Ionicons name="flash" size={20} color="#5EEAD4" />
          <Text style={{ fontSize: rm(11), color: '#F0FDFA', marginTop: rv(4), fontWeight: '600' }}>Express Rx</Text>
        </View>
      </View>
    </View>
  );
};

export default function HomeScreen({ navigation }) {
  const { totalQty, addToCart } = useCart();
  const { selectedAddress, selectAddress } = useLocation();
  const insets = useSafeAreaInsets();

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // New API states
  const [categories, setCategories] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState([]);
  const [banners, setBanners] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Banner logic
  const bannerListRef = useRef(null);
  const currentBannerIndexRef = useRef(0);

  // Category scroll logic
  const catListRef = useRef(null);
  const [catIndex, setCatIndex] = useState(0);

  const scrollCategories = (direction) => {
    if (!catListRef.current || !categories || categories.length === 0) return;
    const step = CAT_VISIBLE_COUNT;
    let nextIdx = direction === 'left' ? catIndex - step : catIndex + step;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= categories.length) nextIdx = Math.max(0, categories.length - CAT_VISIBLE_COUNT);
    setCatIndex(nextIdx);
    catListRef.current.scrollToOffset({
      offset: nextIdx * (CAT_CARD_WIDTH + CAT_CARD_GAP),
      animated: true,
    });
  };

  // Trending scroll logic
  const trendingListRef = useRef(null);
  const [trendingIndex, setTrendingIndex] = useState(0);

  const scrollTrending = (direction) => {
    if (!trendingListRef.current || !trending || trending.length === 0) return;
    const step = MED_VISIBLE_COUNT;
    let nextIdx = direction === 'left' ? trendingIndex - step : trendingIndex + step;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= trending.length) nextIdx = Math.max(0, trending.length - MED_VISIBLE_COUNT);
    setTrendingIndex(nextIdx);
    trendingListRef.current.scrollToOffset({
      offset: nextIdx * (MED_CARD_WIDTH + MED_CARD_GAP),
      animated: true,
    });
  };

  // Recommendations scroll logic
  const recListRef = useRef(null);
  const [recIndex, setRecIndex] = useState(0);

  const scrollRecs = (direction) => {
    if (!recListRef.current || !recommendations || recommendations.length === 0) return;
    const step = MED_VISIBLE_COUNT;
    let nextIdx = direction === 'left' ? recIndex - step : recIndex + step;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= recommendations.length) nextIdx = Math.max(0, recommendations.length - MED_VISIBLE_COUNT);
    setRecIndex(nextIdx);
    recListRef.current.scrollToOffset({
      offset: nextIdx * (MED_CARD_WIDTH + MED_CARD_GAP),
      animated: true,
    });
  };

  const [fetchingLocation, setFetchingLocation] = useState(false);
  const { width: windowWidth } = Dimensions.get('window');
  const bannerWidth = windowWidth - spacing.md * 2;
  const bannerHeight = bannerWidth * 0.45;

  const quickLinks = [
    { id: 1, label: 'Medicines', icon: 'medical-outline', color: '#0F766E', bg: '#EEF8F6', route: 'ExploreTab' },
    // { id: 2, label: 'Consult', icon: 'chatbubbles-outline', color: '#B45309', bg: '#FFF7E6', route: 'UserConsultations' },  // CONSULT FEATURE DISABLED
    { id: 3, label: 'Prescription', icon: 'document-text-outline', color: '#4338CA', bg: '#F0EEFF', route: 'UploadPrescription' },
    { id: 4, label: 'My Orders', icon: 'cube-outline', color: '#BE123C', bg: '#FFF0F0', route: 'Proceed' },
  ];
  const fetchAndSetCurrentAddress = async () => {
    setFetchingLocation(true);
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: {
              'User-Agent': 'DoseboxApp/1.0',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const newAddress = {
              id: 'current_loc',
              title: 'Current Location',
              street: addr.road || addr.suburb || addr.neighbourhood || '',
              city: addr.city || addr.town || addr.village || addr.county || '',
              state: addr.state || '',
              zipCode: addr.postcode || '',
              country: addr.country || 'India'
            };
            selectAddress(newAddress);
            setShowLocationModal(false);
            AlertService.show({ type: 'success', title: 'Location Updated', message: 'Delivery location set to your current position.' });
          }
        } catch (err) {
          console.error('Geocoding error:', err);
          AlertService.show({ type: 'error', title: 'Error', message: 'Failed to reverse geocode location.' });
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === 2) {
          AlertService.show({ type: 'error', title: 'GPS Disabled', message: 'Please turn on Location (GPS) in your phone settings.' });
        } else {
          AlertService.show({ type: 'error', title: 'Error', message: 'Failed to get current position. Make sure GPS is enabled.' });
        }
        setFetchingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    fetchHomeData();
    const checkLocationPermission = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          const requested = await AsyncStorage.getItem('locationRequestedAfterLogin');
          if (!requested) {
            const hasPermission = await PermissionsService.requestLocationPermission();
            await AsyncStorage.setItem('locationRequestedAfterLogin', 'true');
            if (hasPermission) {
              fetchAndSetCurrentAddress();
            }
          }
        } else {
          await AsyncStorage.removeItem('locationRequestedAfterLogin');
        }
      } catch (err) {
        console.log('Error checking location permission:', err);
      }
    };
    checkLocationPermission();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        let nextIndex = currentBannerIndexRef.current + 1;
        if (nextIndex >= banners.length) nextIndex = 0;

        bannerListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        currentBannerIndexRef.current = nextIndex;
        setActiveBannerIndex(nextIndex);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHomeData();
    setRefreshing(false);
  };

  const fetchHomeData = async () => {
    setLoadingData(true);
    try {
      const [catRes, recRes, trendRes, bannersRes, blogsRes] = await Promise.all([
        api.get('/medicines/categories').catch(() => ({ data: { success: false } })),
        api.get('/medicines/recommendations').catch(() => ({ data: { success: false } })),
        api.get('/medicines?limit=12').catch(() => ({ data: { success: false } })),
        api.get('/banners').catch(() => ({ data: { success: false } })),
        api.get('/blogs').catch(() => ({ data: { success: false } }))
      ]);

      if (catRes.data?.success) setCategories(catRes.data.data);
      if (recRes.data?.success) setRecommendations(recRes.data.data);
      if (trendRes.data?.success) setTrending(trendRes.data.data);
      if (bannersRes.data?.success) setBanners(bannersRes.data.data);
      if (blogsRes.data?.success) setBlogs(blogsRes.data.data);
    } catch (e) {
      console.warn('Failed to load home data', e);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await api.get('/account/addresses');
      if (res.data?.success) setAddresses(res.data.data);
    } catch (e) {
      if (e.response?.status !== 401) {
        console.error('Failed to fetch addresses:', e);
      }
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleOpenLocation = () => {
    fetchAddresses();
    setShowLocationModal(true);
  };

  const handleFetchCurrentLocation = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      setShowLocationModal(false);
      AlertService.show({ type: 'error', title: 'Login Required', message: 'Please login to use your current location.' });
      navigation.navigate('Login');
      return;
    }

    const hasPermission = await PermissionsService.requestLocationPermission();
    if (!hasPermission) return;

    fetchAndSetCurrentAddress();
  };

  const navigateWithAuth = async (route, label = 'proceed') => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      navigation.navigate(route);
    } else {
      AlertService.show({
        type: 'error',
        title: 'Login Required',
        message: `Please login to ${label}.`,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Login',
            onPress: () => navigation.navigate('Login')
          }
        ]
      });
    }
  };

  const renderMedicineCard = ({ item: med }) => {
    return (
      <MedicineCard
        med={med}
        containerStyle={{ width: MED_CARD_WIDTH }}
      />
    );
  };

  const CategoryCardItem = ({ cat, onPress }) => {
    const [hasError, setHasError] = useState(false);
    const photoUrl = getCategoryPhotoUrl(cat);

    return (
      <TouchableOpacity
        style={styles.catCard}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <View style={styles.catImageWrap}>
          {!hasError && photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.catImage}
              resizeMode="contain"
              onError={() => setHasError(true)}
            />
          ) : (
            <Ionicons name="medical-outline" size={rs(32)} color={C.primary} />
          )}
        </View>
        <View style={styles.catTextWrap}>
          <Text style={styles.catTitle} numberOfLines={2} ellipsizeMode="tail">
            {cat.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryCard = ({ item: cat }) => {
    return (
      <CategoryCardItem
        cat={cat}
        onPress={() =>
          navigation.navigate('SearchScreen', {
            query: cat.name,
            categorySlug: cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-'),
          })
        }
      />
    );
  };

  const renderBlogCard = ({ item: post }) => {
    // Dynamic mapping for missing colors, fallback to defaults
    const bgColors = ['#E0F2FE', '#DCFCE7', '#FEE2E2', '#FEF3C7'];
    const textColors = ['#0284C7', '#16A34A', '#DC2626', '#D97706'];
    const colorIdx = post.id % bgColors.length;

    const bgColor = post.color || bgColors[colorIdx];
    const textColor = post.text || textColors[colorIdx];

    // Format date if it's a real timestamp
    const dateStr = post.createdAt
      ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : post.date;

    const imageUrl = getFullImageUrl(post.coverImage);

    return (
      <TouchableOpacity
        style={styles.blogCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('BlogDetail', { blogId: post.id })}
      >
        <View style={styles.blogImagePlaceholder}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          ) : (
            <Text style={styles.blogImageIcon}>📰</Text>
          )}
        </View>
        <View style={styles.blogCardBody}>
          <View style={[styles.blogBadge, { backgroundColor: bgColor }]}>
            <Text style={[styles.blogBadgeText, { color: textColor }]}>{post.category || 'Health'}</Text>
          </View>
          <Text style={styles.blogTitle} numberOfLines={2}>{post.title}</Text>
          <View style={styles.blogMetaRow}>
            <Text style={styles.blogMeta}>{dateStr}</Text>
            <Text style={styles.blogMetaDot}>•</Text>
            <Text style={styles.blogMeta}>{post.read || '5 min read'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* ── TOP BAR ─────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.locationRow} onPress={handleOpenLocation} activeOpacity={0.7}>
          <View style={styles.locationIconWrap}>
            <Ionicons name="location" size={14} color={C.primary} />
          </View>
          <View style={{ flex: 1, marginRight: rs(4) }}>
            <Text style={styles.locationLabel}>Delivering to</Text>
            <Text style={styles.locationValue} numberOfLines={1}>
              {selectedAddress
                ? (selectedAddress.id === 'current_loc' && selectedAddress.street
                  ? `${selectedAddress.street}, ${selectedAddress.city}`
                  : `${selectedAddress.title}, ${selectedAddress.city}`)
                : 'Select Location'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={C.sub} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('CartCheckout')} activeOpacity={0.75}>
          <Ionicons name="cart" size={22} color={C.primary} />
          {totalQty > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalQty > 9 ? '9+' : totalQty}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── SEARCH BAR ──────────────────────────────────── */}
      <TouchableOpacity style={styles.searchWrap} activeOpacity={0.8} onPress={() => navigation.navigate('SearchScreen')}>
        <Ionicons name="search" size={18} color={C.sub} style={{ marginRight: rs(10) }} />
        <Text style={styles.searchText}>Search medicines, symptoms...</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + rv(100) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
      >

        {/* ── BANNERS ── */}
        {banners.length > 0 && (
          <View style={{ marginBottom: rv(16), marginHorizontal: spacing.md, overflow: 'hidden' }}>
            <FlatList
              ref={bannerListRef}
              data={banners}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / bannerWidth);
                currentBannerIndexRef.current = newIndex;
                setActiveBannerIndex(newIndex);
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    if (!item.link) return;

                    if (item.link.startsWith('/medicines/detail')) {
                      const match = item.link.match(/id=(\d+)/);
                      if (match) {
                        navigation.navigate('MedicineDetail', { medicine: { id: parseInt(match[1]) } });
                      }
                    } else if (item.link.startsWith('/categories')) {
                      navigation.navigate('Categories');
                    } else if (item.link.startsWith('/blogs')) {
                      navigation.navigate('Blog');
                    } else {
                      // Fallback for simple routes like 'UploadPrescription' or '/UploadPrescription'
                      const routeName = item.link.replace(/^\//, '');
                      navigation.navigate(routeName);
                    }
                  }}
                >
                  <Image
                    source={{ uri: getFullImageUrl(item.image) }}
                    style={{ width: bannerWidth, height: bannerHeight, backgroundColor: C.border }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            />
            {banners.length > 1 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: rv(8), left: 0, right: 0 }}>
                {banners.map((_, idx) => (
                  <View
                    key={idx}
                    style={{
                      width: activeBannerIndex === idx ? rs(16) : rs(6),
                      height: rs(6),
                      borderRadius: rs(3),
                      backgroundColor: activeBannerIndex === idx ? C.primary : 'rgba(255,255,255,0.5)',
                      marginHorizontal: rs(3),
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Quick Links */}
        <View style={styles.quickGrid}>
          {quickLinks.map((item) => (
            <AnimatedQuickLink
              key={item.id}
              item={item}
              onPress={() => {
                const protectedRoutes = ['UploadPrescription', 'UserConsultations', 'Proceed'];
                if (protectedRoutes.includes(item.route)) {
                  navigateWithAuth(item.route, `access ${item.label.toLowerCase()}`);
                } else {
                  navigation.navigate(item.route);
                }
              }}
            />
          ))}
        </View>
        {/* ── WHATSAPP BOT ACTION ── */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: rv(12), padding: rs(16), backgroundColor: '#F0FDF4', borderRadius: radius.xl, borderWidth: 1, borderColor: '#dcfce7', shadowColor: '#25D366', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
          onPress={() => Linking.openURL('https://wa.me/919876543210?text=Hello%20DoseBox%2C%20I%20would%20like%20to%20order%20some%20medicines.')}
          activeOpacity={0.8}
        >
          <View style={{ width: rs(44), height: rs(44), borderRadius: rs(22), backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', marginRight: rs(14) }}>
            <Ionicons name="logo-whatsapp" size={24} color={C.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: rm(15), fontWeight: '700', color: '#166534', marginBottom: rv(2) }}>Order via WhatsApp</Text>
            <Text style={{ fontSize: rm(12), color: '#15803d' }}>Send a voice note or message</Text>
          </View>
          <View style={{ width: rs(32), height: rs(32), borderRadius: rs(16), backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-forward" size={18} color="#166534" />
          </View>
        </TouchableOpacity>

        {/* ── UPLOAD PRESCRIPTION ACTION ── */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: rv(24), padding: rs(16), backgroundColor: '#F8FAFC', borderRadius: radius.xl, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
          onPress={() => navigateWithAuth('UploadPrescription', 'order with prescription')}
          activeOpacity={0.8}
        >
          <View style={{ width: rs(44), height: rs(44), borderRadius: rs(22), backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', marginRight: rs(14) }}>
            <Ionicons name="document-text" size={20} color={C.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: rm(15), fontWeight: '700', color: '#0f172a', marginBottom: rv(2) }}>Order with Prescription</Text>
            <Text style={{ fontSize: rm(12), color: '#475569' }}>Upload it and we'll handle the rest</Text>
          </View>
          <View style={{ width: rs(32), height: rs(32), borderRadius: rs(16), backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-forward" size={18} color="#0f172a" />
          </View>
        </TouchableOpacity>

        {loadingData ? (
          <ActivityIndicator size="large" color={C.primary} style={{ marginTop: rv(40) }} />
        ) : (
          <>
            {/* ── TARGET SPECIFIC AILMENTS (Categories) ── */}
            {categories.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <View style={{ flex: 1, marginRight: rs(10) }}>
                    <Text style={styles.sectionOverline}>TARGET SPECIFIC AILMENTS</Text>
                    <Text style={styles.sectionTitle} numberOfLines={1}>Shop by Chronic Category</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.catViewAllBtn}
                    onPress={() => navigation.navigate('Categories')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.catViewAllText}>View all</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  ref={catListRef}
                  data={categories}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => (item.id || item.slug || item.name).toString()}
                  renderItem={renderCategoryCard}
                  contentContainerStyle={styles.horizontalList}
                  ItemSeparatorComponent={() => <View style={{ width: CAT_CARD_GAP }} />}
                  snapToInterval={CAT_CARD_WIDTH + CAT_CARD_GAP}
                  decelerationRate="fast"
                  snapToAlignment="start"
                />
              </View>
            )}

            {/* ── RECOMMENDED FOR YOU ── */}
            {recommendations.length > 0 && (
              <View style={styles.sectionBlockAlt}>
                <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <View style={{ flex: 1, marginRight: rs(10) }}>
                    <View style={styles.sparkleRow}>
                      <Ionicons name="sparkles" size={12} color={C.primary} />
                      <Text style={styles.sectionOverline}>FOR YOU</Text>
                    </View>
                    <Text style={styles.sectionTitle} numberOfLines={1}>Recommended for You</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.catViewAllBtn}
                    onPress={() => navigation.navigate('SearchScreen', { showAll: true })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.catViewAllText}>View all</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  ref={recListRef}
                  data={recommendations}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderMedicineCard}
                  contentContainerStyle={styles.horizontalList}
                  ItemSeparatorComponent={() => <View style={{ width: MED_CARD_GAP }} />}
                  snapToInterval={MED_CARD_WIDTH + MED_CARD_GAP}
                  decelerationRate="fast"
                  snapToAlignment="start"
                />
              </View>
            )}

            {/* ── DIGITAL SPECIALTY SHELF (Trending) ── */}
            {trending.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <View style={{ flex: 1, marginRight: rs(10) }}>
                    <Text style={styles.sectionOverline}>DIGITAL SPECIALTY SHELF</Text>
                    <Text style={styles.sectionTitle} numberOfLines={1}>DoseBox Smart Savings</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.catViewAllBtn}
                    onPress={() => navigation.navigate('SearchScreen', { showAll: true })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.catViewAllText}>View all</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  ref={trendingListRef}
                  data={trending}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderMedicineCard}
                  contentContainerStyle={styles.horizontalList}
                  ItemSeparatorComponent={() => <View style={{ width: MED_CARD_GAP }} />}
                  snapToInterval={MED_CARD_WIDTH + MED_CARD_GAP}
                  decelerationRate="fast"
                  snapToAlignment="start"
                />
              </View>
            )}

            {/* ── FROM THE BLOG ── */}
            {blogs.length > 0 && (
              <View style={styles.sectionBlockAlt}>
                <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }]}>
                  <View>
                    <Text style={styles.sectionOverline}>HEALTH INSIGHTS</Text>
                    <Text style={styles.sectionTitle}>From the Blog</Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('Blog')}>
                    <Text style={styles.seeAll}>View all</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={blogs}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderBlogCard}
                  contentContainerStyle={styles.horizontalList}
                  ItemSeparatorComponent={() => <View style={{ width: rs(16) }} />}
                />
              </View>
            )}
          </>
        )}

            {/* ── OUR STATS ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing.md, marginTop: rv(24), marginBottom: rv(24), backgroundColor: C.white, borderRadius: radius.xl, borderWidth: 1, borderColor: '#F1F5F9', paddingVertical: rv(20), paddingHorizontal: rs(12), shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: rm(22), fontWeight: '800', color: C.primary, marginBottom: rv(4) }}>50k+</Text>
                <Text style={{ fontSize: rm(11), fontWeight: '600', color: '#64748B' }}>Happy Users</Text>
              </View>
              <View style={{ width: 1, height: rv(32), backgroundColor: '#F1F5F9' }} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: rm(22), fontWeight: '800', color: C.primary, marginBottom: rv(4) }}>10k+</Text>
                <Text style={{ fontSize: rm(11), fontWeight: '600', color: '#64748B' }}>Medicines</Text>
              </View>
              <View style={{ width: 1, height: rv(32), backgroundColor: '#F1F5F9' }} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: rm(22), fontWeight: '800', color: C.primary, marginBottom: rv(4) }}>4.8<Text style={{ fontSize: rm(16) }}>★</Text></Text>
                <Text style={{ fontSize: rm(11), fontWeight: '600', color: '#64748B' }}>App Rating</Text>
              </View>
            </View>


            {/* ── FEATURES SECTION (ANIMATED) ── */}
            <AnimatedMedicalCard />

            {/* ── 24/7 SUPPORT ── */}
            <View style={{ marginHorizontal: spacing.md, marginBottom: rv(40), backgroundColor: '#EEF2FF', borderRadius: radius.xl, padding: rs(20), borderWidth: 1, borderColor: '#E0E7FF', alignItems: 'center' }}>
              <View style={{ width: rs(56), height: rs(56), borderRadius: rs(28), backgroundColor: '#C7D2FE', alignItems: 'center', justifyContent: 'center', marginBottom: rv(12) }}>
                <Ionicons name="chatbubbles" size={28} color="#4F46E5" />
              </View>
              <Text style={{ fontSize: rm(18), fontWeight: '800', color: '#312E81', marginBottom: rv(4), textAlign: 'center' }}>24/7 Support</Text>
              <Text style={{ fontSize: rm(13), color: '#4F46E5', textAlign: 'center', marginBottom: rv(16), paddingHorizontal: rs(10), lineHeight: rv(18) }}>
                We're here to help you. If you have any issue related to your order or anything else, message us.
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: '#4F46E5', paddingVertical: rv(12), paddingHorizontal: rs(24), borderRadius: radius.full, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Contact')}
              >
                <Text style={{ color: C.white, fontSize: rm(14), fontWeight: '700' }}>Submit a Request</Text>
              </TouchableOpacity>
            </View>


          </ScrollView>

        {/* ── LOCATION MODAL ──────────────────────────────── */}
        <Modal visible={showLocationModal} animationType="slide" transparent onRequestClose={() => setShowLocationModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Delivery Location</Text>
                <TouchableOpacity onPress={() => setShowLocationModal(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={C.sub} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.locationFetchBtn}
                onPress={handleFetchCurrentLocation}
                disabled={fetchingLocation}
                activeOpacity={0.7}
              >
                {fetchingLocation ? (
                  <ActivityIndicator color={C.primary} size="small" />
                ) : (
                  <>
                    <Ionicons name="locate" size={18} color={C.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.locationFetchText}>Use Current Location</Text>
                  </>
                )}
              </TouchableOpacity>

              {loadingAddresses ? (
                <ActivityIndicator size="large" color={C.primary} style={{ marginVertical: rv(32) }} />
              ) : addresses.length === 0 ? (
                <Text style={styles.emptyModal}>No saved addresses found.</Text>
              ) : (
                <FlatList
                  data={addresses}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.addressCard} onPress={() => { selectAddress(item); setShowLocationModal(false); }} activeOpacity={0.75}>
                      <View style={styles.addressIcon}>
                        <Ionicons name="location" size={16} color={C.primary} />
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
  root: { flex: 1, backgroundColor: C.white },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: rv(14), backgroundColor: C.white },
  locationRow: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: rs(12) },
  locationIconWrap: { width: rs(28), height: rs(28), borderRadius: rs(8), backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: rs(8) },
  locationLabel: { fontSize: rm(11), color: C.sub, fontWeight: '500' },
  locationValue: { fontSize: rm(14), fontWeight: '700', color: C.text },
  cartBtn: { width: rs(44), height: rs(44), borderRadius: rs(12), backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: rs(4), right: rs(4), width: rs(16), height: rs(16), borderRadius: rs(8), backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.white },
  badgeText: { fontSize: rm(9), fontWeight: '800', color: C.white },

  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: rv(16), backgroundColor: C.bg, borderRadius: radius.lg, paddingHorizontal: rs(16), height: rv(48), borderWidth: 1, borderColor: C.border },
  searchText: { flex: 1, fontSize: rm(14), color: C.sub },
  scroll: { flex: 1, backgroundColor: C.white },
  content: { paddingTop: rv(4) },

  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rv(24), gap: rs(10), paddingHorizontal: spacing.md },
  quickCard: { flex: 1, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', paddingVertical: rv(14), elevation: 0 },
  quickIconWrap: { marginBottom: rv(6), alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: rm(12), fontWeight: '600', color: C.text, letterSpacing: -0.2 },

  /* Stats Section */
  statsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.white, marginHorizontal: spacing.md, marginTop: rv(8), marginBottom: rv(12), paddingVertical: rv(16), paddingHorizontal: spacing.lg, borderRadius: radius.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: C.border },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: rm(18), fontWeight: '800', color: C.primary, marginBottom: rv(4) },
  statLabel: { fontSize: rm(10), fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: rv(30), backgroundColor: C.border },

  /* Sections */
  sectionBlock: { paddingTop: rv(24), paddingBottom: rv(16), backgroundColor: C.white },
  sectionBlockAlt: { paddingTop: rv(24), paddingBottom: rv(24), backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  sectionHeader: { paddingHorizontal: spacing.md, marginBottom: rv(16) },
  sectionOverline: { fontSize: rm(10.5), fontWeight: '800', color: C.primary, textTransform: 'uppercase', letterSpacing: 1.2 },
  sparkleRow: { flexDirection: 'row', alignItems: 'center', gap: rs(4), backgroundColor: '#E6FFFA', alignSelf: 'flex-start', paddingHorizontal: rs(8), paddingVertical: rv(2), borderRadius: radius.full, marginBottom: rv(4) },
  sectionTitle: { fontSize: rm(19), fontWeight: '800', color: '#0F172A', marginTop: rv(4), flexShrink: 1 },
  horizontalList: { paddingHorizontal: spacing.md, paddingBottom: rv(8) },
  seeAll: { fontSize: rm(13), color: C.primary, fontWeight: '700', marginBottom: rv(4), marginLeft: rs(8) },

  /* Category Card matching website */
  catControlsRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  catNavBtn: { width: rs(30), height: rs(30), borderRadius: rs(15), backgroundColor: C.white, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  catViewAllBtn: { paddingHorizontal: rs(12), paddingVertical: rv(6), borderRadius: radius.full, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  catViewAllText: { fontSize: rm(12.5), fontWeight: '700', color: '#0F172A' },

  catCard: {
    width: CAT_CARD_WIDTH,
    height: Math.round(CAT_CARD_WIDTH * 1.18),
    borderRadius: radius.xl,
    backgroundColor: C.white,
    padding: rs(8),
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  catImageWrap: {
    width: '100%',
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: rs(6),
    overflow: 'hidden',
  },
  catImage: {
    width: '100%',
    height: '100%',
  },
  catTextWrap: {
    width: '100%',
    paddingTop: rv(6),
    paddingBottom: rv(2),
    paddingHorizontal: rs(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTitle: {
    fontSize: rm(12.5),
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: rv(17),
  },

  /* Prescription Banner */
  prescriptionBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0D1B2A', borderRadius: radius.xl, padding: rs(16), marginHorizontal: spacing.md, marginVertical: rv(24) },
  prescriptionTitle: { fontSize: rm(14), fontWeight: '700', color: C.white, marginBottom: rv(4) },
  prescriptionSub: { fontSize: rm(11), color: 'rgba(255,255,255,0.55)', flexShrink: 1 },
  prescriptionArrow: { flexDirection: 'row', borderRadius: rs(20), backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(12), paddingVertical: rv(8), marginLeft: rs(8) },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.md, paddingBottom: rv(40), maxHeight: '78%' },
  modalHandle: { width: rs(40), height: rv(4), borderRadius: rv(2), backgroundColor: C.border, alignSelf: 'center', marginTop: rv(12), marginBottom: rv(16) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(16) },
  modalTitle: { fontSize: rm(18), fontWeight: '700', color: C.text },
  closeBtn: { padding: rs(8), borderRadius: rs(8), backgroundColor: C.bg },
  emptyModal: { textAlign: 'center', color: C.sub, fontSize: rm(15), marginVertical: rv(32) },
  addressCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: C.bg, borderRadius: radius.md, marginBottom: rv(10), borderWidth: 1, borderColor: C.border },
  addressIcon: { width: rs(36), height: rs(36), borderRadius: rs(10), backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: rs(12) },
  addressTitle: { fontSize: rm(15), fontWeight: '600', color: C.text, marginBottom: rv(2) },
  addressSub: { fontSize: rm(12), color: C.sub },

  /* Features Section */
  featuresSection: { backgroundColor: '#EEF2FE', marginHorizontal: spacing.md, marginVertical: rv(24), paddingVertical: rv(24), paddingHorizontal: spacing.md, borderRadius: radius.xl, alignItems: 'center' },
  featureItem: { alignItems: 'center', marginBottom: rv(32) },
  featureIcon: { marginBottom: rv(12) },
  featureTitle: { fontSize: rm(16), fontWeight: '600', color: C.text, marginBottom: rv(6) },
  featureDesc: { fontSize: rm(13), color: C.sub, textAlign: 'center', lineHeight: rv(18), paddingHorizontal: spacing.lg },

  /* Blog Card */
  blogCard: { width: rs(260), backgroundColor: C.white, borderRadius: radius.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  blogImagePlaceholder: { height: rv(120), backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  blogImageIcon: { fontSize: rm(32) },
  blogCardBody: { padding: spacing.md },
  blogBadge: { alignSelf: 'flex-start', paddingHorizontal: rv(8), paddingVertical: rv(2), borderRadius: radius.sm, marginBottom: rv(8) },
  blogBadgeText: { fontSize: rm(10), fontWeight: '700', textTransform: 'uppercase' },
  blogTitle: { fontSize: rm(15), fontWeight: '700', color: C.text, marginBottom: rv(8), lineHeight: Math.max(20, rv(20)), minHeight: rv(40) },
  blogMetaRow: { flexDirection: 'row', alignItems: 'center' },
  blogMeta: { fontSize: rm(11), color: C.sub, fontWeight: '500' },
  blogMetaDot: { fontSize: rm(11), color: '#CBD5E1', marginHorizontal: rv(6) },
  locationFetchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6FFFA', paddingVertical: rv(12), borderRadius: radius.md, marginBottom: rv(16), borderWidth: 1, borderColor: '#B2EBE3' },
  locationFetchText: { color: C.primary, fontSize: rm(14), fontWeight: '600' }
});
