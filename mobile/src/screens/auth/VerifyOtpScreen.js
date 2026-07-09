import React, { useState } from 'react';
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
import api from '../../services/api';

const palette = {
  bg: '#F7F5EF',
  surface: '#FFFFFF',
  ink: '#122622',
  inkMuted: '#5B6F69',
  primary: '#1F5C52',
  primaryDark: '#123B34',
  accent: '#E3A857',
  line: '#DCE6E1'};

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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.contentWrapper}>
            <View style={styles.headerContainer}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={styles.backButton}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>We've sent a 6-digit verification code to {email}.</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor="#cbd5e1"
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
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendButton} onPress={handleResendOtp}>
                <Text style={styles.resendButtonText}>Didn't receive code? Resend</Text>
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
    backgroundColor: palette.bg},
  keyboardView: {
    flex: 1},
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24},
  contentWrapper: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center'},
  headerContainer: {
    marginBottom: 40},
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: palette.line},
  backIcon: {
    fontSize: 20,
    color: palette.ink},
  title: {
    fontSize: 36,
    color: palette.ink,
    marginBottom: 8,
    fontWeight: '700',
    letterSpacing: -1},
  subtitle: {
    fontSize: 16,
    color: palette.inkMuted,
    lineHeight: 24},
  formContainer: {
    gap: 20},
  inputGroup: {
    gap: 8},
  label: {
    fontSize: 14,
    color: palette.ink,
    fontWeight: '600'},
  input: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    color: palette.ink,
    letterSpacing: 4,
    textAlign: 'center'},
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 12},
  primaryButtonDisabled: {
    opacity: 0.7},
  primaryButtonText: {
    color: palette.surface,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5},
  resendButton: {
    alignItems: 'center',
    marginTop: 10},
  resendButtonText: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '600'}});
