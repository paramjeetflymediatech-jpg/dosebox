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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        device_platform: Platform.OS,
        device_id: 'device_' + Math.random().toString(36).substring(7),
        app_version: '0.0.1'
      });

      const data = response.data;

      if (data.success) {
        await AsyncStorage.setItem('accessToken', data.accessToken || '');
        if (data.refreshToken) {
          await AsyncStorage.setItem('refreshToken', data.refreshToken);
        }
        if (data.user) {
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Route based on user role (case insensitive)
        if (data.user && data.user.role?.toLowerCase() === 'admin') {
          navigation.replace('AdminTabs');
        } else {
          navigation.replace('MainTabs');
        }
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Network Error', 'Could not connect to the server. Check your network or API_URL.');
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
                onPress={() => navigation.navigate('Welcome')} 
                style={styles.backButton}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Welcome back.</Text>
              <Text style={styles.subtitle}>Enter your details to proceed.</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#cbd5e1"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity 
                style={styles.forgotPassword} 
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} 
                onPress={handleLogin} 
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>New to Dosebox? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.footerLink}>Create account</Text>
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
    backgroundColor: '#ffffff'},
  keyboardView: {
    flex: 1},
  scrollContent: {
    flexGrow: 1},
  contentWrapper: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 24},
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    marginBottom: 48},
  backButton: {
    marginBottom: 32,
    alignSelf: 'flex-start'},
  backIcon: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '300'},
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.5},
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '400'},
  formContainer: {
    flex: 1},
  inputGroup: {
    marginBottom: 28},
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5},
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '400'},
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 40},
  forgotPasswordText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500'},
  primaryButton: {
    backgroundColor: '#134E4A',
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center'},
  primaryButtonDisabled: {
    backgroundColor: '#94a3b8'},
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5},
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    paddingBottom: 20},
  footerText: {
    color: '#94a3b8',
    fontSize: 14},
  footerLink: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600'}});

