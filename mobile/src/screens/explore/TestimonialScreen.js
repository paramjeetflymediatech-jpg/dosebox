import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

const REVIEWS = [
  { name: 'Anjali Sharma', role: 'Verified User', stars: '⭐⭐⭐⭐⭐', text: 'Dosebox completely changed how I manage my parents medications. Super fast delivery and great discounts!' },
  { name: 'Rahul Desai', role: 'Verified User', stars: '⭐⭐⭐⭐⭐', text: 'The UI is so clean and finding medicines is a breeze. Customer support was also very helpful when I had a query about a prescription.' },
  { name: 'Priya Patel', role: 'Verified User', stars: '⭐⭐⭐⭐', text: 'Good service and reliable stock. I almost always find the exact brand my doctor prescribes here.' },
  { name: 'Amit Kumar', role: 'Verified User', stars: '⭐⭐⭐⭐⭐', text: 'Life saver! Order tracking is incredibly accurate and the packaging is very secure and professional.' },
];

export default function TestimonialScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Reviews</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.ratingOverview}>
          <Text style={styles.ratingNumber}>4.8</Text>
          <Text style={styles.ratingStars}>⭐⭐⭐⭐⭐</Text>
          <Text style={styles.ratingLabel}>Based on 12,000+ reviews</Text>
        </View>

        {REVIEWS.map((r, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.stars}>{r.stars}</Text>
            <Text style={styles.reviewText}>"{r.text}"</Text>
            <View style={styles.userRow}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{r.name.charAt(0)}</Text></View>
              <View>
                <Text style={styles.userName}>{r.name}</Text>
                <Text style={styles.userRole}>{r.role}</Text>
              </View>
            </View>
          </View>
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
  ratingOverview: { alignItems: 'center', paddingVertical: rv(24), marginBottom: rv(16) },
  ratingNumber: { fontSize: rm(48), fontWeight: '800', color: '#0F172A', letterSpacing: -1 },
  ratingStars: { fontSize: rm(20), marginVertical: rv(8) },
  ratingLabel: { fontSize: rm(14), color: '#64748B', fontWeight: '500' },
  card: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.xl, marginBottom: rv(16),
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  stars: { fontSize: rm(14), marginBottom: rv(12) },
  reviewText: { fontSize: rm(15), color: '#334155', lineHeight: rv(24), fontStyle: 'italic', marginBottom: rv(20) },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: rv(40), height: rv(40), borderRadius: rv(20), backgroundColor: '#EAF4F2', alignItems: 'center', justifyContent: 'center', marginRight: rv(12) },
  avatarText: { fontSize: rm(16), fontWeight: '700', color: '#1F5C52' },
  userName: { fontSize: rm(15), fontWeight: '700', color: '#0F172A' },
  userRole: { fontSize: rm(13), color: '#94A3B8' },
});