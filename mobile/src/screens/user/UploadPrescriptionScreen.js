import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ScanLine } from 'lucide-react-native';

export default function UploadPrescriptionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 100,
      duration: 3500,
      easing: Easing.linear,
      useNativeDriver: false, // Cannot animate text natively
    }).start(() => {
      // Auto-navigate after scan completes
      navigation.replace('OrderTracking', { status: 'Pending Pharmacist Approval' });
    });
  }, [progress, navigation]);

  const percentage = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 100],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Prescription</Text>
        <View style={{ width: 44 }} /> {/* Balancer for flex-between */}
      </View>

      {/* Document Scanner Area */}
      <View style={styles.scannerContainer}>
        <View style={styles.documentCard}>
          {/* Mock Document Content */}
          <View style={styles.docHeader}>
            <Text style={styles.docTitle}>MEDICAL CENTRE</Text>
            <Text style={styles.docSub}>824 14th Street</Text>
            <Text style={styles.docSub}>New York, NY 91745, USA</Text>
          </View>

          <View style={styles.docDivider} />

          <View style={styles.patientInfoRow}>
            <View>
              <Text style={styles.label}>NAME <Text style={styles.handwritten}>John Smith</Text></Text>
              <Text style={styles.label}>ADDRESS <Text style={styles.handwritten}>162 Example St, NY</Text></Text>
            </View>
            <View>
              <Text style={styles.label}>AGE <Text style={styles.handwritten}>34</Text></Text>
              <Text style={styles.label}>DATE <Text style={styles.handwritten}>09-11-23</Text></Text>
            </View>
          </View>

          <Text style={styles.rxSymbol}>Rx</Text>

          <View style={styles.prescriptionLines}>
            <Text style={styles.handwrittenLine}>Betaloc 100 mg - 1 tab BD</Text>
            <Text style={styles.handwrittenLine}>Dorzolamidum 10 mg - 1 tab BD</Text>
            <Text style={styles.handwrittenLineLight}>Cimetidine 50 mg - 2 tabs TDS</Text>
            <Text style={styles.handwrittenLineLight}>Enalapril 50mg - 1 tab OD</Text>
          </View>

          <View style={styles.signatureArea}>
            <Text style={styles.handwrittenSignature}>Dr. Steve Johnson</Text>
          </View>
        </View>
      </View>

      {/* Bottom Action Area */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.statusText}>
          Please wait a few second. We are analyzing{'\n'}the Prescription...
        </Text>

        <View style={styles.scanButton}>
          <View style={styles.scanButtonContent}>
            <ScanLine size={24} color="#ffffff" />
            <Text style={styles.scanButtonText}>Scanning</Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressCircle}>
            <Animated.Text style={styles.progressText}>
              {percentage.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              })}
            </Animated.Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#0F172A',
  },
  scannerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  documentCard: {
    width: '100%',
    aspectRatio: 0.65, // Proportions of a standard paper
    backgroundColor: '#ffffff',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
    transform: [{ rotateZ: '3deg' }], // Slight tilt for 3D realism
  },
  docHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 1,
  },
  docSub: {
    fontSize: 10,
    color: '#666',
  },
  docDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 12,
  },
  patientInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  handwritten: {
    fontFamily: Platform.OS === 'ios' ? 'Bradley Hand' : 'sans-serif-medium',
    fontSize: 14,
    color: '#1e3a8a',
    fontWeight: '400',
  },
  rxSymbol: {
    fontSize: 32,
    fontWeight: '300',
    color: '#333',
    marginBottom: 16,
  },
  prescriptionLines: {
    flex: 1,
  },
  handwrittenLine: {
    fontFamily: Platform.OS === 'ios' ? 'Bradley Hand' : 'sans-serif-medium',
    fontSize: 16,
    color: '#1e3a8a',
    marginBottom: 12,
  },
  handwrittenLineLight: {
    fontFamily: Platform.OS === 'ios' ? 'Bradley Hand' : 'sans-serif-medium',
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 12,
    opacity: 0.5,
  },
  signatureArea: {
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 4,
    marginTop: 20,
  },
  handwrittenSignature: {
    fontFamily: Platform.OS === 'ios' ? 'Bradley Hand' : 'sans-serif-medium',
    fontSize: 18,
    color: '#94a3b8',
    opacity: 0.6,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  statusText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: '#34D399', // Bright teal/green
    borderRadius: 100, // Pill shape
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});

