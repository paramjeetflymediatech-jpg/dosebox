import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

export default function RefundPolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refund Policy</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
      <Text style={styles.sectionTitle}>1. Return Eligibility</Text>
      <Text style={styles.paragraph}>Due to health and safety regulations, we cannot accept returns on prescription medications once they have been dispensed and delivered. Over-the-counter products may be returned within 7 days if unopened and in original packaging.</Text>
      
      <Text style={styles.sectionTitle}>2. Damaged or Incorrect Items</Text>
      <Text style={styles.paragraph}>If you receive a damaged product or an incorrect medication, please contact our support team within 24 hours of delivery. We will arrange for a replacement or full refund at our expense.</Text>

      <Text style={styles.sectionTitle}>3. Order Cancellations</Text>
      <Text style={styles.paragraph}>You may cancel your order for a full refund before it has been processed by our pharmacy team. Once an order is marked as 'Processing' or 'Shipped', it cannot be cancelled.</Text>

      <Text style={styles.sectionTitle}>4. Refund Processing Time</Text>
      <Text style={styles.paragraph}>Approved refunds will be processed within 5-7 business days and automatically applied to your original method of payment.</Text>
    
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Last updated: July 13, 2026</Text>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingTop: rv(12),
    paddingBottom: rv(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: rv(4),
  },
  backIcon: {
    fontSize: rm(24),
    color: '#0F172A',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: rm(20),
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerRight: {
    width: rm(24),
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: rv(10),
    paddingBottom: rv(40),
  },
  sectionTitle: {
    fontSize: rm(18),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: rv(24),
    marginBottom: rv(12),
    letterSpacing: -0.2,
  },
  paragraph: {
    fontSize: rm(15),
    lineHeight: rv(24),
    color: '#475569',
    marginBottom: rv(8),
  },
  footer: {
    marginTop: rv(40),
    paddingTop: rv(24),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: rv(20),
  },
  footerText: {
    fontSize: rm(13),
    color: '#94A3B8',
  }
});
