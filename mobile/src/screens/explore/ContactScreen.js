import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

export default function ContactScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>✉️</Text>
            <Text style={styles.infoTitle}>Email Us</Text>
            <Text style={styles.infoDetail}>support@dosebox.com</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📞</Text>
            <Text style={styles.infoTitle}>Call Us</Text>
            <Text style={styles.infoDetail}>+91 1800-123-4567</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Send a Message</Text>
          
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#94A3B8" />
          
          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} placeholder="john@example.com" placeholderTextColor="#94A3B8" keyboardType="email-address" />
          
          <Text style={styles.label}>Message</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="How can we help you?" placeholderTextColor="#94A3B8" multiline numberOfLines={4} textAlignVertical="top" />
          
          <TouchableOpacity style={styles.submitBtn}>
            <Text style={styles.submitText}>Send Message</Text>
          </TouchableOpacity>
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
  content: { padding: spacing.md, paddingBottom: rv(40) },
  infoCards: { flexDirection: 'row', gap: rv(12), marginBottom: rv(24) },
  infoCard: {
    flex: 1, backgroundColor: '#fff', padding: spacing.lg, borderRadius: radius.lg,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  infoIcon: { fontSize: rm(28), marginBottom: rv(8) },
  infoTitle: { fontSize: rm(15), fontWeight: '600', color: '#0F172A', marginBottom: rv(4) },
  infoDetail: { fontSize: rm(13), color: '#64748B', textAlign: 'center' },
  formCard: {
    backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  formTitle: { fontSize: rm(20), fontWeight: '700', color: '#0F172A', marginBottom: rv(20), letterSpacing: -0.3 },
  label: { fontSize: rm(13), fontWeight: '600', color: '#475569', marginBottom: rv(8), textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.md,
    paddingHorizontal: rv(16), paddingVertical: rv(14), fontSize: rm(15), color: '#0F172A', marginBottom: rv(20),
  },
  textArea: { height: rv(120) },
  submitBtn: { backgroundColor: '#1F5C52', paddingVertical: rv(16), borderRadius: radius.md, alignItems: 'center', marginTop: rv(8) },
  submitText: { color: '#fff', fontSize: rm(16), fontWeight: '600', letterSpacing: 0.3 },
});