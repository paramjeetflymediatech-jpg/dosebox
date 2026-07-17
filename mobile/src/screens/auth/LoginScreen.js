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
  Image,
} from 'react-native';
import { useEffect } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import { COLORS, FONTS } from '../../utils/theme';
import { rs, rv, rm } from '../../utils/responsive';

export default function LoginScreen({ navigation }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '73308780119-l6f0l7j1qttf8hdcrfjlbvurlst034un.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const user = userInfo.user;

      setLoading(true);
      const payload = {
        googleId: user.id,
        email: user.email,
        name: user.name,
        avatar: user.photo,
        device_platform: Platform.OS,
        device_id: 'device_' + Math.random().toString(36).substring(7),
        app_version: '0.0.1'
      };

      const response = await api.post('/auth/google', payload);
      const data = response.data;

      if (data.success) {
        await AsyncStorage.setItem('accessToken', data.accessToken || '');
        if (data.refreshToken) {
          await AsyncStorage.setItem('refreshToken', data.refreshToken);
        }
        if (data.user) {
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
        }

        const userRole = data.user?.role?.toLowerCase() || '';
        if (userRole === 'admin' || userRole.includes('admin') || userRole === 'super_admin' || userRole === 'super admin') {
          navigation.replace('AdminTabs');
        } else {
          navigation.replace('MainTabs');
        }
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid Google credentials');
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Play services not available or outdated.');
      } else {
        console.error('Google Sign-In error:', error);
        Alert.alert('Google Sign-In Error', 'Failed to complete Google Login. Ensure your native app credentials (SHA-1) are configured in the Google Cloud Console.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email,
        password,
        device_platform: Platform.OS,
        device_id: 'device_' + Math.random().toString(36).substring(7),
        app_version: '0.0.1'
      };

      const response = await api.post('/auth/login', payload);
      const data = response.data;

      if (data.success) {
        await AsyncStorage.setItem('accessToken', data.accessToken || '');
        if (data.refreshToken) {
          await AsyncStorage.setItem('refreshToken', data.refreshToken);
        }
        if (data.user) {
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
        }

        const userRole = data.user?.role?.toLowerCase() || '';
        if (userRole === 'admin' || userRole.includes('admin') || userRole === 'super_admin' || userRole === 'super admin') {
          navigation.replace('AdminTabs');
        } else {
          navigation.replace('MainTabs');
        }
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Network Error', 'Could not connect to the server. Check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('GuestTabs', { screen: 'HomeTab' })} 
            style={styles.backButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to access your account</Text>
          </View>

          {/* TOGGLE SWITCH */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleBtn, authMode === 'login' && styles.toggleBtnActive]}
              onPress={() => setAuthMode('login')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, authMode === 'login' && styles.toggleTextActive]}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn]}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity style={styles.checkboxRow} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.optionText}>Remember me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>Forget password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or Sign In With</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin} disabled={loading}>
                <Image source={require('../../assets/images/google-logo.png')} style={{ width: 22, height: 22 }} resizeMode="contain" />
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
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
    paddingTop: rv(20), // Adjusted top padding for back button
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
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: rs(30),
    padding: rs(4),
    marginBottom: rv(32),
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: rv(14),
    borderRadius: rs(26),
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleText: {
    fontSize: rm(14),
    fontWeight: '600',
    color: '#6b7280',
  },
  toggleTextActive: {
    color: '#fff',
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
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: rs(30),
    paddingHorizontal: rs(20),
  },
  passwordInput: {
    flex: 1,
    paddingVertical: rv(16),
    fontSize: rm(15),
    color: '#111827',
  },
  eyeIcon: {
    padding: rs(5),
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rv(32),
    paddingHorizontal: rs(4),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: rs(20),
    height: rs(20),
    borderRadius: rs(6),
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rs(8),
    backgroundColor: '#fff',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: rm(13),
    color: '#4b5563',
    fontWeight: '600',
  },
  forgotText: {
    fontSize: rm(13),
    color: '#4b5563',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: COLORS.primary, // Using DoseBox Teal
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rv(24),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: rs(16),
    color: '#9ca3af',
    fontSize: rm(12),
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: rs(16),
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: rv(14),
    borderRadius: rs(30),
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: rs(8),
  },
  socialText: {
    fontSize: rm(14),
    fontWeight: '600',
    color: '#4b5563',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: rv(32),
  },
  footerText: {
    color: '#6b7280',
    fontSize: rm(14),
    fontWeight: '500',
  },
  footerLink: {
    color: COLORS.primary, // Using DoseBox Teal
    fontSize: rm(14),
    fontWeight: '700',
  },
});
