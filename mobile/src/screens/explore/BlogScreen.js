import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

const POSTS = [
  { id: 1, category: 'Health Tips', title: '10 Superfoods for a Healthy Heart', read: '5 min read', date: 'Jul 12, 2026', color: '#E0F2FE', text: '#0284C7' },
  { id: 2, category: 'Wellness', title: 'The Importance of Sleep on Immunity', read: '4 min read', date: 'Jul 10, 2026', color: '#DCFCE7', text: '#16A34A' },
  { id: 3, category: 'Medical News', title: 'Understanding Generic vs Branded Drugs', read: '7 min read', date: 'Jul 05, 2026', color: '#FEE2E2', text: '#DC2626' },
  { id: 4, category: 'Nutrition', title: 'Vitamins You Actually Need Daily', read: '3 min read', date: 'Jun 28, 2026', color: '#FEF3C7', text: '#D97706' },
];

export default function BlogScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dosebox Blog</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {POSTS.map(post => (
          <TouchableOpacity key={post.id} style={styles.card} activeOpacity={0.7}>
            <View style={styles.imagePlaceholder}><Text style={styles.imageIcon}>📰</Text></View>
            <View style={styles.cardBody}>
              <View style={[styles.badge, { backgroundColor: post.color }]}>
                <Text style={[styles.badgeText, { color: post.text }]}>{post.category}</Text>
              </View>
              <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>{post.date}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.meta}>{post.read}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
  card: {
    backgroundColor: '#fff', borderRadius: radius.xl, marginBottom: rv(20), overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  imagePlaceholder: { height: rv(140), backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  imageIcon: { fontSize: rm(40) },
  cardBody: { padding: spacing.lg },
  badge: { alignSelf: 'flex-start', paddingHorizontal: rv(10), paddingVertical: rv(4), borderRadius: radius.sm, marginBottom: rv(10) },
  badgeText: { fontSize: rm(12), fontWeight: '600' },
  title: { fontSize: rm(18), fontWeight: '700', color: '#0F172A', marginBottom: rv(12), letterSpacing: -0.2, lineHeight: rv(24) },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  meta: { fontSize: rm(13), color: '#64748B', fontWeight: '500' },
  metaDot: { fontSize: rm(13), color: '#CBD5E1', marginHorizontal: rv(8) },
});