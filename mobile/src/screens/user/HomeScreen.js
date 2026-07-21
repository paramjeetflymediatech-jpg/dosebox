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
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const { width: windowWidth } = Dimensions.get('window');
  const bannerWidth = windowWidth - spacing.md * 2;
  const bannerHeight = bannerWidth * 0.45;

  const quickLinks = [
    { id: 1, label: 'Medicines', icon: 'medical-outline', color: '#0F766E', bg: '#EEF8F6', route: 'ExploreTab' },
    { id: 2, label: 'Consult', icon: 'chatbubbles-outline', color: '#B45309', bg: '#FFF7E6', route: 'UserConsultations' },
    { id: 3, label: 'Prescription', icon: 'document-text-outline', color: '#4338CA', bg: '#F0EEFF', route: 'UploadPrescription' },
    { id: 4, label: 'My Orders', icon: 'cube-outline', color: '#BE123C', bg: '#FFF0F0', route: 'Proceed' },
  ];

  useEffect(() => {
    fetchHomeData();
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
        api.get('/medicines?limit=5').catch(() => ({ data: { success: false } })),
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

  const renderMedicineCard = ({ item: med }) => {
    return <MedicineCard med={med} containerStyle={{ marginRight: rs(12) }} />;
  };

  const renderCategoryCard = ({ item: cat, index }) => {
    const icon = cat.icon || cat.name?.charAt(0).toUpperCase() || '✨';
    const imageUrl = getFullImageUrl(cat.image);

    return (
      <TouchableOpacity
        style={styles.catCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SearchScreen', { query: cat.name, categorySlug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-') })}
      >
        {imageUrl ? (
          <View style={[styles.catIconWrap, { backgroundColor: '#F8FAFC', padding: 4 }]}>
            <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
          </View>
        ) : (
          <View style={[styles.catIconWrap, { backgroundColor: CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length][0] }]}>
            <Text style={{ fontSize: 24, color: '#fff', fontWeight: 'bold' }}>{icon}</Text>
          </View>
        )}
        <View style={styles.catTextWrap}>
          <Text style={styles.catTitle} numberOfLines={1}>{cat.name}</Text>
          <Text style={styles.catDesc} numberOfLines={2}>{cat.description || 'View products in this category'}</Text>
        </View>
      </TouchableOpacity>
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
                    if (item.link) {
                      navigation.navigate(item.link);
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
              onPress={() => navigation.navigate(item.route)}
            />
          ))}
        </View>


        {loadingData ? (
          <ActivityIndicator size="large" color={C.primary} style={{ marginTop: rv(40) }} />
        ) : (
          <>
            {/* ── TARGET SPECIFIC AILMENTS (Categories) ── */}
            {categories.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }]}>
                  <View>
                    <Text style={styles.sectionOverline}>TARGET SPECIFIC AILMENTS</Text>
                    <Text style={styles.sectionTitle}>Shop by Chronic Category</Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
                    <Text style={styles.seeAll}>View all</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={categories}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderCategoryCard}
                  contentContainerStyle={styles.horizontalList}
                  ItemSeparatorComponent={() => <View style={{ width: rs(12) }} />}
                />
              </View>
            )}

            {/* ── RECOMMENDED FOR YOU ── */}
            {recommendations.length > 0 && (
              <View style={styles.sectionBlockAlt}>
                <View style={styles.sectionHeader}>
                  <View>
                    <View style={styles.sparkleRow}>
                      <Ionicons name="sparkles" size={12} color={C.primary} />
                      <Text style={styles.sectionOverline}>FOR YOU</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Recommended for You</Text>
                  </View>
                </View>
                <FlatList
                  data={recommendations}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderMedicineCard}
                  contentContainerStyle={styles.horizontalList}
                  ItemSeparatorComponent={() => <View style={{ width: rs(12) }} />}
                />
              </View>
            )}

            {/* ── DIGITAL SPECIALTY SHELF (Trending) ── */}
            {trending.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }]}>
                  <View>
                    <Text style={styles.sectionOverline}>DIGITAL SPECIALTY SHELF</Text>
                    <Text style={styles.sectionTitle}>Substitute & Save Instantly</Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('SearchScreen', { showAll: true })} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={{ color: C.primary, fontWeight: '700', fontSize: rm(13) }}>View All</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={trending}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderMedicineCard}
                  contentContainerStyle={styles.horizontalList}
                  ItemSeparatorComponent={() => <View style={{ width: rs(12) }} />}
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

        {/* ── UPLOAD PRESCRIPTION CTA (Proceed) ── */}
        <TouchableOpacity
          style={styles.prescriptionBanner}
          onPress={() => navigation.navigate('UploadPrescription')}
          activeOpacity={0.85}
        >
          <View>
            <Text style={styles.prescriptionTitle}>Order with Prescription</Text>
            <Text style={styles.prescriptionSub}>Upload it and we'll handle the rest</Text>
          </View>
          <View style={styles.prescriptionArrow}>
            <Text style={{ color: C.white, fontWeight: '700', fontSize: rm(12), marginRight: rs(4) }}>Proceed</Text>
            <Ionicons name="arrow-forward" size={16} color={C.white} />
          </View>
        </TouchableOpacity>

        {/* ── OUR STATS ── */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>50k+</Text>
            <Text style={styles.statLabel}>Happy Users</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>10k+</Text>
            <Text style={styles.statLabel}>Medicines</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>4.8★</Text>
            <Text style={styles.statLabel}>App Rating</Text>
          </View>
        </View>


        {/* ── FEATURES SECTION ── */}
        <View style={styles.featuresSection}>
          <View style={[styles.featureItem, { marginTop: rv(12) }]}>
            <Ionicons name="ribbon-outline" size={rm(32)} color={C.text} style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Clinically Tested</Text>
            <Text style={styles.featureDesc}>All products are vetted by our expert team.</Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="bus-outline" size={rm(32)} color={C.text} style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Reliable Delivery</Text>
            <Text style={styles.featureDesc}>Swift and secure handling to your doorstep.</Text>
          </View>

          <View style={[styles.featureItem, { marginBottom: rv(12) }]}>
            <Ionicons name="headset-outline" size={rm(32)} color={C.text} style={styles.featureIcon} />
            <Text style={styles.featureTitle}>Expert Support</Text>
            <Text style={styles.featureDesc}>24/7 care for all your health inquiries.</Text>
          </View>
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
  sectionOverline: { fontSize: rm(9), fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 1 },
  sparkleRow: { flexDirection: 'row', alignItems: 'center', gap: rs(4), backgroundColor: '#E6FFFA', alignSelf: 'flex-start', paddingHorizontal: rs(8), paddingVertical: rv(2), borderRadius: radius.full, marginBottom: rv(4) },
  sectionTitle: { fontSize: rm(18), fontWeight: '800', color: C.text, marginTop: rv(4), flexShrink: 1 },
  horizontalList: { paddingHorizontal: spacing.md },
  seeAll: { fontSize: rm(13), color: C.primary, fontWeight: '600', marginBottom: rv(4), marginLeft: rs(8) },

  /* Category Card */
  catCard: { width: rs(150), backgroundColor: C.white, borderRadius: radius.lg, borderWidth: 1, borderColor: '#b2d8dc', padding: rs(16), elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  catImageWrap: { width: rs(48), height: rs(48), borderRadius: radius.md, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: rv(12) },
  catIconWrap: { width: rs(48), height: rs(48), borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: rv(12) },
  catImage: { width: '60%', height: '60%' },
  catTextWrap: { flex: 1 },
  catTitle: { fontSize: rm(13), fontWeight: '700', color: C.text, marginBottom: rv(4) },
  catDesc: { fontSize: rm(11), color: C.sub, lineHeight: rv(16) },

  /* Medicine Card */
  medCardContainer: { width: rs(200), backgroundColor: C.white, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(27,141,145,0.4)', padding: rs(12), elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  medCardHeader: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 10, position: 'absolute', top: rv(12), left: rs(12), right: rs(12) },
  rxBadge: { backgroundColor: '#f0ecec', borderWidth: 1, borderColor: '#e6dfdf', paddingHorizontal: rs(6), paddingVertical: rv(2), borderRadius: 4 },
  rxBadgeText: { fontSize: rm(8), fontWeight: '800', color: '#786c6c' },
  saveBadge: { backgroundColor: C.accent, paddingHorizontal: rs(8), paddingVertical: rv(2), borderRadius: radius.full },
  saveBadgeText: { fontSize: rm(9), fontWeight: '800', color: C.white },
  medImageWrap: { height: rv(120), alignItems: 'center', justifyContent: 'center', marginTop: rv(24), marginBottom: rv(8) },
  medImage: { width: '80%', height: '80%' },
  medDetails: { marginBottom: rv(12) },
  medBrandText: { fontSize: rm(9), fontWeight: '700', color: '#8c8c8c', textTransform: 'uppercase', marginBottom: rv(4) },
  medNameText: { fontSize: rm(12), fontWeight: '700', color: C.text, lineHeight: rv(16), height: rv(32) },
  medRatingRow: { flexDirection: 'row', alignItems: 'center', marginTop: rv(4), gap: rs(4) },
  medRatingText: { fontSize: rm(10), fontWeight: '600', color: '#9b9b9b' },
  medFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' },
  medPriceBox: { flex: 1 },
  medOldPrice: { fontSize: rm(10), color: '#9b9b9b', textDecorationLine: 'line-through', fontWeight: '600' },
  medSaveText: { fontSize: rm(9), color: C.accent, fontWeight: '700', marginLeft: rs(4) },
  medNewPrice: { fontSize: rm(16), fontWeight: '800', color: C.primary, marginTop: rv(2) },
  medActions: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  medEyeBtn: { width: rs(28), height: rs(28), borderRadius: rs(14), borderWidth: 1, borderColor: 'rgba(12,136,141,0.3)', alignItems: 'center', justifyContent: 'center' },
  medAddBtn: { width: rs(28), height: rs(28), borderRadius: rs(14), backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },

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
  blogTitle: { fontSize: rm(15), fontWeight: '700', color: C.text, marginBottom: rv(8), lineHeight: rv(20), height: rv(40) },
  blogMetaRow: { flexDirection: 'row', alignItems: 'center' },
  blogMeta: { fontSize: rm(11), color: C.sub, fontWeight: '500' },
  blogMetaDot: { fontSize: rm(11), color: '#CBD5E1', marginHorizontal: rv(6) },
  locationFetchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6FFFA', paddingVertical: rv(12), borderRadius: radius.md, marginBottom: rv(16), borderWidth: 1, borderColor: '#B2EBE3' },
  locationFetchText: { color: C.primary, fontSize: rm(14), fontWeight: '600' }
});
