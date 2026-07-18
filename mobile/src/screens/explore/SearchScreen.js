import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Keyboard,
  ActivityIndicator,
  FlatList,
  Animated
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import { useCart } from '../../context/CartContext';
import MedicineCard from '../../components/MedicineCard';
import { MedicineCardSkeleton } from '../../components/Skeleton';
import api from '../../services/api';

const C = {
  primary: '#1F5C52',
  primaryLight: '#EAF4F2',
  bg: '#F7F8FA',
  white: '#FFFFFF',
  text: '#0D1B2A',
  sub: '#64748B',
  border: '#E9EDF2',
  card: '#FFFFFF',
  accent: '#F59E0B'
};

const DISCOVER_TAGS = ['Pain Relief', 'Cold & Cough', 'Vitamins', 'Diabetes', 'First Aid', 'Skin Care'];

const SEARCH_HISTORY_KEY = '@dosebox_search_history';

// ── SKELETON LOADER ──
// We are now importing MedicineCardSkeleton from components/Skeleton.js

export default function SearchScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const { totalQty } = useCart();
  
  const [searchQuery, setSearchQuery] = useState(route.params?.query || '');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const initialCategorySlug = route.params?.categorySlug || null;

  useEffect(() => {
    if (route.params?.query) {
      saveSearchAndNavigate(route.params.query, initialCategorySlug);
    } else if (route.params?.showAll) {
      setSearchQuery('');
      performSearch('', 1, false);
    } else {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
    loadRecentSearches();
    fetchTopSelling();
  }, []);

  // Live search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    if (searchQuery === route.params?.query && searchResults !== null) return;

    const delayDebounceFn = setTimeout(() => {
      performSearch(searchQuery.trim(), 1, false);
    }, 400); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async (query, targetPage = 1, isLoadMore = false) => {
    if (isLoadMore) setIsLoadingMore(true);
    else setIsSearching(true);
    
    try {
      let url = `/medicines?search=${encodeURIComponent(query)}&limit=16&page=${targetPage}`;
      if (!isLoadMore && initialCategorySlug && query === route.params?.query) {
         url = `/medicines?category=${encodeURIComponent(initialCategorySlug)}&limit=16&page=${targetPage}`;
      }
      
      const res = await api.get(url);
      if (res.data?.success) {
        const newData = res.data.data || [];
        if (isLoadMore) {
          setSearchResults(prev => [...(prev || []), ...newData]);
        } else {
          setSearchResults(newData);
        }
        
        const pagination = res.data.pagination;
        if (pagination && targetPage >= pagination.totalPages) {
          setHasMore(false);
        } else if (newData.length < 16) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
        setPage(targetPage);
      }
    } catch (e) {
      console.error('Search error', e);
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore || isSearching) return;
    performSearch(searchQuery.trim(), page + 1, true);
  };

  const fetchTopSelling = async () => {
    try {
      const res = await api.get('/medicines?limit=5');
      if (res.data?.success) setTopSelling(res.data.data || []);
    } catch (e) {}
  };

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (e) {}
  };

  const saveSearchAndNavigate = async (query, categorySlug = null) => {
    if (!query.trim()) return;
    let newRecents = [query.trim(), ...recentSearches.filter(q => q.toLowerCase() !== query.trim().toLowerCase())];
    newRecents = newRecents.slice(0, 10);
    setRecentSearches(newRecents);
    AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newRecents));
    
    setPage(1);
    setHasMore(true);
    performSearch(query, 1, false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClearHistory = () => {
    setRecentSearches([]);
    AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const renderMedicineItem = ({ item }) => (
    <MedicineCard 
      med={item} 
      compact={true} 
      containerStyle={{ flex: 1, margin: rs(6), maxWidth: '48%' }} 
    />
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ── HEADER / SEARCH BAR ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={C.sub} style={{ marginRight: rs(10) }} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search medicines, symptoms..."
            placeholderTextColor={C.sub}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => saveSearchAndNavigate(searchQuery)}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color={C.sub} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.cartBtn} 
          onPress={() => navigation.navigate('CartCheckout')}
          activeOpacity={0.7}
        >
          <Ionicons name="cart" size={24} color={C.text} />
          {totalQty > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalQty > 9 ? '9+' : totalQty}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {searchResults !== null ? (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          {isSearching && page === 1 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: spacing.sm, justifyContent: 'space-between' }}>
              {[1, 2, 3, 4, 5, 6].map(k => <MedicineCardSkeleton key={k} containerStyle={{ width: '48%', marginBottom: rv(16) }} />)}
            </View>
          ) : searchResults.length === 0 ? (
            <Text style={{ fontSize: rm(15), color: C.sub, textAlign: 'center', marginTop: rv(40) }}>
              No medicines found for "{searchQuery}".
            </Text>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={item => item.id.toString()}
              renderItem={renderMedicineItem}
              numColumns={2}
              contentContainerStyle={{ padding: spacing.sm, paddingBottom: insets.bottom + rv(40) }}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <Text style={[styles.sectionTitle, { marginHorizontal: spacing.sm, marginTop: rv(12), marginBottom: rv(8) }]}>
                  {route.params?.showAll && !searchQuery ? 'All Medicines' : 'Search Results'}
                </Text>
              }
              ListFooterComponent={
                isLoadingMore ? (
                  <View style={{ paddingVertical: rv(20), alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={C.primary} />
                  </View>
                ) : null
              }
            />
          )}
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + rv(40) }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* ── RECENT SEARCHES ── */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={handleClearHistory} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.recentWrap}>
                {recentSearches.map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.recentItem} onPress={() => { setSearchQuery(item); saveSearchAndNavigate(item); }}>
                    <Ionicons name="time-outline" size={16} color={C.sub} style={{ marginRight: rs(12) }} />
                    <Text style={styles.recentText}>{item}</Text>
                    <Ionicons name="arrow-forward" size={14} color={C.border} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── DISCOVER MORE ── */}
          <View style={[styles.section, { paddingTop: recentSearches.length ? 0 : rv(16) }]}>
            <Text style={styles.sectionTitle}>Discover More</Text>
            <View style={styles.tagWrap}>
              {DISCOVER_TAGS.map((tag) => (
                <TouchableOpacity key={tag} style={styles.tagPill} onPress={() => { setSearchQuery(tag); saveSearchAndNavigate(tag); }}>
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── TOP SELLING ── */}
          {topSelling.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Selling</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {topSelling.map((med) => (
                  <MedicineCard key={med.id} med={med} containerStyle={{ marginRight: rs(12) }} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── ORDER WITH PRESCRIPTION CTA ── */}
          <View style={[styles.section, { marginTop: rv(8) }]}>
            <TouchableOpacity 
              style={styles.prescriptionCard} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('UploadPrescription')}
            >
               <View style={styles.rxIconWrap}>
                  <Ionicons name="document-text" size={28} color={C.white} />
               </View>
               <View style={{ flex: 1, marginRight: rs(12) }}>
                  <Text style={styles.rxTitle}>Order with Prescription</Text>
                  <Text style={styles.rxSub}>Upload and let us handle your medicine order</Text>
               </View>
               <Ionicons name="chevron-forward" size={24} color={C.white} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: rv(12), borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { marginRight: rs(12) },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: radius.md, paddingHorizontal: rs(14), height: rv(44), borderWidth: 1, borderColor: C.border, marginRight: rs(12) },
  searchInput: { flex: 1, fontSize: rm(15), color: C.text, paddingRight: rs(8) },
  cartBtn: { position: 'relative', padding: rs(4) },
  badge: { position: 'absolute', top: -2, right: -4, backgroundColor: '#EF4444', borderRadius: rs(10), minWidth: rs(18), height: rs(18), alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.white, paddingHorizontal: 2 },
  badgeText: { color: C.white, fontSize: rm(10), fontWeight: 'bold' },
  
  scroll: { flex: 1, backgroundColor: C.bg },
  section: { backgroundColor: C.white, marginBottom: rv(12), paddingVertical: rv(20), paddingHorizontal: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rv(12) },
  sectionTitle: { fontSize: rm(16), fontWeight: '700', color: C.text, letterSpacing: -0.3, marginBottom: rv(12) },
  clearText: { fontSize: rm(13), fontWeight: '600', color: C.sub },
  
  recentWrap: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: rv(8) },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: rv(12) },
  recentText: { flex: 1, fontSize: rm(14), color: C.text },
  
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  tagPill: { backgroundColor: C.bg, paddingHorizontal: rs(14), paddingVertical: rv(8), borderRadius: radius.full, borderWidth: 1, borderColor: C.border },
  tagText: { fontSize: rm(13), color: C.text, fontWeight: '500' },
  
  horizontalScroll: { gap: rs(12), paddingRight: spacing.md },
  topCard: { width: rs(130), backgroundColor: C.card, borderRadius: radius.md, borderWidth: 1, borderColor: C.border, padding: rs(10) },
  topImgWrap: { width: '100%', height: rs(90), backgroundColor: C.bg, borderRadius: radius.sm, marginBottom: rv(10), alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  topImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  topName: { fontSize: rm(13), fontWeight: '600', color: C.text, marginBottom: rv(4), lineHeight: rv(18) },
  topPrice: { fontSize: rm(14), fontWeight: '800', color: C.primary },
  
  prescriptionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D1B2A', borderRadius: radius.lg, padding: rs(20) },
  rxIconWrap: { width: rs(48), height: rs(48), borderRadius: rs(24), backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: rs(16) },
  rxTitle: { fontSize: rm(16), fontWeight: '700', color: C.white, marginBottom: rv(4) },
  rxSub: { fontSize: rm(13), color: 'rgba(255,255,255,0.7)', lineHeight: rv(18) }
});
