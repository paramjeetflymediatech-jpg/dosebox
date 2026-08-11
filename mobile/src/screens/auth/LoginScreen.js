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
import { appleAuth, appleAuthAndroid } from '@invertase/react-native-apple-authentication';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import { AlertService } from '../../services/AlertService';
import { COLORS, FONTS } from '../../utils/theme';
import { rs, rv, rm } from '../../utils/responsive';

export default function LoginScreen({ navigation, route }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // UI Error States
  const [generalError, setGeneralError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId: '680555726982-unss1uvmtplpbe0bgs68uqmtkcrphbi6.apps.googleusercontent.com',
        iosClientId: '680555726982-6h74ml3b6pnc9d6m0ph3ffrnbsv5485m.apps.googleusercontent.com',
        offlineAccess: true,
      });
    } catch (e) {
      console.log('GoogleSignin configure skipped:', e);
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      try { await GoogleSignin.signOut(); } catch (e) { } // Force account picker
      const userInfo = await GoogleSignin.signIn();

      if (userInfo.type === 'cancelled') {
        return;
      }

      const user = userInfo.data ? userInfo.data.user : userInfo.user;
      if (!user) {
        throw new Error('Unable to retrieve user data from Google');
      }

      setLoading(true);
      const fcmToken = await AsyncStorage.getItem('fcmToken');
      const payload = {
        googleId: user.id,
        email: user.email,
        name: user.name,
        avatar: user.photo,
        device_platform: Platform.OS,
        device_id: 'device_' + Math.random().toString(36).substring(7),
        push_token: fcmToken || '',
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

        const returnTo = route.params?.returnTo;
        const userRole = data.user?.role?.toLowerCase() || '';
        if (returnTo) {
          navigation.replace(returnTo);
        } else if (userRole === 'admin' || userRole.includes('admin') || userRole === 'super_admin' || userRole === 'super admin') {
          navigation.replace('AdminTabs');
        } else if (userRole === 'medico') {
          navigation.replace('MedicoTabs');
        } else if (userRole === 'leadership') {
          navigation.replace('LeadershipTabs');
        } else {
          navigation.replace('MainTabs');
        }
      } else {
        AlertService.show({ type: 'error', title: 'Login Failed', message: data.message || 'Invalid Google credentials' });
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        AlertService.show({ type: 'error', title: 'Error', message: 'Play services not available or outdated.' });
      } else {
        console.error('Google Sign-In error:', error);
        const errMsg = error?.message || error?.code || JSON.stringify(error) || 'Failed to complete Google Login.';
        AlertService.show({ type: 'error', title: 'Google Sign-In Error', message: `Failed to complete Google Login: ${errMsg}` });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      const fcmToken = await AsyncStorage.getItem('fcmToken');

      if (Platform.OS === 'ios') {
        if (!appleAuth.isSupported) {
          AlertService.show({
            type: 'info',
            title: 'Apple Sign-In',
            message: 'Apple Sign-In is only supported on iOS devices (iOS 13+).',
          });
          return;
        }

        const appleAuthRequestResponse = await appleAuth.performRequest({
          requestedOperation: appleAuth.Operation.LOGIN,
          requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
        });

        const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);

        if (credentialState === appleAuth.State.AUTHORIZED) {
          const { user, email, fullName } = appleAuthRequestResponse;
          const name = fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : '';

          const payload = {
            appleId: user,
            email: email || '',
            name: name || 'Apple User',
            device_platform: Platform.OS,
            device_id: 'device_' + Math.random().toString(36).substring(7),
            push_token: fcmToken || '',
            app_version: '0.0.1'
          };

          const response = await api.post('/auth/apple', payload);
          const data = response.data;

          if (data.success) {
            await AsyncStorage.setItem('accessToken', data.accessToken || '');
            if (data.refreshToken) await AsyncStorage.setItem('refreshToken', data.refreshToken);
            if (data.user) await AsyncStorage.setItem('user', JSON.stringify(data.user));

            const returnTo = route.params?.returnTo;
            const userRole = data.user?.role?.toLowerCase() || '';
            if (returnTo) {
              navigation.replace(returnTo);
            } else if (userRole.includes('admin')) {
              navigation.replace('AdminTabs');
            } else if (userRole === 'medico') {
              navigation.replace('MedicoTabs');
            } else if (userRole === 'leadership') {
              navigation.replace('LeadershipTabs');
            } else {
              navigation.replace('MainTabs');
            }
          } else {
            AlertService.show({ type: 'error', title: 'Login Failed', message: data.message || 'Invalid Apple credentials' });
          }
        }
      } else {
        // Android Apple Sign-In via Web OAuth
        try {
          if (!appleAuthAndroid || !appleAuthAndroid.configure) {
            AlertService.show({
              type: 'info',
              title: 'Apple Sign-In',
              message: 'Apple Sign-In module requires rebuilding native Android app.',
            });
            return;
          }

          const responseType = appleAuthAndroid.ResponseType?.ALL || 'code id_token';
          const scope = appleAuthAndroid.Scope?.ALL || 'name email';

          appleAuthAndroid.configure({
            clientId: 'com.doseboxmobile.web',
            redirectUri: 'https://dosebox.in/api/auth/apple/callback',
            responseType,
            scope,
          });

          const response = await appleAuthAndroid.signIn();
          if (response && (response.id_token || response.code)) {
            const userObj = response.user;
            const name = userObj?.name ? `${userObj.name.firstName || ''} ${userObj.name.lastName || ''}`.trim() : 'Apple User';

            const payload = {
              appleId: response.code || response.id_token,
              email: userObj?.email || '',
              name: name || 'Apple User',
              device_platform: Platform.OS,
              device_id: 'device_' + Math.random().toString(36).substring(7),
              push_token: fcmToken || '',
              app_version: '0.0.1'
            };

            const apiRes = await api.post('/auth/apple', payload);
            const data = apiRes.data;

            if (data.success) {
              await AsyncStorage.setItem('accessToken', data.accessToken || '');
              if (data.refreshToken) await AsyncStorage.setItem('refreshToken', data.refreshToken);
              if (data.user) await AsyncStorage.setItem('user', JSON.stringify(data.user));

              const returnTo = route.params?.returnTo;
              const userRole = data.user?.role?.toLowerCase() || '';
              if (returnTo) {
                navigation.replace(returnTo);
              } else if (userRole.includes('admin')) {
                navigation.replace('AdminTabs');
              } else if (userRole === 'medico') {
                navigation.replace('MedicoTabs');
              } else if (userRole === 'leadership') {
                navigation.replace('LeadershipTabs');
              } else {
                navigation.replace('MainTabs');
              }
            } else {
              AlertService.show({ type: 'error', title: 'Login Failed', message: data.message || 'Invalid Apple credentials' });
            }
          }
        } catch (androidErr) {
          if (!androidErr?.message?.includes('E_SIGN_IN_CANCELLED')) {
            console.error('Android Apple Sign-In error:', androidErr);
            AlertService.show({ type: 'error', title: 'Apple Sign-In', message: androidErr.message || 'Failed to sign in with Apple.' });
          }
        }
      }
    } catch (error) {
      if (error.code !== appleAuth.Error.CANCELED) {
        console.error('Apple Sign-In error:', error);
        const errMsg = error.message || '';
        if (errMsg.includes('1000') || errMsg.includes('AuthorizationError')) {
          AlertService.show({
            type: 'error',
            title: 'Apple Sign-In Error',
            message: 'Apple Sign-In failed (Error 1000). Ensure an Apple ID is signed in under iOS Settings and Sign in with Apple capability is enabled.',
          });
        } else {
          AlertService.show({ type: 'error', title: 'Apple Sign-In Error', message: errMsg || 'Failed to complete Apple Login.' });
        }
      }
    } finally {
      setLoading(false);
    }
  };


  const handleLogin = async () => {
    setGeneralError('');
    setEmailError('');
    setPasswordError('');
    let hasError = false;

    if (!email) {
      setEmailError('Please enter your email');
      AlertService.show({ type: 'error', title: 'Invalid Email', message: 'Please enter your email address' });
      hasError = true;
    } else if (!password) {
      setPasswordError('Please enter your password');
      AlertService.show({ type: 'error', title: 'Missing Password', message: 'Please enter your password' });
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    try {
      const fcmToken = await AsyncStorage.getItem('fcmToken');
      const payload = {
        email: email.trim(),
        password,
        device_platform: Platform.OS,
        device_id: 'device_' + Math.random().toString(36).substring(7),
        push_token: fcmToken || '',
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

        const returnTo = route.params?.returnTo;
        const userRole = data.user?.role?.toLowerCase() || '';
        if (returnTo) {
          navigation.replace(returnTo);
        } else if (userRole === 'admin' || userRole.includes('admin') || userRole === 'super_admin' || userRole === 'super admin') {
          navigation.replace('AdminTabs');
        } else if (userRole === 'medico') {
          navigation.replace('MedicoTabs');
        } else if (userRole === 'leadership') {
          navigation.replace('LeadershipTabs');
        } else {
          navigation.replace('MainTabs');
        }
      } else {
        const msg = data.message?.toLowerCase() || '';
        if (msg.includes('not found')) {
          setEmailError('Account not found');
          AlertService.show({ type: 'error', title: 'Login Failed', message: 'Account not found. Please sign up.' });
        } else if (msg.includes('password') || msg.includes('credential')) {
          setPasswordError('Wrong password or invalid credentials');
          AlertService.show({ type: 'error', title: 'Login Failed', message: 'Wrong password or invalid credentials' });
        } else if (msg.includes('too many') || msg.includes('attempts')) {
          setGeneralError('Too many login attempts. Please try again later.');
          AlertService.show({ type: 'error', title: 'Locked', message: 'Too many login attempts. Please try again later.' });
        } else {
          setGeneralError(data.message || 'Invalid credentials');
          AlertService.show({ type: 'error', title: 'Login Failed', message: data.message || 'Invalid credentials' });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.status === 401) {
        setPasswordError('Wrong password or invalid credentials');
        AlertService.show({ type: 'error', title: 'Login Failed', message: 'Wrong password or invalid credentials' });
      } else if (error.response?.status === 404) {
        setEmailError('Account not found');
        AlertService.show({ type: 'error', title: 'Login Failed', message: 'Account not found. Please sign up.' });
      } else if (error.response?.status === 429) {
        setGeneralError('Too many login attempts. Please try again later.');
        AlertService.show({ type: 'error', title: 'Locked', message: 'Too many login attempts. Please try again later.' });
      } else {
        setGeneralError('Could not connect to the server. Check your network.');
        AlertService.show({ type: 'error', title: 'Network Error', message: 'Could not connect to the server. Check your network.' });
      }
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

          {generalError ? (
            <View style={styles.generalErrorBox}>
              <Ionicons name="warning" size={20} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={styles.generalErrorText}>{generalError}</Text>
            </View>
          ) : null}

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, emailError && styles.inputError]}
                placeholder="name@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(t) => { setEmail(t); setEmailError(''); }}
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.passwordContainer, passwordError && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
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
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.socialButton} onPress={handleAppleLogin} disabled={loading}>
                  <Ionicons name="logo-apple" size={22} color="#000" />
                  <Text style={styles.socialText}>Apple</Text>
                </TouchableOpacity>
              )}
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
    marginBottom: rv(12),
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
    paddingVertical: rv(12),
    paddingHorizontal: rs(20),
    fontSize: rm(15),
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: rm(12),
    marginTop: rv(6),
    marginLeft: rs(8),
  },
  generalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: rs(12),
    padding: rs(12),
    marginBottom: rv(20),
  },
  generalErrorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: rm(13),
    fontWeight: '500',
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
    paddingVertical: rv(12),
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
    paddingVertical: rv(14),
    borderRadius: rs(30),
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: rv(24),
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
    paddingVertical: rv(12),
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
