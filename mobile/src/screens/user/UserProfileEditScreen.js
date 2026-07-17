import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
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
          height: profile.height || '',
          weight: profile.weight || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      Alert.alert('Error', 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/account/profile', formData);
      if (res.data?.success) {
        Alert.alert('Success', 'Profile updated successfully');
        // Update local storage user info
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          await AsyncStorage.setItem('user', JSON.stringify({ ...user, ...res.data.data }));
        }
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      Alert.alert('Error', 'An error occurred while updating your profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{top:20, bottom:20, left:20, right:20}}>
          <Text style={styles.backIcon}>←</Text>
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
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter your full name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: rs(8) }]}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  value={formData.age}
                  onChangeText={(text) => setFormData({ ...formData, age: text })}
                  placeholder="e.g. 28"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: rs(8) }]}>
                <Text style={styles.label}>Gender</Text>
                <TextInput
                  style={styles.input}
                  value={formData.gender}
                  onChangeText={(text) => setFormData({ ...formData, gender: text })}
                  placeholder="Male / Female"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: rs(8) }]}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.height}
                  onChangeText={(text) => setFormData({ ...formData, height: text })}
                  placeholder="e.g. 175"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: rs(8) }]}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.weight}
                  onChangeText={(text) => setFormData({ ...formData, weight: text })}
                  placeholder="e.g. 70"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Blood Group</Text>
              <TextInput
                style={styles.input}
                value={formData.bloodGroup}
                onChangeText={(text) => setFormData({ ...formData, bloodGroup: text })}
                placeholder="e.g. O+"
              />
            </View>

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
          </ScrollView>
        )}
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
    paddingTop: rv(16),
    paddingBottom: rv(12),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { marginRight: rs(16), padding: rs(4) },
  backIcon: { fontSize: rm(24), color: '#0F172A', fontWeight: '400' },
  headerTitle: { fontSize: rm(20), fontWeight: '700', color: '#0F172A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  scrollContent: { padding: spacing.xl, paddingBottom: rv(100) },
  formGroup: { marginBottom: rv(20) },
  label: { fontSize: rm(14), fontWeight: '600', color: '#475569', marginBottom: rv(8) },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    paddingHorizontal: rv(16),
    paddingVertical: rv(14),
    fontSize: rm(15),
    color: '#0F172A',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: {
    backgroundColor: '#1F5C52',
    paddingVertical: rv(16),
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: rv(12),
    shadowColor: '#1F5C52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: rm(16) },
});
