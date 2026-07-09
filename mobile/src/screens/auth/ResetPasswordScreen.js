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

export default function ResetPasswordScreen({ navigation, route }) {
  const { email, otp } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { email, otp, password });
      const data = response.data;

      if (data.success) {
        Alert.alert(
          'Success', 
          'Your password has been reset successfully. Please log in with your new password.',
          [{ text: 'Log In', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
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
              <Text style={styles.title}>New Password</Text>
              <Text style={styles.subtitle}>Create a strong password for your Dosebox account.</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#cbd5e1"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#cbd5e1"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} 
                onPress={handleResetPassword} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Reset Password</Text>
                )}
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
    fontSize: 16,
    color: palette.ink},
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
    letterSpacing: 0.5}});
