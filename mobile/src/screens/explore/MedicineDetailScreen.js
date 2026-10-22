import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, useWindowDimensions, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCart } from '../../context/CartContext';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import { getFullImageUrl, getAllImageUrls } from '../../utils/image';
import MedicineCard from '../../components/MedicineCard';
import RenderHtml from 'react-native-render-html';
import api from '../../services/api';

const C = {
  primary: '#1F5C52',
  primaryLight: '#EAF4F2',
  accent: '#e68a7f',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  text: '#0D1B2A',
  sub: '#64748B',
  border: '#E9EDF2',
  card: '#FFFFFF',
  yellow: '#F59E0B',
  greenBg: '#DCFCE7',
  greenText: '#15803D',
  redBg: '#FEE2E2',
  redText: '#B91C1C',
  grayBg: '#F1F5F9',
  grayText: '#475569'
};

function SubstituteCard({ item, navigation, addToCart }) {
  const [imgError, setImgError] = useState(false);
  const subImage = getFullImageUrl(item.images || item.image);
  const comp = item.comparison || {};
  const isCheaper = comp.isCheaper;
  const isExpensive = comp.isExpensive;

  return (
    <View style={[styles.subCard, isCheaper && styles.subCardCheaper]}>
      <TouchableOpacity 
        activeOpacity={0.88}
        onPress={() => navigation.push('MedicineDetail', { medicine: item })}
      >
        <View style={styles.subImageWrap}>
          {subImage && !imgError ? (
            <Image 
              source={{ uri: subImage }} 
              style={styles.subImage} 
              resizeMode="contain" 
              onError={() => setImgError(true)}
            />
          ) : (
            <Ionicons name="medical" size={32} color="#CBD5E1" />
          )}
          {/* Savings Badge */}
          <View style={styles.subSavingsBadgeWrap}>
            {isCheaper ? (
              <View style={styles.subCheaperBadge}>
                <Ionicons name="arrow-down" size={9} color="#15803D" />
                <Text style={styles.subCheaperText}>SAVE ₹{comp.absDiff?.toFixed(0)} ({comp.percentage}%)</Text>
              </View>
            ) : isExpensive ? (
              <View style={styles.subExpensiveBadge}>
                <Ionicons name="arrow-up" size={9} color="#B91C1C" />
                <Text style={styles.subExpensiveText}>+₹{comp.absDiff?.toFixed(0)} ({comp.percentage}%)</Text>
              </View>
            ) : (
              <View style={styles.subSameBadge}>
                <Text style={styles.subSameText}>SAME PRICE</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.subBody}>
          <Text style={styles.subBrand} numberOfLines={1}>{item.brand?.name || item.manufacturer || 'Brand'}</Text>
          <Text style={styles.subName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.subPackSize} numberOfLines={1}>{item.packSize || (item.dosageForm ? `${item.dosageForm}` : 'Standard')}</Text>
          
          <View style={styles.subPriceRow}>
            <Text style={styles.subPrice}>₹{item.effectivePrice}</Text>
            {item.discountPrice && (
              <Text style={styles.subOldPrice}>₹{item.price}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Quick Add / Switch */}
      <TouchableOpacity
        style={[styles.subAddBtn, isCheaper ? { backgroundColor: '#15803D' } : { backgroundColor: C.primary }]}
        onPress={() => {
          addToCart({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            discountPrice: item.discountPrice ? Number(item.discountPrice) : undefined,
            prescriptionRequired: item.prescriptionRequired,
            image: subImage,
            packSize: item.packSize || item.dosageForm || null,
            brandName: item.brand?.name || item.manufacturer || null,
            dosageForm: item.dosageForm || null,
            molecule: item.molecule || item.composition || item.genericName || null,
            coldChain: Boolean(item.coldChain || item.isColdChain),
            qty: 1
          });
        }}
      >
        <Ionicons name="cart-outline" size={13} color={C.white} />
        <Text style={styles.subAddBtnText}>{isCheaper ? 'Switch & Add' : 'Add to Cart'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MedicineDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { addToCart, removeFromCart, items, totalQty } = useCart();
  const { width } = useWindowDimensions();
  const initialMedicine = route?.params?.medicine;

  const [medicine, setMedicine] = useState(initialMedicine);
  const [qty, setQty] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const imageCarouselRef = useRef(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [substitutes, setSubstitutes] = useState([]);
  const [subTarget, setSubTarget] = useState(null);
  const [loadingSubstitutes, setLoadingSubstitutes] = useState(true);
  const [subPage, setSubPage] = useState(1);
  const [subTotalPages, setSubTotalPages] = useState(1);
  const [subTotalItems, setSubTotalItems] = useState(0);
  const scrollViewRef = useRef(null);

  const loadSubstitutes = (pageNum = 1) => {
    if (!initialMedicine?.id) return;
    setLoadingSubstitutes(true);
    api.get(`/medicines/${initialMedicine.id}/substitutes?page=${pageNum}&limit=5`)
      .then(res => {
        if (res.data?.success && res.data.data) {
          setSubstitutes(res.data.data.substitutes || []);
          setSubTarget(res.data.data.targetMedicine || null);
          setSubTotalPages(res.data.data.pagination?.totalPages || 1);
          setSubTotalItems(res.data.data.pagination?.totalItems || 0);
          setSubPage(res.data.data.pagination?.currentPage || 1);
        }
      })
      .catch(err => console.log('Error fetching substitutes:', err))
      .finally(() => setLoadingSubstitutes(false));
  };

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    setActiveImageIndex(0);
    imageCarouselRef.current?.scrollToOffset({ offset: 0, animated: false });
    
    if (initialMedicine?.id) {
      api.get(`/medicines/${initialMedicine.id}`)
        .then(res => {
          if (res.data?.success) {
            setMedicine(res.data.data);
          }
        })
        .catch(err => console.log('Error fetching detailed medicine data:', err))
        .finally(() => setLoadingDetails(false));

      // Fetch substitutes matching molecule and strength
      loadSubstitutes(1);

      // Fetch related products
      api.get('/medicines?limit=6')
        .then(res => {
          if (res.data?.success) {
            setRelatedProducts(res.data.data.filter(m => m.id !== initialMedicine.id).slice(0, 5));
          }
        })
        .catch(err => console.log('Error fetching related medicines:', err));
    } else {
      setLoadingDetails(false);
      setLoadingSubstitutes(false);
    }
  }, [initialMedicine?.id]);

  if (!medicine) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Medicine not found.</Text>
      </SafeAreaView>
    );
  }

  const allImages = getAllImageUrls(medicine.images);
  if (allImages.length === 0 && medicine.image) {
    const fallbackSingle = getFullImageUrl(medicine.image);
    if (fallbackSingle) allImages.push(fallbackSingle);
  }
  const price = Number(medicine.price);
  const discPrice = medicine.discountPrice ? Number(medicine.discountPrice) : null;
  const savings = discPrice ? Math.round(((price - discPrice) / price) * 100) : 0;
  const finalPrice = discPrice || price;

  const handleThumbnailPress = (index) => {
    setActiveImageIndex(index);
    imageCarouselRef.current?.scrollToOffset({
      offset: index * width,
      animated: true,
    });
  };

  const onCarouselScroll = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    if (newIndex >= 0 && newIndex < allImages.length && newIndex !== activeImageIndex) {
      setActiveImageIndex(newIndex);
    }
  };

  const cartItem = items?.find((i) => i.id === medicine?.id);
  const inCartQty = cartItem ? cartItem.qty : 0;

  const handleAddToCart = () => {
    addToCart({
      id: medicine.id,
      name: medicine.name,
      price: price,
      discountPrice: discPrice,
      prescriptionRequired: medicine.prescriptionRequired,
      image: allImages[0] || null,
      packSize: medicine.packSize || null,
      brandName: medicine.brand?.name || medicine.manufacturer || null,
      dosageForm: medicine.dosageForm || null,
      molecule: medicine.molecule || medicine.composition || medicine.genericName || null,
      coldChain: Boolean(medicine.coldChain || medicine.isColdChain),
      qty: 1
    });
  };

  const handleIncreaseQty = () => {
    addToCart({
      id: medicine.id,
      name: medicine.name,
      price: price,
      discountPrice: discPrice,
      prescriptionRequired: medicine.prescriptionRequired,
      image: allImages[0] || null,
      packSize: medicine.packSize || null,
      brandName: medicine.brand?.name || medicine.manufacturer || null,
      dosageForm: medicine.dosageForm || null,
      molecule: medicine.molecule || medicine.composition || medicine.genericName || null,
      coldChain: Boolean(medicine.coldChain || medicine.isColdChain),
      qty: 1
    }, true);
  };

  const handleDecreaseQty = () => {
    removeFromCart(medicine.id);
  };

  const handleBuyNow = () => {
    if (inCartQty === 0) {
      addToCart({
        id: medicine.id,
        name: medicine.name,
        price: price,
        discountPrice: discPrice,
        prescriptionRequired: medicine.prescriptionRequired,
        image: allImages[0] || null,
        packSize: medicine.packSize || null,
        brandName: medicine.brand?.name || medicine.manufacturer || null,
        dosageForm: medicine.dosageForm || null,
        molecule: medicine.molecule || medicine.composition || medicine.genericName || null,
        coldChain: Boolean(medicine.coldChain || medicine.isColdChain),
        qty: 1
      }, true);
    }
    navigation.navigate('CartCheckout');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── HEADER WITH BACK, SEARCH & CART ── */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()} 
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.headerSearchWrap} 
          activeOpacity={0.8} 
          onPress={() => navigation.navigate('SearchScreen')}
          accessibilityLabel="Search medicines"
        >
          <Ionicons name="search" size={16} color={C.sub} style={{ marginRight: rs(8) }} />
          <Text style={styles.headerSearchText} numberOfLines={1}>
            Search medicines, symptoms...
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cartBtn} 
          onPress={() => navigation.navigate('CartCheckout')} 
          activeOpacity={0.75}
          accessibilityLabel="View Cart"
        >
          <Ionicons name="cart" size={22} color={C.primary} />
          {totalQty > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalQty > 9 ? '9+' : totalQty}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + rv(100) }} showsVerticalScrollIndicator={false}>
        
        {/* ── IMAGE SECTION ── */}
        <View style={styles.imageSectionWrap}>
          {allImages.length > 0 ? (
            <View style={styles.carouselContainer}>
              <FlatList
                ref={imageCarouselRef}
                data={allImages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => `${item}-${index}`}
                getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                onMomentumScrollEnd={onCarouselScroll}
                renderItem={({ item }) => (
                  <View style={[styles.imageSlide, { width }]}>
                    <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
                  </View>
                )}
              />

              {/* Counter Badge */}
              {allImages.length > 1 && (
                <View style={styles.imageCounterBadge}>
                  <Text style={styles.imageCounterText}>
                    {activeImageIndex + 1} / {allImages.length}
                  </Text>
                </View>
              )}

              {/* Dots */}
              {allImages.length > 1 && (
                <View style={styles.dotsWrap}>
                  {allImages.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        activeImageIndex === idx ? styles.activeDot : styles.inactiveDot
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.imageWrap, { width }]}>
              <Ionicons name="medical" size={100} color="#E2E8F0" />
            </View>
          )}

          {/* Product Badges (Rx, Cold Chain, PAP) */}
          <View style={styles.detailBadgeRow}>
            {medicine.prescriptionRequired ? (
              <View style={styles.rxBadge}>
                <Text style={styles.rxText}>RX REQUIRED</Text>
              </View>
            ) : null}
            {medicine.coldChain ? (
              <View style={styles.coldChainBadge}>
                <Ionicons name="snow" size={11} color="#FFFFFF" style={{ marginRight: rs(4) }} />
                <Text style={styles.coldChainText}>COLD CHAIN (2°C - 8°C)</Text>
              </View>
            ) : null}
            {medicine.papOffer ? (
              <View style={styles.papBadge}>
                <Ionicons name="gift" size={11} color="#FFFFFF" style={{ marginRight: rs(4) }} />
                <Text style={styles.papText}>PAP: {medicine.papOffer}</Text>
              </View>
            ) : null}
          </View>

          {/* Thumbnails Strip */}
          {allImages.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailList}
            >
              {allImages.map((imgUri, idx) => {
                const isSelected = activeImageIndex === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => handleThumbnailPress(idx)}
                    style={[
                      styles.thumbnailWrap,
                      isSelected && styles.thumbnailWrapActive
                    ]}
                  >
                    <Image source={{ uri: imgUri }} style={styles.thumbnailImage} resizeMode="contain" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ── BASIC DETAILS ── */}
        <View style={styles.section}>
          <Text style={styles.brandText}>{medicine.brand?.name || 'DoseBox Generics'}</Text>
          <Text style={styles.title}>{medicine.name}</Text>
          {Boolean(medicine.molecule || medicine.composition || medicine.genericName) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('SearchScreen', {
                  query: medicine.molecule || medicine.composition || medicine.genericName,
                })
              }
              style={{ marginBottom: rv(8) }}
            >
              <Text style={styles.detailMoleculeText}>
                {medicine.molecule || medicine.composition || medicine.genericName}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.packSize}>{medicine.packSize || 'Strip of 10 Tablets'}</Text>
          
          {/* <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={C.white} />
              <Text style={styles.ratingVal}>4.8</Text>
            </View>
            <Text style={styles.ratingCount}>42 Ratings & 12 Reviews</Text>
          </View> */}
          
          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.oldPriceRow}>
                <Text style={styles.oldPrice}>MRP ₹{price}</Text>
                {savings > 0 && (
                  <View style={styles.saveBadgePill}>
                    <Text style={styles.saveTextPill}>Save ₹{parseFloat((price - finalPrice).toFixed(2))} ({savings}%)</Text>
                  </View>
                )}
              </View>
              <Text style={styles.finalPrice}>₹{finalPrice}</Text>
              <Text style={styles.gstText}>Inclusive of all taxes (GST included)</Text>
            </View>
          </View>
        </View>

        {/* ── EQUIVALENT SUBSTITUTES & SAVINGS SECTION ── */}
        <View style={styles.substitutesSection}>
          <View style={styles.subHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.subBadgeRow}>
                <View style={styles.subBadgeMatch}>
                  <Ionicons name="sparkles" size={11} color="#0D9488" />
                  <Text style={styles.subBadgeMatchText}>SAME SALT & STRENGTH</Text>
                </View>
                {subTarget?.strength && (
                  <View style={styles.subStrengthBadge}>
                    <Text style={styles.subStrengthText}>{subTarget.strength}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.subSectionTitle}>Available Substitutes</Text>
              <Text style={styles.subSectionSub}>
                Bioequivalent alternatives • Lowest price first
              </Text>
            </View>
            {subTotalPages > 1 && (
              <View style={styles.subPaginationPills}>
                <TouchableOpacity
                  disabled={subPage <= 1}
                  onPress={() => loadSubstitutes(subPage - 1)}
                  style={[styles.subPageArrow, subPage <= 1 && { opacity: 0.3 }]}
                >
                  <Ionicons name="chevron-back" size={14} color={C.text} />
                </TouchableOpacity>
                <Text style={styles.subPageCountText}>{subPage}/{subTotalPages}</Text>
                <TouchableOpacity
                  disabled={subPage >= subTotalPages}
                  onPress={() => loadSubstitutes(subPage + 1)}
                  style={[styles.subPageArrow, subPage >= subTotalPages && { opacity: 0.3 }]}
                >
                  <Ionicons name="chevron-forward" size={14} color={C.text} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {loadingSubstitutes ? (
            <View style={{ paddingVertical: rv(20), alignItems: 'center' }}>
              <ActivityIndicator size="small" color={C.primary} />
              <Text style={{ fontSize: rm(12), color: C.sub, marginTop: rv(6) }}>Finding matching substitutes...</Text>
            </View>
          ) : substitutes.length === 0 ? (
            <View style={styles.noSubBox}>
              <Ionicons name="shield-checkmark" size={18} color="#0D9488" />
              <Text style={styles.noSubText}>
                No other alternative brands currently stocked with matching strength ({subTarget?.strength || 'standard'}). The selected medicine is verified.
              </Text>
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={substitutes}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <SubstituteCard 
                  item={item} 
                  navigation={navigation} 
                  addToCart={addToCart} 
                />
              )}
              contentContainerStyle={{ paddingRight: spacing.md }}
            />
          )}
        </View>

        {/* ── ABOUT PRODUCT ── */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Product</Text>
          <Text style={styles.descText}>{medicine.description || 'No description available for this product.'}</Text>
        </View> */}

        {/* ── COMPOSITION & DETAILS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Composition</Text>
          <Text style={styles.descText}>{medicine.composition || 'Not specified'}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{medicine.categoryDetail?.name || medicine.category?.name || 'General'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Manufacturer:</Text>
            <Text style={styles.detailValue}>{medicine.brand?.name || 'Not specified'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>HSN Code:</Text>
            <Text style={styles.detailValue}>{medicine.hsnCode || 'N/A'}</Text>
          </View>
        </View>

        {/* ── DYNAMIC SECTIONS ── */}
        {medicine.sections && medicine.sections.map((sec, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <RenderHtml
              contentWidth={width - spacing.md * 2}
              source={{ html: sec.content || '' }}
              baseStyle={{ fontSize: rm(15), color: '#475569', lineHeight: rv(24) }}
            />
          </View>
        ))}

        {/* ── AUTHENTICITY BADGE ── */}
        {medicine.contentStatus === 'Approved' && medicine.verifierName && (
          <View style={[styles.section, { backgroundColor: '#F0FDFA', borderColor: '#CCFBF1', borderWidth: 1, borderRadius: radius.md, marginHorizontal: spacing.md, padding: spacing.md }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: rv(8) }}>
              <Ionicons name="shield-checkmark" size={rs(24)} color="#0D9488" />
              <Text style={{ fontSize: rm(14), fontWeight: '700', color: '#115E59', marginLeft: rs(8) }}>Medically Verified Content</Text>
            </View>
            <Text style={{ fontSize: rm(12), color: '#0F766E', lineHeight: rv(18) }}>
              This information has been checked and approved by {medicine.verifierName}.
            </Text>
            <Text style={{ fontSize: rm(12), color: '#0F766E', fontWeight: 'bold', marginTop: rv(4) }}>
              Reg No: {medicine.verifierRegNo || 'N/A'}
            </Text>
          </View>
        )}

        {/* ── RELATED PRODUCTS ── */}
        {relatedProducts.length > 0 && (
          <View style={[styles.section, { paddingRight: 0, backgroundColor: 'transparent' }]}>
            <Text style={styles.sectionTitle}>Related Products</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={relatedProducts}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <MedicineCard med={item} containerStyle={{ marginRight: rs(12), width: rs(160) }} />
              )}
              contentContainerStyle={{ paddingRight: spacing.md }}
            />
          </View>
        )}
      </ScrollView>

      {/* ── BOTTOM STICKY BAR ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, rv(16)) }]}>
        {inCartQty > 0 ? (
          <View style={styles.qtyStepperWrap}>
            <TouchableOpacity 
              style={styles.qtyStepperBtn} 
              onPress={handleDecreaseQty}
              activeOpacity={0.7}
              accessibilityLabel="Decrease quantity"
            >
              <Ionicons name="remove" size={18} color={C.primary} />
            </TouchableOpacity>
            <View style={styles.qtyStepperTextWrap}>
              <Text style={styles.qtyStepperText}>{inCartQty}</Text>
              <Text style={styles.qtyStepperSubText}>in cart</Text>
            </View>
            <TouchableOpacity 
              style={styles.qtyStepperBtn} 
              onPress={handleIncreaseQty}
              activeOpacity={0.7}
              accessibilityLabel="Increase quantity"
            >
              <Ionicons name="add" size={18} color={C.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addCartBtn} 
            onPress={handleAddToCart} 
            activeOpacity={0.8}
            accessibilityLabel="Add to Cart"
          >
            <Ionicons name="cart-outline" size={18} color={C.primary} style={{ marginRight: rs(6) }} />
            <Text style={styles.addCartBtnText}>Add to Cart</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.buyNowBtn} 
          onPress={handleBuyNow} 
          activeOpacity={0.85}
          accessibilityLabel="Buy Now"
        >
          <Ionicons name="flash" size={17} color={C.white} style={{ marginRight: rs(4) }} />
          <Text style={styles.buyNowBtnText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  errorText: { textAlign: 'center', marginTop: rv(40), fontSize: rm(16), color: C.text },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: rv(10),
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: rs(10),
  },
  backBtn: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSearchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.full,
    paddingHorizontal: rs(12),
    height: rv(40),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerSearchText: {
    flex: 1,
    fontSize: rm(13),
    color: '#94A3B8',
    fontWeight: '500',
  },
  cartBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -rv(3),
    right: -rs(3),
    minWidth: rs(18),
    height: rs(18),
    borderRadius: rs(9),
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(4),
    borderWidth: 1.5,
    borderColor: C.white,
  },
  cartBadgeText: {
    fontSize: rm(9),
    fontWeight: '800',
    color: C.white,
  },
  
  scroll: { flex: 1 },
  
  imageSectionWrap: { backgroundColor: C.white, paddingBottom: rv(12), marginBottom: rv(8), position: 'relative', borderBottomWidth: 1, borderBottomColor: C.border },
  carouselContainer: { height: rv(280), alignItems: 'center', justifyContent: 'center', position: 'relative' },
  imageSlide: { height: rv(280), alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(20) },
  imageWrap: { backgroundColor: C.white, height: rv(280), alignItems: 'center', justifyContent: 'center' },
  image: { width: '85%', height: '85%' },
  imageCounterBadge: { position: 'absolute', bottom: rv(12), right: rs(16), backgroundColor: 'rgba(15, 23, 42, 0.7)', paddingHorizontal: rs(10), paddingVertical: rv(4), borderRadius: 16 },
  imageCounterText: { fontSize: rm(11), fontWeight: '700', color: C.white, letterSpacing: 0.5 },
  dotsWrap: { position: 'absolute', bottom: rv(14), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', left: 0, right: 0 },
  dot: { height: rv(6), borderRadius: rv(3), marginHorizontal: rs(3) },
  activeDot: { width: rs(18), backgroundColor: C.primary },
  inactiveDot: { width: rs(6), backgroundColor: '#CBD5E1' },
  thumbnailList: { paddingHorizontal: spacing.md, paddingTop: rv(10), gap: rs(10), flexDirection: 'row', alignItems: 'center' },
  thumbnailWrap: { width: rs(60), height: rs(60), borderRadius: radius.md, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', padding: rs(4), alignItems: 'center', justifyContent: 'center' },
  thumbnailWrapActive: { borderColor: C.primary, borderWidth: 2, backgroundColor: C.white, elevation: 3, shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  thumbnailImage: { width: '100%', height: '100%' },
  detailBadgeRow: { position: 'absolute', top: rv(16), left: rs(16), right: rs(16), flexDirection: 'row', flexWrap: 'wrap', gap: rs(6), zIndex: 10 },
  rxBadge: { backgroundColor: '#3b1d60', paddingHorizontal: rs(8), paddingVertical: rv(4), borderRadius: 6 },
  rxText: { fontSize: rm(10), fontWeight: '800', color: '#FFFFFF' },
  coldChainBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0284C7', paddingHorizontal: rs(8), paddingVertical: rv(4), borderRadius: 6 },
  coldChainText: { fontSize: rm(10), fontWeight: '800', color: '#FFFFFF' },
  papBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D97706', paddingHorizontal: rs(8), paddingVertical: rv(4), borderRadius: 6 },
  papText: { fontSize: rm(10), fontWeight: '800', color: '#FFFFFF' },
  
  section: { backgroundColor: C.white, padding: spacing.md, marginBottom: rv(8) },
  brandText: { fontSize: rm(13), color: C.sub, fontWeight: '600', textTransform: 'uppercase', marginBottom: rv(4) },
  title: { fontSize: rm(22), fontWeight: '700', color: C.text, marginBottom: rv(4), lineHeight: rv(28) },
  detailMoleculeText: { fontSize: rm(13), fontWeight: '700', color: '#0284C7', textDecorationLine: 'underline', textTransform: 'uppercase' },
  packSize: { fontSize: rm(15), color: C.sub, marginBottom: rv(16) },
  
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: rv(20) },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22C55E', paddingHorizontal: rs(8), paddingVertical: rv(4), borderRadius: radius.sm, gap: rs(4), marginRight: rs(12) },
  ratingVal: { fontSize: rm(13), fontWeight: '700', color: C.white },
  ratingCount: { fontSize: rm(13), color: C.sub },
  
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: C.border, paddingTop: rv(16) },
  oldPriceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: rv(4) },
  oldPrice: { fontSize: rm(14), color: C.sub, textDecorationLine: 'line-through' },
  saveBadgePill: { backgroundColor: '#DCFCE7', paddingHorizontal: rs(8), paddingVertical: rv(2), borderRadius: radius.full, marginLeft: rs(8) },
  saveTextPill: { fontSize: rm(11), color: '#15803D', fontWeight: '800' },
  finalPrice: { fontSize: rm(28), fontWeight: '800', color: C.text },
  gstText: { fontSize: rm(11), color: C.sub, marginTop: rv(3) },
  
  sectionTitle: { fontSize: rm(18), fontWeight: '700', color: C.text, marginBottom: rv(12) },
  descText: { fontSize: rm(15), color: '#475569', lineHeight: rv(24) },
  
  divider: { height: 1, backgroundColor: C.border, marginVertical: rv(16) },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rv(8) },
  detailLabel: { fontSize: rm(14), color: C.sub, flex: 1 },
  detailValue: { fontSize: rm(14), color: C.text, fontWeight: '500', flex: 2, textAlign: 'right' },
  
  bottomBar: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: C.white, 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: spacing.md, 
    paddingTop: rv(12), 
    gap: rs(10),
    borderTopWidth: 1, 
    borderTopColor: C.border, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -4 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 10, 
    elevation: 10 
  },
  addCartBtn: { 
    flex: 1, 
    backgroundColor: '#EAF4F2', 
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: radius.md, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: rv(48) 
  },
  addCartBtnText: { fontSize: rm(15), fontWeight: '700', color: C.primary },

  qtyStepperWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: radius.md,
    backgroundColor: '#F0FDFA',
    height: rv(48),
    paddingHorizontal: rs(6),
  },
  qtyStepperBtn: {
    width: rs(36),
    height: rv(36),
    borderRadius: radius.sm,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  qtyStepperTextWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyStepperText: {
    fontSize: rm(15),
    fontWeight: '800',
    color: C.primary,
    lineHeight: rv(17),
  },
  qtyStepperSubText: {
    fontSize: rm(9),
    fontWeight: '600',
    color: C.sub,
  },

  buyNowBtn: { 
    flex: 1, 
    backgroundColor: C.primary, 
    borderRadius: radius.md, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: rv(48),
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buyNowBtnText: { fontSize: rm(15), fontWeight: '800', color: C.white },

  // Substitutes Section Styles
  substitutesSection: { backgroundColor: C.white, paddingVertical: spacing.md, paddingLeft: spacing.md, marginBottom: rv(8), borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border },
  subHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: spacing.md, marginBottom: rv(12) },
  subBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rv(4) },
  subBadgeMatch: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDFA', borderColor: '#CCFBF1', borderWidth: 1, paddingHorizontal: rs(6), paddingVertical: rv(2), borderRadius: 6, gap: rs(4) },
  subBadgeMatchText: { fontSize: rm(9), fontWeight: '800', color: '#0F766E', letterSpacing: 0.5 },
  subStrengthBadge: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1, paddingHorizontal: rs(6), paddingVertical: rv(2), borderRadius: 6 },
  subStrengthText: { fontSize: rm(9), fontWeight: '800', color: '#92400E' },
  subSectionTitle: { fontSize: rm(17), fontWeight: '800', color: C.text, marginTop: rv(2) },
  subSectionSub: { fontSize: rm(11), color: C.sub, marginTop: rv(1) },
  
  subPaginationPills: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: radius.full, paddingHorizontal: rs(6), paddingVertical: rv(2) },
  subPageArrow: { padding: rs(3) },
  subPageCountText: { fontSize: rm(11), fontWeight: '700', color: C.text, marginHorizontal: rs(4) },
  
  noSubBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: radius.md, padding: spacing.md, marginRight: spacing.md, gap: rs(8) },
  noSubText: { fontSize: rm(12), color: C.sub, flex: 1, lineHeight: rv(16) },

  subCard: { width: rs(170), backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: radius.lg, marginRight: rs(12), overflow: 'hidden', justifyContent: 'space-between' },
  subCardCheaper: { borderColor: '#86EFAC', shadowColor: '#15803D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  
  subImageWrap: { height: rv(110), backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  subImage: { width: '85%', height: '85%' },
  
  subSavingsBadgeWrap: { position: 'absolute', top: rv(6), left: rs(6), right: rs(6) },
  subCheaperBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#15803D', paddingHorizontal: rs(6), paddingVertical: rv(2), borderRadius: 4, gap: rs(2), alignSelf: 'flex-start' },
  subCheaperText: { fontSize: rm(8.5), fontWeight: '800', color: C.white },
  subExpensiveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#B91C1C', paddingHorizontal: rs(6), paddingVertical: rv(2), borderRadius: 4, gap: rs(2), alignSelf: 'flex-start' },
  subExpensiveText: { fontSize: rm(8.5), fontWeight: '800', color: C.white },
  subSameBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: rs(6), paddingVertical: rv(2), borderRadius: 4, alignSelf: 'flex-start' },
  subSameText: { fontSize: rm(8), fontWeight: '700', color: '#475569' },

  subBody: { padding: spacing.sm },
  subBrand: { fontSize: rm(10), fontWeight: '700', color: C.sub, textTransform: 'uppercase' },
  subName: { fontSize: rm(13), fontWeight: '700', color: C.text, marginTop: rv(2), lineHeight: rv(17), height: rv(34) },
  subPackSize: { fontSize: rm(11), color: C.sub, marginTop: rv(2) },
  
  subPriceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: rv(6), gap: rs(6) },
  subPrice: { fontSize: rm(16), fontWeight: '800', color: C.text },
  subOldPrice: { fontSize: rm(11), color: C.sub, textDecorationLine: 'line-through' },
  
  subAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: rv(8), gap: rs(4), borderBottomLeftRadius: radius.lg - 1, borderBottomRightRadius: radius.lg - 1 },
  subAddBtnText: { fontSize: rm(12), fontWeight: '700', color: C.white }
});
