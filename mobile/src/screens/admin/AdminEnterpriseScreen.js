import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import { AlertService } from '../../services/AlertService';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

export default function AdminEnterpriseScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    enterpriseDisplayName: '',
    enterpriseLegalName: '',
    enterpriseEmail: '',
    enterprisePhone: '',
    enterpriseAddressStreet: '',
    enterpriseAddressCity: '',
    enterpriseAddressState: '',
    enterpriseAddressPincode: '',
    enterpriseGST: '',
    enterpriseDrugLicense: '',
    enterpriseFSSAI: '',
  });

  const loadSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const settings = res.data.data;
        const findVal = (key) => settings.find(s => s.key === key)?.value || '';
        
        setFormData({
          enterpriseDisplayName: findVal('enterpriseDisplayName'),
          enterpriseLegalName: findVal('enterpriseLegalName'),
          enterpriseEmail: findVal('enterpriseEmail'),
          enterprisePhone: findVal('enterprisePhone'),
          enterpriseAddressStreet: findVal('enterpriseAddressStreet'),
          enterpriseAddressCity: findVal('enterpriseAddressCity'),
          enterpriseAddressState: findVal('enterpriseAddressState'),
          enterpriseAddressPincode: findVal('enterpriseAddressPincode'),
          enterpriseGST: findVal('enterpriseGST'),
          enterpriseDrugLicense: findVal('enterpriseDrugLicense'),
          enterpriseFSSAI: findVal('enterpriseFSSAI'),
        });
      }
    } catch (err) {
      console.log('Error loading Enterprise settings:', err);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to load enterprise settings' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadSettings();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsPayload = Object.keys(formData).map(key => ({
        key,
        value: formData[key]
      }));

      const res = await api.put('/admin/settings', { settings: settingsPayload });
      if (res.data?.success) {
        AlertService.show({ type: 'success', title: 'Success', message: 'Enterprise profile saved successfully' });
      }
    } catch (err) {
      console.log('Error saving Enterprise settings:', err);
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to save enterprise profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enterprise Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1F5C52" />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1F5C52']} />}
        >
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>Enterprise Profile</Text>
            <Text style={styles.introDesc}>Manage your business information, GST, and legal details</Text>
          </View>

          {/* Business Details Section */}
          <Text style={styles.sectionHeader}>Business Details</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={formData.enterpriseDisplayName}
              onChangeText={(txt) => setFormData(prev => ({ ...prev, enterpriseDisplayName: txt }))}
              placeholder="e.g. DoseBox Pharmacy"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.label}>Legal Entity Name</Text>
            <TextInput
              style={styles.input}
              value={formData.enterpriseLegalName}
              onChangeText={(txt) => setFormData(prev => ({ ...prev, enterpriseLegalName: txt }))}
              placeholder="e.g. DoseBox Healthcare Pvt Ltd"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.label}>Contact Email</Text>
            <TextInput
              style={styles.input}
              value={formData.enterpriseEmail}
              onChangeText={(txt) => setFormData(prev => ({ ...prev, enterpriseEmail: txt }))}
              placeholder="support@dosebox.in"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.enterprisePhone}
              onChangeText={(txt) => setFormData(prev => ({ ...prev, enterprisePhone: txt }))}
              placeholder="+91 98765 43210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />
          </View>

          {/* Registered Address Section */}
          <Text style={styles.sectionHeader}>Registered Address</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.enterpriseAddressStreet}
              onChangeText={(txt) => setFormData(prev => ({ ...prev, enterpriseAddressStreet: txt }))}
              placeholder="Complete street address..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: rs(8) }}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  value={formData.enterpriseAddressCity}
                  onChangeText={(txt) => setFormData(prev => ({ ...prev, enterpriseAddressCity: txt }))}
                  placeholder="New Delhi"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ flex: 1, marginLeft: rs(8) }}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  value={formData.enterpriseAddressState}
                  onChangeText={(txt) => setFormData(prev => ({ ...prev, enterpriseAddressState: txt }))}
                  placeholder="Delhi"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              value={formData.enterpriseAddressPincode}
              onChangeText={(txt) => setFormData(prev => ({ ...prev, enterpriseAddressPincode: txt }))}
              placeholder="110001"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
          </View>

          {/* Legal & Compliance Section */}
          <Text style={styles.sectionHeader}>Legal & Compliance</Text>
          <View style={styles.card}>
            <Text style={styles.label}>GST Number</Text>
            <TextInput
              style={styles.input}
              value={formData.enterpriseGST}
              onChangeText={(txt) => setFormData(prev => ({ ...prev, enterpriseGST: txt }))}
              placeholder="e.g. 07AABCU9603R1ZX"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Drug License Number</Text>
            <TextInput
              style={styles.input}
              value={formData.enterpriseDrugLicense}
              onChangeText={(txt) => setFormData(prev => ({ ...prev, enterpriseDrugLicense: txt }))}
              placeholder="e.g. DL-12345"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
            />

            <Text style={styles.label}>FSSAI Number</Text>
            <TextInput
              style={styles.input}
              value={formData.enterpriseFSSAI}
              onChangeText={(txt) => setFormData(prev => ({ ...prev, enterpriseFSSAI: txt }))}
              placeholder="e.g. 10012011000123"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />

            <Text style={styles.complianceNote}>
              This information may be displayed on invoices, the public website footer, and official communications to ensure regulatory compliance.
            </Text>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
          <View style={{ height: rv(30) }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: rv(16), paddingBottom: rv(12),
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backButton: { padding: rv(4) },
  backIcon: { fontSize: rm(24), color: '#0F172A', fontWeight: '300' },
  headerTitle: { fontSize: rm(20), fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.md },
  
  introCard: { backgroundColor: '#1F5C52', borderRadius: radius.xl, padding: spacing.lg, marginBottom: rv(20) },
  introTitle: { fontSize: rm(20), fontWeight: '800', color: '#fff', marginBottom: rv(4) },
  introDesc: { fontSize: rm(13), color: '#E2F0ED', fontWeight: '500' },
  
  sectionHeader: { fontSize: rm(16), fontWeight: '700', color: '#475569', marginBottom: rv(10), marginTop: rv(10) },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, marginBottom: rv(20), elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 3 },
  label: { fontSize: rm(13), fontWeight: '600', color: '#475569', marginBottom: rv(6), marginTop: rv(12) },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: rv(12), fontSize: rm(15), color: '#0F172A' },
  textArea: { minHeight: rv(80), textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  complianceNote: { fontSize: rm(12), color: '#64748B', marginTop: rv(16), lineHeight: rv(18) },
  
  saveBtn: { backgroundColor: '#1F5C52', paddingVertical: rv(16), borderRadius: radius.md, alignItems: 'center', marginTop: rv(10), shadowColor: '#1F5C52', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: rm(16), fontWeight: '700' },
});
