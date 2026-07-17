import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

const FAQS = [
  { q: 'How long does delivery take?', a: 'Standard delivery takes 24-48 hours. Express delivery is available in select cities within 4 hours.' },
  { q: 'Do I need a prescription?', a: 'Yes, a valid prescription from a registered medical practitioner is required for all Rx medicines.' },
  { q: 'What is your return policy?', a: 'We accept returns for unsealed OTC products within 7 days. Prescription medicines cannot be returned.' },
  { q: 'How do I track my order?', a: 'You can track your order in real-time from the "Proceed" or "Order Tracking" section of the app.' },
  { q: 'Are the medicines authentic?', a: 'Absolutely. We source all medications directly from authorized distributors and manufacturers.' }
];

export default function FAQScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageSubtitle}>Got questions? We've got answers.</Text>
        {FAQS.map((faq, i) => (
          <View key={i} style={styles.faqCard}>
            <Text style={styles.question}>{faq.q}</Text>
            <Text style={styles.answer}>{faq.a}</Text>
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
  content: { padding: spacing.lg, paddingBottom: rv(40) },
  pageSubtitle: { fontSize: rm(16), color: '#64748B', marginBottom: rv(24) },
  faqCard: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.lg, marginBottom: rv(16),
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    borderLeftWidth: 4, borderLeftColor: '#1F5C52',
  },
  question: { fontSize: rm(16), fontWeight: '700', color: '#0F172A', marginBottom: rv(8), letterSpacing: -0.2 },
  answer: { fontSize: rm(14), color: '#475569', lineHeight: rv(22) },
});