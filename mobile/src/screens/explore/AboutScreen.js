import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

export default function AboutScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBox}>
          <Text style={styles.heroTitle}>Transforming Healthcare Delivery</Text>
          <Text style={styles.heroSubtitle}>Making authentic medicines accessible, affordable, and convenient for everyone across India.</Text>
        </View>

        <Text style={styles.sectionTitle}>Our Mission</Text>
        <View style={styles.card}>
          <Text style={styles.cardIcon}>🎯</Text>
          <Text style={styles.cardText}>To build a reliable digital healthcare ecosystem that empowers patients with easy access to high-quality medicines and professional healthcare services.</Text>
        </View>

        <Text style={styles.sectionTitle}>Our Impact</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>1M+</Text>
            <Text style={styles.statLabel}>Happy Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>50+</Text>
            <Text style={styles.statLabel}>Cities Covered</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>100k+</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4.8⭐</Text>
            <Text style={styles.statLabel}>App Rating</Text>
          </View>
        </View>
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
  content: { padding: spacing.lg, paddingBottom: rv(40) },
  heroBox: {
    backgroundColor: '#1F5C52', borderRadius: radius.xl, padding: spacing.xl,
    marginBottom: rv(32), alignItems: 'center', shadowColor: '#1F5C52',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  heroTitle: { fontSize: rm(24), fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: rv(12), letterSpacing: -0.5 },
  heroSubtitle: { fontSize: rm(15), color: '#EAF4F2', textAlign: 'center', lineHeight: rv(22) },
  sectionTitle: { fontSize: rm(18), fontWeight: '700', color: '#0F172A', marginBottom: rv(16), letterSpacing: -0.3 },
  card: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.lg, marginBottom: rv(32),
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  cardIcon: { fontSize: rm(28), marginRight: spacing.md },
  cardText: { flex: 1, fontSize: rm(15), color: '#475569', lineHeight: rv(24) },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: rv(16) },
  statCard: {
    width: '47%', backgroundColor: '#fff', paddingVertical: rv(24), borderRadius: radius.lg,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statValue: { fontSize: rm(26), fontWeight: '800', color: '#1F5C52', marginBottom: rv(4) },
  statLabel: { fontSize: rm(13), color: '#64748B', fontWeight: '500' },
});