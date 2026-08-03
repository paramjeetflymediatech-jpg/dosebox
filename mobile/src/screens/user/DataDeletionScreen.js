import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

export default function DataDeletionScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email || !reason) {
      alert('Please fill out all fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/data-deletion', { email, reason });
      if (res.data?.success) {
        setSuccess(true);
      } else {
        alert(res.data?.message || 'Failed to submit request.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnHome = async () => {
    // Optionally log them out since they are deleting their account
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'GuestTabs' }],
      })
    );
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{top:16, bottom:16, left:16, right:16}}>
            <Ionicons name="arrow-back" size={rs(24)} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <View style={styles.successContainer}>
          <View style={styles.successIconBox}>
            <Ionicons name="checkmark-circle" size={rs(48)} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Request Submitted Successfully</Text>
          <Text style={styles.successText}>
            We have received your data deletion request. Our support team will process it and remove your personal information in accordance with our privacy policy.
          </Text>
          <TouchableOpacity style={styles.returnButton} onPress={handleReturnHome}>
            <Text style={styles.returnButtonText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{top:16, bottom:16, left:16, right:16}}>
            <Ionicons name="arrow-back" size={rs(24)} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Deletion</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle" size={rs(24)} color="#DC2626" />
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>Permanent Action Warning</Text>
              <Text style={styles.warningText}>
                This action is permanent and cannot be undone. Once processed, all your personal data, order history, and account details will be irreversibly removed.
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Email Address <Text style={styles.asterisk}>*</Text></Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={rs(20)} color="#94A3B8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Enter your registered email"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reason for Deletion <Text style={styles.asterisk}>*</Text></Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <Ionicons name="document-text-outline" size={rs(20)} color="#94A3B8" style={[styles.inputIcon, { marginTop: rv(12) }]} />
              <TextInput 
                style={[styles.input, styles.textArea]}
                placeholder="Please tell us why you are leaving..."
                placeholderTextColor="#94A3B8"
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={rs(20)} color="#fff" />
                <Text style={styles.submitButtonText}>Confirm Deletion Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: rv(12),
    backgroundColor: '#F8FAFC',
  },
  backButton: { 
    width: rs(40), 
    height: rs(40), 
    borderRadius: 999, 
    backgroundColor: '#FFFFFF', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: rs(12), 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2 
  },
  headerTitle: { 
    flex: 1, 
    fontSize: rm(22), 
    fontWeight: '800', 
    color: '#0F172A', 
    letterSpacing: -0.5 
  },
  content: { padding: spacing.md, paddingBottom: rv(40) },
  
  warningBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: rv(24),
    gap: spacing.sm,
  },
  warningTextContainer: { flex: 1 },
  warningTitle: { fontSize: rm(15), fontWeight: '700', color: '#991B1B', marginBottom: rv(4) },
  warningText: { fontSize: rm(13), color: '#B91C1C', lineHeight: rv(18) },

  inputGroup: { marginBottom: rv(20) },
  label: { fontSize: rm(14), fontWeight: '600', color: '#334155', marginBottom: rv(8) },
  asterisk: { color: '#EF4444' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
  },
  inputIcon: { marginRight: spacing.xs },
  input: {
    flex: 1,
    height: rv(48),
    fontSize: rm(15),
    color: '#0F172A',
  },
  textAreaContainer: { alignItems: 'flex-start' },
  textArea: {
    height: rv(100),
    paddingTop: rv(12),
  },

  footer: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  submitButton: {
    backgroundColor: '#E11D48',
    height: rv(52),
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#fff', fontSize: rm(16), fontWeight: '700' },

  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  successIconBox: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rv(24),
  },
  successTitle: { fontSize: rm(20), fontWeight: '800', color: '#0F172A', marginBottom: rv(12), textAlign: 'center' },
  successText: { fontSize: rm(14), color: '#64748B', textAlign: 'center', lineHeight: rv(22), marginBottom: rv(32) },
  returnButton: {
    backgroundColor: '#0F172A',
    paddingVertical: rv(14),
    paddingHorizontal: rs(32),
    borderRadius: radius.lg,
  },
  returnButtonText: { color: '#fff', fontSize: rm(16), fontWeight: '600' },
});
