import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import { getFullImageUrl } from '../../utils/image';

const FALLBACK_COLORS = ['#FEE2E2', '#FCE7F3', '#FEF3C7', '#E0F2FE', '#F3E8FF', '#DCFCE7', '#FFEDD5', '#E0E7FF'];

export default function CategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: rv(40) }}>
            <ActivityIndicator size="large" color="#1F5C52" />
          </View>
        ) : (
          <View style={styles.grid}>
            {categories.map((cat, idx) => {
              const color = FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
              const icon = cat.icon || cat.name?.charAt(0).toUpperCase() || '✨';
              const imageUrl = getFullImageUrl(cat.image);
              
              return (
                <TouchableOpacity 
                  key={cat.id} 
                  style={styles.card} 
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('SearchScreen', { query: cat.name, categorySlug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-') })}
                >
                  {imageUrl ? (
                    <View style={[styles.iconBox, { backgroundColor: '#F8FAFC', padding: 4 }]}>
                      <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 32 }} resizeMode="cover" />
                    </View>
                  ) : (
                    <View style={[styles.iconBox, { backgroundColor: color }]}>
                      <Text style={styles.icon}>{icon}</Text>
                    </View>
                  )}
                  <Text style={styles.name}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: spacing.md, paddingTop: rv(12), paddingBottom: rv(14),
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backButton: { padding: rv(4) },
  backIcon: { fontSize: rm(24), color: '#0F172A', fontWeight: '300' },
  headerTitle: { fontSize: rm(20), fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  headerRight: { width: rm(24) },
  content: { padding: spacing.md, paddingBottom: rv(40) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: rv(12) },
  card: {
    width: '48%', backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.lg,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, marginBottom: rv(8)
  },
  iconBox: { width: rv(64), height: rv(64), borderRadius: rv(32), alignItems: 'center', justifyContent: 'center', marginBottom: rv(16) },
  icon: { fontSize: rm(28) },
  name: { fontSize: rm(15), fontWeight: '600', color: '#0F172A', textAlign: 'center' },
});