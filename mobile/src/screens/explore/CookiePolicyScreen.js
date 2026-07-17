import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

export default function CookiePolicyScreen({ navigation }) {
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
        <Text style={styles.headerTitle}>Cookie Policy</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
      <Text style={styles.sectionTitle}>1. What Are Cookies</Text>
      <Text style={styles.paragraph}>Cookies are small text files that are stored on your device when you use our application. They help us make the app work properly, securely, and provide a better user experience.</Text>
      
      <Text style={styles.sectionTitle}>2. How We Use Cookies</Text>
      <Text style={styles.paragraph}>We use essential cookies to keep you logged in and secure your account. We also use performance cookies to understand how you interact with our app, which helps us improve our services.</Text>

      <Text style={styles.sectionTitle}>3. Types of Cookies We Use</Text>
      <Text style={styles.paragraph}>• Essential Cookies: Required for the app to function properly.
• Analytics Cookies: Help us understand app usage and performance.
• Preference Cookies: Remember your settings and preferences.</Text>

      <Text style={styles.sectionTitle}>4. Managing Cookies</Text>
      <Text style={styles.paragraph}>You can manage or disable cookies through your device's operating system settings. However, please note that disabling certain cookies may limit your ability to use some features of the Dosebox app.</Text>
    
        
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
