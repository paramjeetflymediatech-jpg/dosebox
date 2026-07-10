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

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
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

      // Step 2: Auto-login to get tokens (backend register doesn't return tokens)
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
        await AsyncStorage.setItem('refreshToken', loginData.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(loginData.user));
        navigation.replace('MainTabs');
      } else {
        // Account was created but auto-login failed — send to Login screen
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
              <Text style={styles.title}>Join Dosebox.</Text>
              <Text style={styles.subtitle}>Create your account.</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#cbd5e1"
                  value={name}
                  onChangeText={setName}
                />
              </View>

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
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleRegister}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.footerLink}>Sign in</Text>
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
  primaryButton: {
    backgroundColor: '#134E4A',
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20},
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

