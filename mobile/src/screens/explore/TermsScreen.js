import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

export default function TermsScreen({ navigation }) {
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
      <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
      <Text style={styles.paragraph}>By accessing and using the Dosebox application, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.</Text>
      
      <Text style={styles.sectionTitle}>2. Medical Disclaimer</Text>
      <Text style={styles.paragraph}>Dosebox provides information and facilitates access to medications, but we do not provide medical advice. Always consult with a qualified healthcare provider regarding any medical condition or treatment.</Text>

      <Text style={styles.sectionTitle}>3. User Accounts</Text>
      <Text style={styles.paragraph}>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.</Text>

      <Text style={styles.sectionTitle}>4. Prescription Requirements</Text>
      <Text style={styles.paragraph}>Certain medications require a valid prescription from a licensed medical professional. You agree to provide accurate and verifiable prescription information when required.</Text>

      <Text style={styles.sectionTitle}>5. Modifications</Text>
      <Text style={styles.paragraph}>We reserve the right to modify these terms at any time. Continued use of the app constitutes acceptance of any updated terms.</Text>
    
        
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
