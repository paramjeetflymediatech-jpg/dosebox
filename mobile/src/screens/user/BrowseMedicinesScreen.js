import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import api from '../../services/api';
import { ActivityIndicator } from 'react-native';
import { getFullImageUrl } from '../../utils/image';

const C = {
  primary: '#1F5C52',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  text: '#0F172A',
  sub: '#64748B',
  border: '#F1F5F9',
  iconBg: '#F1F5F9',
  iconColor: '#475569'
};

const FALLBACK_COLORS = ['#FEE2E2', '#FCE7F3', '#FEF3C7', '#E0F2FE', '#F3E8FF', '#DCFCE7', '#FFEDD5', '#E0E7FF'];

const MENU_SECTIONS = [
  {
    title: 'Company',
    items: [
      { id: 'about', title: 'About Us', icon: 'business-outline', screen: 'About' },
      { id: 'faq', title: 'Help & FAQ', icon: 'help-circle-outline', screen: 'FAQ' },
      { id: 'blog', title: 'Our Blog', icon: 'document-text-outline', screen: 'Blog' },
      { id: 'contact', title: 'Contact Support', icon: 'chatbubbles-outline', screen: 'Contact' },
      { id: 'test', title: 'Testimonials', icon: 'star-outline', screen: 'Testimonial' },
      // { id: 'news', title: 'Latest News', icon: 'newspaper-outline', screen: 'News' }
    ]
  },
  {
    title: 'Legal & Policies',
    items: [
      { id: 'terms', title: 'Terms & Conditions', icon: 'document-lock-outline', screen: 'Terms' },
      { id: 'privacy', title: 'Privacy Policy', icon: 'shield-checkmark-outline', screen: 'PrivacyPolicy' },
      { id: 'refund', title: 'Refund Policy', icon: 'card-outline', screen: 'RefundPolicy' },
      { id: 'cookie', title: 'Cookie Policy', icon: 'information-circle-outline', screen: 'CookiePolicy' }
    ]
  }
];

export default function BrowseMedicinesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data?.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: rs(12) }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={rs(24)} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Explore</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
      >
        <Text style={styles.sectionTitle}>Medicine Categories</Text>
        {loading ? (
          <View style={{ paddingVertical: rv(40), alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#1F5C52" />
          </View>
        ) : (
          <View style={[styles.card, { marginBottom: rv(24) }]}>
            {categories.map((cat, idx) => {
              const color = FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
              const icon = cat.icon || cat.name?.charAt(0).toUpperCase() || '✨';
              const isLast = idx === categories.length - 1;
              const imageUrl = getFullImageUrl(cat.image);
              
              return (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.item, isLast && styles.itemLast]} 
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('SearchScreen', { query: cat.name, categorySlug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-') })}
                >
                  <View style={styles.itemLeft}>
                    {imageUrl ? (
                      <View style={[styles.iconWrap, { backgroundColor: '#F8FAFC', padding: 2 }]}>
                        <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
                      </View>
                    ) : (
                      <View style={[styles.iconWrap, { backgroundColor: color }]}>
                        <Text style={{ fontSize: rm(18) }}>{icon}</Text>
                      </View>
                    )}
                    <Text style={styles.itemLabel}>{cat.name}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, index) => {
                const isLast = index === section.items.length - 1;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.item, isLast && styles.itemLast]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate(item.screen, { title: item.title })}
                  >
                    <View style={styles.itemLeft}>
                      <View style={styles.iconWrap}>
                        <Ionicons name={item.icon} size={20} color={C.iconColor} />
                      </View>
                      <Text style={styles.itemLabel}>{item.title}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    backgroundColor: C.white,
    paddingHorizontal: spacing.md,
    paddingVertical: rv(16),
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: rm(24),
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: rv(20),
    paddingBottom: rv(120),
  },
  section: {
    marginBottom: rv(24),
  },
  sectionTitle: {
    fontSize: rm(13),
    fontWeight: '700',
    color: C.sub,
    marginBottom: rv(10),
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: rv(14),
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(14),
  },
  iconWrap: {
    width: rs(36),
    height: rs(36),
    borderRadius: radius.md,
    backgroundColor: C.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: rm(15),
    fontWeight: '600',
    color: C.text,
  },
});
