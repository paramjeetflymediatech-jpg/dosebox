import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';

import { COLORS, FONTS } from '../../utils/theme';
import { rs, rv, rm } from '../../utils/responsive';

export default function VerifyOtpScreen({ navigation, route }) {
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      const data = response.data;

      if (data.success) {
        navigation.navigate('ResetPassword', { email, otp });
      } else {
        Alert.alert('Error', data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      const data = response.data;
      if (data.success) {
        if (data._dev_otp) {
            Alert.alert('DEV MODE', `A new OTP has been sent: ${data._dev_otp}`);
        } else {
            Alert.alert('Success', 'A new OTP has been sent to your email.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Verification Code</Text>
            <Text style={styles.subtitle}>Enter the verification code we've sent to your{'\n'}<Text style={styles.highlightText}>{email}</Text></Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>OTP Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit code"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} 
              onPress={handleVerifyOtp} 
              disabled={loading}
              activeOpacity={0.8}
            >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Confirm</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResendOtp}>
              <Text style={styles.resendLink}>Resend</Text>
            </TouchableOpacity>
          </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFB',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: rs(24),
    paddingTop: rv(20),
    paddingBottom: rv(40),
  },
  backButton: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rv(20),
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: rv(32),
  },
  title: {
    fontSize: rm(26),
    fontWeight: '800',
    color: '#111827',
    marginBottom: rv(8),
  },
  subtitle: {
    fontSize: rm(14),
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: rv(22),
  },
  highlightText: {
    color: '#111827',
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: rv(20),
  },
  label: {
    fontSize: rm(13),
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: rv(8),
    marginLeft: rs(4),
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: rs(30),
    paddingVertical: rv(16),
    paddingHorizontal: rs(20),
    fontSize: rm(15),
    color: '#111827',
    textAlign: 'center',
    letterSpacing: 4,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: rv(18),
    borderRadius: rs(30),
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: rv(32),
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: rm(16),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    color: '#6b7280',
    fontSize: rm(14),
    fontWeight: '500',
  },
  resendLink: {
    color: COLORS.primary,
    fontSize: rm(14),
    fontWeight: '700',
  },
});
