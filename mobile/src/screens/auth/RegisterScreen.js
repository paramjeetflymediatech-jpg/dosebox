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

export default function RegisterScreen({ navigation }) {
  const [authMode, setAuthMode] = useState('signup'); // 'signup' or 'login'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields (First Name, Last Name, Email, Password)');
      return;
    }

    setLoading(true);
    try {
      const name = `${firstName.trim()} ${lastName.trim()}`;
      // Step 1: Create the account
      const registerResponse = await api.post('/auth/register', {
        name,
        email,
        password,
      });

      if (!registerResponse.data.success) {
        Alert.alert('Registration Failed', registerResponse.data.message || 'Could not create account');
        return;
      }

      // Step 2: Auto-login to get tokens
      const loginResponse = await api.post('/auth/login', {
        email,
        password,
        device_platform: Platform.OS,
        device_id: 'device_' + Math.random().toString(36).substring(7),
        app_version: '0.0.1',
      });

      const loginData = loginResponse.data;

      if (loginData.success) {
        await AsyncStorage.setItem('accessToken', loginData.accessToken);
        if (loginData.refreshToken) await AsyncStorage.setItem('refreshToken', loginData.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(loginData.user));
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Account Created!', 'Your account is ready. Please sign in.', [
          { text: 'Sign In', onPress: () => navigation.replace('Login') },
        ]);
      }
    } catch (error) {
      console.error('Register error:', error);
      const message = error?.response?.data?.message || 'Could not connect to the server.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (mode) => {
    if (mode === 'login') {
      navigation.navigate('Login');
    } else {
      setAuthMode('signup');
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
            <Text style={styles.title}>Get Started Now</Text>
            <Text style={styles.subtitle}>Create an account or log in to explore about our app</Text>
          </View>

          {/* TOGGLE SWITCH */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleBtn, authMode === 'login' && styles.toggleBtnActive]}
              onPress={() => handleToggle('login')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, authMode === 'login' && styles.toggleTextActive]}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, authMode === 'signup' && styles.toggleBtnActive]}
              onPress={() => handleToggle('signup')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, authMode === 'signup' && styles.toggleTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            {/* ROW: FIRST NAME / LAST NAME */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: rs(10) }]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  placeholderTextColor="#9ca3af"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: rs(10) }]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor="#9ca3af"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            {/* EMAIL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
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


            {/* PHONE NUMBER */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 9876543210"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Set Password</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: rs(4) }}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleRegister}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or Sign Up With</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin} disabled={loading}>
                <Image source={require('../../assets/images/google-logo.png')} style={{ width: 22, height: 22 }} resizeMode="contain" />
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.footerLink}>Log In</Text>
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
    textAlign: 'center',
    paddingHorizontal: rs(20),
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
    backgroundColor: COLORS.primary, // Using DoseBox Teal
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: rs(30),
    paddingHorizontal: rs(20),
  },
  inputFlex: {
    flex: 1,
    paddingVertical: rv(16),
    fontSize: rm(15),
    color: '#111827',
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
    marginTop: rv(12),
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
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: rv(32),
  },
  footerText: {
    fontSize: rm(14),
    color: '#6b7280',
  },
  footerLink: {
    fontSize: rm(14),
    fontWeight: '700',
    color: COLORS.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: rv(24),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: rs(16),
    fontSize: rm(13),
    color: '#9ca3af',
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: rs(16),
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rv(12),
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: rs(12),
    backgroundColor: '#fff',
  },
  socialText: {
    marginLeft: rs(8),
    fontSize: rm(14),
    fontWeight: '600',
    color: '#374151',
  },
});
