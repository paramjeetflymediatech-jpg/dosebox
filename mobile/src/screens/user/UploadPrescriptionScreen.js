import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Image,
  ScrollView
} from 'react-native';
import { AlertService } from '../../services/AlertService';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import PermissionsService from '../../services/PermissionsService';

export default function UploadPrescriptionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [scanLineAnim] = useState(new Animated.Value(0));
  const [progress] = useState(new Animated.Value(0));
  const [imageUri, setImageUri] = useState(null);
  const [imageType, setImageType] = useState(null);
  const [imageName, setImageName] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  
  const { addToCart } = useCart();

  const pickImage = async () => {
    const hasPermission = await PermissionsService.requestCameraAndGalleryPermission();
    if (!hasPermission) return;

    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.didCancel) return;
      if (response.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri);
        setImageType(response.assets[0].type || 'image/jpeg');
        setImageName(response.assets[0].fileName || 'upload.jpg');
        setResult(null); // Reset if picking a new image
      }
    });
  };

  const startScan = async () => {
    setIsScanning(true);
    
    // Animate progress circle artificially
    Animated.timing(progress, {
      toValue: 90,
      duration: 10000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Loop scan line
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
      ])
    ).start();

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        type: imageType,
        name: imageName,
      });

      const res = await api.post('/prescriptions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data && res.data.success) {
        setResult(res.data.data);
      } else {
        AlertService.show({
          type: 'error',
          title: 'Upload Failed',
          message: res.data?.message || 'Something went wrong'
        });
      }
    } catch (error) {
      console.error('Upload Error:', error);
      if (error.response && error.response.status === 401) {
        AlertService.show({
          type: 'error',
          title: 'Login Required',
          message: 'You need to be logged in to upload a prescription.',
          buttons: [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Login', 
              onPress: () => navigation.navigate('Login') 
            }
          ]
        });
      } else {
        AlertService.show({
          type: 'error',
          title: 'Error',
          message: 'Failed to upload prescription. Please try again.'
        });
      }
    } finally {
      setIsScanning(false);
      scanLineAnim.stopAnimation();
      progress.stopAnimation();
      progress.setValue(0);
    }
  };

  const handleAddToCart = () => {
    if (!result || !result.medicines) return;
    let addedCount = 0;

    result.medicines.forEach((medItem) => {
      const product = medItem.product || (medItem.variants && medItem.variants[0]);
      if (product) {
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price || 0,
          discountPrice: product.discountPrice || product.price,
          image: product.images?.[0] || '',
          qty: 1, // Will be handled by cart context
          prescriptionRequired: product.requiresPrescription || false,
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      AlertService.show({
        type: 'success',
        title: 'Added to Cart',
        message: `Added ${addedCount} verified generic(s) to cart!`
      });
      navigation.replace('CartCheckout');
    } else {
      AlertService.show({
        type: 'info',
        title: 'Notice',
        message: 'No verified generics found to add.'
      });
    }
  };

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
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Prescription</Text>
        <View style={{ width: 44 }} />
      </View>

      {!imageUri ? (
        <View style={styles.uploadContainer}>
          <Text style={styles.instructionsText}>
            Upload your prescription. Our medical OCR matches the ingredients directly to generic alternatives.
          </Text>
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage} activeOpacity={0.8}>
            <View style={styles.iconCircle}>
              <Ionicons name="cloud-upload-outline" size={32} color="#0D9488" />
            </View>
            <Text style={styles.uploadText}>Tap to select prescription</Text>
            <Text style={styles.uploadSubText}>Supports JPG, PNG (Max 10MB)</Text>
          </TouchableOpacity>
          
          <View style={styles.privacyBox}>
            <Ionicons name="shield-checkmark" size={20} color="#0D9488" />
            <Text style={styles.privacyText}>
              <Text style={{fontWeight: '700'}}>100% Privacy Ensured:</Text> Encrypted end-to-end data transfer.
            </Text>
          </View>
        </View>
      ) : result && result.status === 'Manual Review' ? (
        <View style={styles.uploadContainer}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="time-outline" size={64} color="#F59E0B" style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' }}>Review Pending</Text>
            <Text style={{ fontSize: 16, color: '#64748B', textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
              Your prescription has been uploaded successfully! Our AI could not automatically extract all the details, so a pharmacist will manually review it shortly.
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#1F5C52', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 999 }} 
              onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : result && result.medicines && result.medicines.length > 0 ? (
        <ScrollView style={styles.resultContainer} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
          <View style={styles.successHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, width: '100%' }}>
              <Image source={{ uri: imageUri }} style={{ width: 60, height: 80, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }} resizeMode="cover" />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="checkmark-circle" size={24} color="#0D9488" />
                  <Text style={[styles.resultTitle, { marginTop: 0, textAlign: 'left' }]}>Parsed Successfully</Text>
                </View>
                {result.metadata?.patientName && (
                   <Text style={[styles.resultSubtitle, { textAlign: 'left' }]}>Patient: {result.metadata.patientName}</Text>
                )}
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Medicine Formula Matches</Text>
          {result.medicines.map((med, idx) => {
            const product = med.product || (med.variants && med.variants[0]);
            if (!product) return null;
            return (
              <View key={idx} style={styles.medCard}>
                 <View style={styles.extractedRow}>
                   <View style={styles.brandBadge}>
                     <Text style={styles.brandBadgeText}>Handwritten Brand</Text>
                   </View>
                   <Text style={styles.extractedText}>"{med.extracted?.medicineName || 'Unknown'} {med.extracted?.strength || ''}"</Text>
                 </View>
                 <View style={styles.matchRow}>
                   <Ionicons name="return-down-forward" size={24} color="#0D9488" style={{marginTop: 4, marginRight: 12}} />
                   <View style={styles.matchDetails}>
                     <Text style={styles.productName}>{product.name}</Text>
                     <View style={styles.priceRow}>
                        <Text style={styles.doseboxPrice}>₹{product.discountPrice || product.price}</Text>
                        {product.price && product.discountPrice < product.price && (
                          <Text style={styles.marketPrice}>₹{product.price}</Text>
                        )}
                     </View>
                   </View>
                 </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <>
          <View style={styles.scannerContainer}>
            <View style={[styles.documentCard, { overflow: 'hidden' }]}>
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%', borderRadius: 32 }} resizeMode="contain" />
              
              {isScanning && <View style={styles.scanningOverlay} />}
              {isScanning && (
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 150,
                      backgroundColor: 'rgba(52, 211, 153, 0.25)',
                      borderBottomWidth: 4,
                      borderBottomColor: '#10B981',
                      shadowColor: '#10B981',
                      shadowOffset: { width: 0, height: 10 },
                      shadowOpacity: 0.8,
                      shadowRadius: 15,
                      elevation: 10,
                      zIndex: 20,
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-150, 600],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}
            </View>
          </View>
        </>
      )}

      {/* Footer Buttons */}
      {imageUri && !result && (
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 24 }]}>
          {!isScanning ? (
            <TouchableOpacity style={styles.processButton} onPress={startScan} activeOpacity={0.8}>
              <Text style={styles.processButtonText}>Process Prescription</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.statusText}>
                Please wait a few seconds. We are analyzing{'\n'}the Prescription...
              </Text>
              <View style={styles.scanButton}>
                <View style={styles.scanButtonContent}>
                  <Ionicons name="scan-outline" size={24} color="#ffffff" />
                  <Text style={styles.scanButtonText}>Scanning</Text>
                </View>
                <View style={styles.progressCircle}>
                  <Animated.Text style={styles.progressText}>
                    {percentage.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%']
                    })}
                  </Animated.Text>
                </View>
              </View>
            </>
          )}
        </View>
      )}

      {result && result.medicines && result.medicines.length > 0 && (
         <View style={[styles.bottomContainer, styles.resultFooter, { paddingBottom: insets.bottom + 24 }]}>
            <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart} activeOpacity={0.8}>
              <Text style={styles.addToCartText}>Add Verified Generics to Cart</Text>
              <Ionicons name="chevron-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
         </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
  uploadContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  instructionsText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#99F6E4',
    borderStyle: 'dashed',
    borderRadius: 24,
    backgroundColor: '#F0FDFA',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#115E59',
    marginBottom: 8,
  },
  uploadSubText: {
    fontSize: 12,
    color: '#0D9488',
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  privacyText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  scannerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  documentCard: {
    width: '100%',
    aspectRatio: 0.65,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#34D399',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
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
  processButton: {
    backgroundColor: '#0D9488',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  processButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  scanButton: {
    backgroundColor: '#34D399',
    borderRadius: 100,
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
  resultContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  medCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  extractedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  brandBadge: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandBadgeText: {
    color: '#E11D48',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  extractedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    fontStyle: 'italic',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
  },
  matchDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  doseboxPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D9488',
  },
  marketPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  resultFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
  },
  addToCartButton: {
    backgroundColor: '#0D9488',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  addToCartText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
