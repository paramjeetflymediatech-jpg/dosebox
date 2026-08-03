import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import { AlertService } from '../../services/AlertService';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

export default function UserProfileEditScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: '',
    bloodGroup: '',
    height: '',
    weight: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/account/profile');
      if (res.data?.success) {
        const profile = res.data.data;
        setFormData({
          name: profile.name || '',
          phone: profile.phone || '',
          age: profile.age ? String(profile.age) : '',
          gender: profile.gender || '',
          bloodGroup: profile.bloodGroup || '',
          height: profile.height ? String(profile.height) : '',
          weight: profile.weight ? String(profile.weight) : '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      AlertService.show({
        type: 'error',
        title: 'Error',
        message: 'Failed to load profile details'
      });
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim().replace(/\D/g, ''))) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }

    if (formData.age && (isNaN(formData.age) || Number(formData.age) <= 0 || Number(formData.age) > 120)) {
      newErrors.age = 'Invalid age';
    }

    if (formData.height && (isNaN(formData.height) || Number(formData.height) <= 0)) {
      newErrors.height = 'Invalid height';
    }

    if (formData.weight && (isNaN(formData.weight) || Number(formData.weight) <= 0)) {
      newErrors.weight = 'Invalid weight';
    }

    const bloodGroupRegex = /^(A|B|AB|O)[+-]$/i;
    if (formData.bloodGroup && !bloodGroupRegex.test(formData.bloodGroup.trim())) {
      newErrors.bloodGroup = 'E.g. A+, O-, B+';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      AlertService.show({
        type: 'warning',
        // title: 'Validation Error',
        message: 'Please check the errors highlighted in red.'
      });
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/account/profile', formData);
      if (res.data?.success) {
        // Update local storage user info
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          await AsyncStorage.setItem('user', JSON.stringify({ ...user, ...res.data.data }));
        }
        AlertService.show({
          type: 'success',
          title: 'Success',
          message: 'Profile updated successfully',
          buttons: [{ text: 'OK', onPress: () => navigation.goBack() }]
        });
      } else {
        AlertService.show({
          type: 'error',
          title: 'Error',
          message: res.data?.message || 'Failed to update profile'
        });
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      AlertService.show({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while updating your profile'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{top:16, bottom:16, left:16, right:16}}>
          <Ionicons name="arrow-back" size={rs(24)} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1F5C52" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Basic Details</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                  <Ionicons name="person-outline" size={rm(20)} color={errors.name ? "#EF4444" : "#94A3B8"} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => { setFormData({ ...formData, name: text }); setErrors({ ...errors, name: null }); }}
                    placeholder="Enter your full name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                  <Ionicons name="call-outline" size={rm(20)} color={errors.phone ? "#EF4444" : "#94A3B8"} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(text) => { setFormData({ ...formData, phone: text }); setErrors({ ...errors, phone: null }); }}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                  />
                </View>
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Physical Attributes</Text>
              
              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: rs(8) }]}>
                  <Text style={styles.label}>Age</Text>
                  <View style={[styles.inputContainer, errors.age && styles.inputError]}>
                    <Ionicons name="calendar-outline" size={rm(20)} color={errors.age ? "#EF4444" : "#94A3B8"} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.age}
                      onChangeText={(text) => { setFormData({ ...formData, age: text }); setErrors({ ...errors, age: null }); }}
                      placeholder="e.g. 28"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                    />
                  </View>
                  {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: rs(8) }]}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="male-female-outline" size={rm(20)} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.gender}
                      onChangeText={(text) => setFormData({ ...formData, gender: text })}
                      placeholder="Male/Female"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: rs(8) }]}>
                  <Text style={styles.label}>Height (cm)</Text>
                  <View style={[styles.inputContainer, errors.height && styles.inputError]}>
                    <Ionicons name="body-outline" size={rm(20)} color={errors.height ? "#EF4444" : "#94A3B8"} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.height}
                      onChangeText={(text) => { setFormData({ ...formData, height: text }); setErrors({ ...errors, height: null }); }}
                      placeholder="e.g. 175"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                    />
                  </View>
                  {errors.height && <Text style={styles.errorText}>{errors.height}</Text>}
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: rs(8) }]}>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <View style={[styles.inputContainer, errors.weight && styles.inputError]}>
                    <Ionicons name="barbell-outline" size={rm(20)} color={errors.weight ? "#EF4444" : "#94A3B8"} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.weight}
                      onChangeText={(text) => { setFormData({ ...formData, weight: text }); setErrors({ ...errors, weight: null }); }}
                      placeholder="e.g. 70"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                    />
                  </View>
                  {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Blood Group</Text>
                <View style={[styles.inputContainer, errors.bloodGroup && styles.inputError]}>
                  <Ionicons name="water-outline" size={rm(20)} color={errors.bloodGroup ? "#EF4444" : "#94A3B8"} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.bloodGroup}
                    onChangeText={(text) => { setFormData({ ...formData, bloodGroup: text }); setErrors({ ...errors, bloodGroup: null }); }}
                    placeholder="e.g. O+"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                {errors.bloodGroup && <Text style={styles.errorText}>{errors.bloodGroup}</Text>}
              </View>
            </View>

          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {!loading && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={handleSave} 
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  backBtn: { 
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  scrollContent: { padding: spacing.md, paddingBottom: rv(100) },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: rv(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: rm(16),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: rv(16),
  },
  formGroup: { marginBottom: rv(16) },
  label: { fontSize: rm(13), fontWeight: '600', color: '#64748B', marginBottom: rv(6) },
  required: { color: '#EF4444' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    paddingHorizontal: rv(12),
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: rs(8),
  },
  input: {
    flex: 1,
    paddingVertical: rv(14),
    fontSize: rm(15),
    color: '#0F172A',
  },
  errorText: {
    color: '#EF4444',
    fontSize: rm(12),
    marginTop: rv(4),
    marginLeft: rs(4),
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  footer: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveBtn: {
    backgroundColor: '#1F5C52',
    paddingVertical: rv(16),
    borderRadius: radius.md,
    alignItems: 'center',
    shadowColor: '#1F5C52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: rm(16) },
});
