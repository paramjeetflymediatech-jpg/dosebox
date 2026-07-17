import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

const NEWS = [
  { date: 'Jul 10, 2026', title: 'Dosebox Expands 4-Hour Delivery to 15 New Cities', snippet: 'We are thrilled to announce that our hyper-local fast delivery network is now active in 15 additional tier-2 cities across India.' },
  { date: 'Jun 22, 2026', title: 'Introducing Dosebox Rewards Program', snippet: 'Earn points on every prescription and OTC purchase. Redeem points for exclusive health products and discounts.' },
  { date: 'May 15, 2026', title: 'New Feature: AI Prescription Scanner', snippet: 'Uploading prescriptions just got easier. Our new AI scanner instantly reads your doctors handwriting to speed up checkout.' },
];

export default function NewsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>In The News</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {NEWS.map((item, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.snippet}>{item.snippet}</Text>
            <TouchableOpacity style={styles.readMore}>
              <Text style={styles.readMoreText}>Read Full Article →</Text>
            </TouchableOpacity>
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
  card: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.xl, marginBottom: rv(16),
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  date: { fontSize: rm(13), color: '#1F5C52', fontWeight: '700', marginBottom: rv(8), textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: rm(18), fontWeight: '700', color: '#0F172A', marginBottom: rv(12), letterSpacing: -0.2, lineHeight: rv(24) },
  snippet: { fontSize: rm(15), color: '#475569', lineHeight: rv(22), marginBottom: rv(16) },
  readMoreText: { fontSize: rm(14), fontWeight: '600', color: '#0284C7' },
});