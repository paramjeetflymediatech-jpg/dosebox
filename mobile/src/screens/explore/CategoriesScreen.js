import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  useWindowDimensions,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { rs, rv, rm, radius } from '../../utils/responsive';
import { getFullImageUrl } from '../../utils/image';

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Allergy Medication', slug: 'allergy-medication', image: '/categories/allergy-medication.jpg' },
  { id: 2, name: 'Alzheimers', slug: 'alzheimers', image: '/categories/alzheimers.jpg' },
  { id: 3, name: 'Anaesthetics', slug: 'anaesthetics', image: '/categories/anaesthetics.jpg' },
  { id: 4, name: 'Anemia', slug: 'anemia', image: '/categories/anemia.jpg' },
  { id: 5, name: 'Anti Cancer', slug: 'anti-cancer', image: '/categories/anti-cancer.jpg' },
  { id: 6, name: 'Antibacterials', slug: 'antibacterials', image: '/categories/antibacterials.jpg' },
  { id: 7, name: 'Anticoagulants', slug: 'anticoagulants', image: '/categories/anticoagulants.jpg' },
];

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

function CategoryGridCard({ cat, cardWidth, cardHeight, onPress }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = getCategoryPhotoUrl(cat);

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth, height: cardHeight }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {/* Top Photographic Cover Image */}
      <View style={styles.imageWrap}>
        {!imgError && photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.fallbackIconWrap}>
            <Ionicons name="medical-outline" size={rs(32)} color="#1F5C52" />
          </View>
        )}
      </View>

      {/* Bottom Category Info */}
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {cat.name}
        </Text>
        <View style={styles.exploreRow}>
          <Text style={styles.exploreText}>View Products</Text>
          <Ionicons name="arrow-forward" size={rs(11)} color="#1F5C52" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CategoriesScreen({ navigation }) {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const numColumns = windowWidth >= 768 ? 3 : 2;
  const H_PADDING = rs(14);
  const GAP = rs(12);
  const cardWidth = Math.floor((windowWidth - (H_PADDING * 2) - (GAP * (numColumns - 1))) / numColumns);
  const cardHeight = Math.round(cardWidth * 1.25);

  const fetchCategories = useCallback(async () => {
    try {
      // 4-second timeout race to prevent infinite hanging
      const fetchPromise = api.get('/categories');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 4000)
      );
      const res = await Promise.race([fetchPromise, timeoutPromise]);

      if (res?.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setCategories(res.data.data);
        AsyncStorage.setItem('@dosebox_cached_categories', JSON.stringify(res.data.data)).catch(() => {});
        return;
      }
    } catch (err) {
      try {
        const res2 = await api.get('/medicines/categories');
        if (res2?.data?.success && Array.isArray(res2.data.data) && res2.data.data.length > 0) {
          setCategories(res2.data.data);
          AsyncStorage.setItem('@dosebox_cached_categories', JSON.stringify(res2.data.data)).catch(() => {});
        }
      } catch (err2) {
        console.error('Failed fallback fetch categories:', err2);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const cached = await AsyncStorage.getItem('@dosebox_cached_categories');
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCategories(parsed);
          }
        }
      } catch (e) {}

      if (isMounted) {
        await fetchCategories();
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [fetchCategories]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(c => (c.name || '').toLowerCase().includes(q));
  }, [categories, searchQuery]);

  const displayData = useMemo(() => {
    if (numColumns === 2 && filteredCategories.length % 2 !== 0) {
      return [...filteredCategories, { id: '__spacer__', isSpacer: true }];
    }
    return filteredCategories;
  }, [filteredCategories, numColumns]);

  const renderItem = ({ item }) => {
    if (item.isSpacer) {
      return <View style={{ width: cardWidth, height: cardHeight }} />;
    }

    return (
      <CategoryGridCard
        cat={item}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
        onPress={() =>
          navigation.navigate('SearchScreen', {
            query: item.name,
            categorySlug: item.slug || item.name?.toLowerCase().replace(/\s+/g, '-'),
          })
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={rs(22)} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>All Categories</Text>
          <Text style={styles.headerSubtitle}>
            {categories.length > 0 ? `${categories.length} specialty categories` : 'Explore chronic care categories'}
          </Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={rs(16)} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories (e.g. Oncology, Kidney)..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={rs(16)} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#1F5C52" />
          <Text style={styles.loadingText}>Loading healthcare categories...</Text>
        </View>
      ) : filteredCategories.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="search-outline" size={rs(48)} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No categories found</Text>
          <Text style={styles.emptySub}>
            Try searching with another keyword or browse all categories.
          </Text>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.resetBtnText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          key={`grid-${numColumns}`}
          data={displayData}
          keyExtractor={(item, index) => String(item.id || item.slug || item.name || index)}
          renderItem={renderItem}
          numColumns={numColumns}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: H_PADDING, paddingBottom: insets.bottom + rv(80) }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1F5C52']} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: rs(16),
    paddingTop: rv(10),
    paddingBottom: rv(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(10),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: rm(18),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: rm(11.5),
    fontWeight: '500',
    color: '#64748B',
    marginTop: rv(1),
  },
  searchBarWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: rs(16),
    paddingBottom: rv(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.lg,
    paddingHorizontal: rs(12),
    height: rv(40),
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: rs(8),
    fontSize: rm(13),
    color: '#0F172A',
    padding: 0,
  },
  listContent: {
    paddingTop: rv(14),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: rs(12),
  },
  card: {
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  imageWrap: {
    width: '100%',
    height: '66%',
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackIconWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF4F2',
  },
  textWrap: {
    width: '100%',
    height: '34%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: rs(8),
    paddingVertical: rv(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: rm(12.5),
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: rv(16),
  },
  exploreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    marginTop: rv(3),
  },
  exploreText: {
    fontSize: rm(10.5),
    fontWeight: '700',
    color: '#1F5C52',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rv(60),
  },
  loadingText: {
    marginTop: rv(12),
    fontSize: rm(13),
    color: '#64748B',
    fontWeight: '500',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rv(60),
    paddingHorizontal: rs(24),
  },
  emptyTitle: {
    fontSize: rm(16),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: rv(12),
    marginBottom: rv(4),
  },
  emptySub: {
    fontSize: rm(12),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: rv(18),
    marginBottom: rv(16),
  },
  resetBtn: {
    backgroundColor: '#1F5C52',
    paddingHorizontal: rs(16),
    paddingVertical: rv(8),
    borderRadius: radius.full,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: rm(12),
    fontWeight: '700',
  },
});