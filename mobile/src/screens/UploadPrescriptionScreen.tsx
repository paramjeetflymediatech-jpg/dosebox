import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';

export default function UploadPrescriptionScreen({ navigation }: any) {
  const [fileSelected, setFileSelected] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Upload Prescription</Text>
          <Text style={styles.subtitle}>Upload an image or PDF of your valid prescription.</Text>
        </View>

        <View style={styles.uploadArea}>
          <View style={[styles.dropZone, fileSelected && styles.dropZoneSuccess]}>
            <Text style={styles.uploadIcon}>{fileSelected ? '✅' : '📄'}</Text>
            <Text style={styles.uploadText}>
              {fileSelected ? 'prescription_doc.pdf' : 'Tap to select file (PDF / Image)'}
            </Text>
            {!fileSelected && (
              <TouchableOpacity 
                style={styles.browseButton} 
                onPress={() => setFileSelected(true)}
              >
                <Text style={styles.browseButtonText}>Browse Files</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.footerContainer}>
          <TouchableOpacity 
            style={[styles.primaryButton, !fileSelected && styles.disabledButton]} 
            onPress={() => navigation.navigate('OrderTracking', { status: 'Pending Pharmacist Approval' })} 
            disabled={!fileSelected}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Continue to Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    marginBottom: 40,
  },
  backButton: {
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backIcon: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '300',
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '400',
    lineHeight: 24,
  },
  uploadArea: {
    flex: 1,
    justifyContent: 'center',
  },
  dropZone: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  dropZoneSuccess: {
    borderColor: '#134E4A',
    backgroundColor: '#f0fdf4',
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 24,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  browseButtonText: {
    color: '#0f172a',
    fontWeight: '500',
  },
  footerContainer: {
    paddingBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#134E4A',
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
