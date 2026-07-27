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
        {/* <View style={styles.infoCards}>
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
        </View> */}

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
  dropdownItemText: { fontSize: rm(15), color: '#475569' },
  submitBtn: { backgroundColor: '#0c888d', paddingVertical: rv(16), borderRadius: radius.md, alignItems: 'center', marginTop: rv(12) },
  submitText: { color: '#fff', fontSize: rm(16), fontWeight: '700', letterSpacing: 0.3 },
});