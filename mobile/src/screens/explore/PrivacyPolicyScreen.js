import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

export default function PrivacyPolicyScreen({ navigation }) {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
      <Text style={styles.sectionTitle}>1. Information We Collect</Text>
      <Text style={styles.paragraph}>We collect information you provide directly to us, such as when you create an account, update your profile, use the interactive features of our app, or make a purchase. This may include your name, email, phone number, address, and medical prescriptions.</Text>
      
      <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
      <Text style={styles.paragraph}>We use the information we collect to provide, maintain, and improve our services, process your transactions, send you technical notices and support messages, and respond to your comments and questions.</Text>

      <Text style={styles.sectionTitle}>3. Information Sharing</Text>
      <Text style={styles.paragraph}>We may share your information with our pharmacy partners strictly for the purpose of fulfilling your orders. We do not sell your personal information to third parties.</Text>

      <Text style={styles.sectionTitle}>4. Data Security</Text>
      <Text style={styles.paragraph}>We implement appropriate security measures to protect your personal and medical information against unauthorized access, alteration, disclosure, or destruction.</Text>

      <Text style={styles.sectionTitle}>5. Your Rights</Text>
      <Text style={styles.paragraph}>You have the right to access, update, or delete your personal information at any time through your account settings or by contacting our support team.</Text>
    
        
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
