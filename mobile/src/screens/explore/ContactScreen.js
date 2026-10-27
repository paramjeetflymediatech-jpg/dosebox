import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import api from '../../services/api';
import { AlertService } from '../../services/AlertService';

const ISSUE_TYPES = [
  'Institutional Supply Inquiry',
  'Order Issue',
  'Product Inquiry',
  'Billing / Invoicing',
  'Grievance / Compliance Concern',
  'Other'
];

export default function ContactScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [issueType, setIssueType] = useState('Institutional Supply Inquiry');
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !phone || !message) {
      AlertService.show({ type: 'error', title: 'Error', message: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/support', { 
        name, 
        email, 
        phone, 
        issueType, 
        orderId: issueType === 'Order Issue' ? orderId : '', 
        message 
      });
      AlertService.show({ type: 'success', title: 'Request Submitted!', message: 'Thank you for reaching out. Our team will get back to you within 24 hours.' });
      setName('');
      setEmail('');
      setPhone('');
      setIssueType('Institutional Supply Inquiry');
      setOrderId('');
      setMessage('');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to send message. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Grievance & Compliance Officer Card */}
        <View style={styles.complianceCard}>
          <View style={styles.complianceHeader}>
            <View style={styles.complianceBadge}>
              <Text style={styles.complianceBadgeText}>OFFICIAL REGULATORY CONTACT</Text>
            </View>
          </View>
          <Text style={styles.complianceTitle}>Grievance & Compliance Officer</Text>
          <Text style={styles.complianceSub}>
            In accordance with the Information Technology Act & Pharmacy Rules, please reach out directly for compliance or statutory matters.
          </Text>

          <View style={styles.complianceDetailRow}>
            <Text style={styles.complianceDetailLabel}>Officer:</Text>
            <Text style={styles.complianceDetailValue}>Paramjeet Singh</Text>
          </View>
          <View style={styles.complianceDetailRow}>
            <Text style={styles.complianceDetailLabel}>Email:</Text>
            <Text style={[styles.complianceDetailValue, { color: '#0c888d', fontWeight: '700' }]}>compliance@dosebox.in</Text>
          </View>
          <View style={styles.complianceDetailRow}>
            <Text style={styles.complianceDetailLabel}>Address:</Text>
            <Text style={styles.complianceDetailValue}>
              B 2, Basement, Mohta Building 4, Bhikaji Cama Place, Near BCP, New Delhi, Delhi - 110066
            </Text>
          </View>
          <View style={styles.complianceDetailRow}>
            <Text style={styles.complianceDetailLabel}>Hours:</Text>
            <Text style={styles.complianceDetailValue}>Mon – Sat: 10:00 AM – 6:00 PM IST</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Submit a Request</Text>
          
          <Text style={styles.label}>Full Name <Text style={{ color: '#ef4444' }}>*</Text></Text>
          <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#94A3B8" value={name} onChangeText={setName} />
          
          <Text style={styles.label}>Email Address <Text style={{ color: '#ef4444' }}>*</Text></Text>
          <TextInput style={styles.input} placeholder="john@example.com" placeholderTextColor="#94A3B8" keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" />
          
          <Text style={styles.label}>Phone Number <Text style={{ color: '#ef4444' }}>*</Text></Text>
          <TextInput style={styles.input} placeholder="+91 9876543210" placeholderTextColor="#94A3B8" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          
          <Text style={styles.label}>What can we help you with? <Text style={{ color: '#ef4444' }}>*</Text></Text>
          <TouchableOpacity 
            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            onPress={() => setDropdownVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: rm(15), color: '#0F172A' }}>{issueType}</Text>
            <Text style={{ fontSize: rm(14), color: '#94A3B8' }}>▼</Text>
          </TouchableOpacity>

          {issueType === 'Order Issue' && (
            <View style={{ marginTop: rv(12) }}>
              <Text style={styles.label}>Order ID (Optional)</Text>
              <TextInput style={styles.input} placeholder="e.g. ORD-12345" placeholderTextColor="#94A3B8" value={orderId} onChangeText={setOrderId} autoCapitalize="characters" />
            </View>
          )}

          <Text style={[styles.label, { marginTop: rv(12) }]}>Message <Text style={{ color: '#ef4444' }}>*</Text></Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Please describe your requirements or the issue you are facing in detail..." placeholderTextColor="#94A3B8" multiline numberOfLines={4} textAlignVertical="top" value={message} onChangeText={setMessage} />
          
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={dropdownVisible} transparent animationType="fade" onRequestClose={() => setDropdownVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDropdownVisible(false)}>
          <View style={styles.dropdownMenu}>
            <Text style={styles.dropdownTitle}>Select Issue Type</Text>
            {ISSUE_TYPES.map((type, index) => (
              <TouchableOpacity
                key={type}
                style={[styles.dropdownItem, index === ISSUE_TYPES.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => {
                  setIssueType(type);
                  setDropdownVisible(false);
                }}
              >
                <Text style={[styles.dropdownItemText, issueType === type && { color: '#0c888d', fontWeight: '700' }]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  label: { fontSize: rm(13), fontWeight: '600', color: '#475569', marginBottom: rv(8), letterSpacing: 0.5 },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.md,
    paddingHorizontal: rv(16), paddingVertical: rv(14), fontSize: rm(15), color: '#0F172A', marginBottom: rv(16),
  },
  textArea: { height: rv(120) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dropdownMenu: { width: '85%', backgroundColor: '#fff', borderRadius: radius.xl, paddingVertical: rv(16), elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  dropdownTitle: { fontSize: rm(16), fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: rv(12) },
  dropdownItem: { paddingVertical: rv(14), paddingHorizontal: rs(20), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  submitBtn: { backgroundColor: '#0c888d', paddingVertical: rv(16), borderRadius: radius.md, alignItems: 'center', marginTop: rv(12) },
  submitText: { color: '#fff', fontSize: rm(16), fontWeight: '700', letterSpacing: 0.3 },
  complianceCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: rv(16),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  complianceHeader: {
    marginBottom: rv(8),
  },
  complianceBadge: {
    backgroundColor: '#EAF4F2',
    alignSelf: 'flex-start',
    paddingHorizontal: rs(10),
    paddingVertical: rv(3),
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#1F5C52',
  },
  complianceBadgeText: {
    fontSize: rm(9.5),
    fontWeight: '800',
    color: '#1F5C52',
    letterSpacing: 0.6,
  },
  complianceTitle: {
    fontSize: rm(17),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: rv(4),
  },
  complianceSub: {
    fontSize: rm(12),
    color: '#64748B',
    lineHeight: rv(17),
    marginBottom: rv(12),
  },
  complianceDetailRow: {
    flexDirection: 'row',
    marginBottom: rv(6),
  },
  complianceDetailLabel: {
    width: rs(70),
    fontSize: rm(12.5),
    fontWeight: '700',
    color: '#475569',
  },
  complianceDetailValue: {
    flex: 1,
    fontSize: rm(12.5),
    color: '#0F172A',
    lineHeight: rv(18),
  },
});