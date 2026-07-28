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
  ScrollView,
  Modal
} from 'react-native';
import { AlertService } from '../../services/AlertService';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import PermissionsService from '../../services/PermissionsService';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

export default function UploadPrescriptionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [scanLineAnim] = useState(new Animated.Value(0));
  const [progress] = useState(new Animated.Value(0));
  const [imageUri, setImageUri] = useState(null);
  const [imageType, setImageType] = useState(null);
  const [imageName, setImageName] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  
  const [showPickerModal, setShowPickerModal] = useState(false);
  
  const { addToCart } = useCart();

  const pickImage = async () => {
    try {
      const response = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (response.didCancel) return;
      
      if (response.errorCode || response.errorMessage) {
        AlertService.show({ type: 'error', title: 'Picker Error', message: response.errorMessage || response.errorCode });
        return;
      }
      
      if (response.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri);
        setImageType(response.assets[0].type || 'image/jpeg');
        setImageName(response.assets[0].fileName || 'upload.jpg');
        setResult(null); // Reset if picking a new image
      }
    } catch (err) {
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to open gallery: ' + err.message });
    }
  };

  const takePhoto = async () => {
    try {
      const hasPermission = await PermissionsService.requestCameraAndGalleryPermission();
      if (!hasPermission) return;

      const response = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: true,
      });

      if (response.didCancel) return;
      
      if (response.errorCode || response.errorMessage) {
        AlertService.show({ type: 'error', title: 'Camera Error', message: response.errorMessage || response.errorCode });
        return;
      }
      
      if (response.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri);
        setImageType(response.assets[0].type || 'image/jpeg');
        setImageName(response.assets[0].fileName || 'camera.jpg');
        setResult(null); // Reset if picking a new image
      }
    } catch (err) {
      AlertService.show({ type: 'error', title: 'Error', message: 'Failed to open camera: ' + err.message });
    }
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
        const calculatedQty = medItem.extracted?.quantity || 1;
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price || 0,
          discountPrice: product.discountPrice || product.price,
          image: product.images?.[0] || '',
          qty: calculatedQty, // Use AI calculated dosage
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
        <View style={{ width: rs(44) }} />
      </View>

      {!imageUri ? (
        <View style={styles.uploadContainer}>
          <Text style={styles.instructionsText}>
            Upload your prescription. Our medical OCR matches the ingredients directly to generic alternatives.
          </Text>
          
          <TouchableOpacity 
            style={styles.mainUploadBox} 
            onPress={() => setShowPickerModal(true)} 
            activeOpacity={0.8}
          >
            <View style={styles.mainIconCircle}>
              <Ionicons name="document-text-outline" size={40} color="#0D9488" />
            </View>
            <Text style={styles.mainUploadTitle}>Upload Prescription</Text>
            <Text style={styles.mainUploadDesc}>Tap to capture or select image</Text>
            <View style={styles.uploadBadge}>
              <Text style={styles.uploadBadgeText}>Camera & Gallery Supported</Text>
            </View>
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
            <Ionicons name="time-outline" size={rs(64)} color="#F59E0B" style={{ marginBottom: rv(16) }} />
            <Text style={{ fontSize: rm(24), fontWeight: '800', color: '#0F172A', marginBottom: rv(8), textAlign: 'center' }}>Review Pending</Text>
            <Text style={{ fontSize: rm(16), color: '#64748B', textAlign: 'center', lineHeight: rv(24), marginBottom: rv(32) }}>
              Your prescription has been uploaded successfully! Our AI could not automatically extract all the details, so a pharmacist will manually review it shortly.
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#1F5C52', paddingHorizontal: spacing.xl, paddingVertical: rv(16), borderRadius: radius.full }} 
              onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
            >
              <Text style={{ color: '#fff', fontSize: rm(16), fontWeight: '700' }}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : result ? (
        <ScrollView style={styles.resultContainer} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
          <View style={styles.successHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, width: '100%', marginBottom: rv(16) }}>
              <Image source={{ uri: imageUri }} style={{ width: rs(60), height: rv(80), borderRadius: radius.sm, borderWidth: 1, borderColor: '#e2e8f0' }} resizeMode="cover" />
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
          {result.medicines && result.medicines.length > 0 ? (
            result.medicines.map((med, idx) => {
              const product = med.product || (med.variants && med.variants[0]);
              if (!product) return null;
              return (
                <View key={idx} style={styles.medCard}>
                   <View style={styles.extractedRow}>
                     <View style={styles.brandBadge}>
                       <Text style={styles.brandBadgeText}>Handwritten Brand</Text>
                     </View>
                     <Text style={styles.extractedText}>"{med.extracted?.medicineName || 'Unknown'} {med.extracted?.strength || ''}"</Text>
                     {med.extracted?.dosage && (
                       <Text style={{ fontSize: rm(12), color: '#64748B', marginTop: rv(2) }}>
                         Dosage: {med.extracted.dosage} for {med.extracted.duration || '-'}
                       </Text>
                     )}
                     {med.extracted?.quantity && (
                       <Text style={{ fontSize: rm(12), color: '#0D9488', fontWeight: 'bold', marginTop: rv(2) }}>
                         Calculated Total: {med.extracted.quantity} units
                       </Text>
                     )}
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
            })
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: rv(40), paddingHorizontal: spacing.lg }}>
               <Ionicons name="alert-circle-outline" size={rs(48)} color="#94A3B8" />
               <Text style={{ marginTop: rv(12), fontSize: rm(16), color: '#475569', textAlign: 'center', lineHeight: rv(24) }}>
                 No medicines were matched from this prescription. Please try uploading a clearer image or search manually.
               </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <>
          <View style={styles.scannerContainer}>
            <View style={styles.documentCard}>
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%', borderRadius: radius.xl }} resizeMode="contain" />
              
              {isScanning && (<View style={styles.scanningOverlay} />)}
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

      {result && (
         <View style={[styles.bottomContainer, styles.resultFooter, { paddingBottom: insets.bottom + 24 }]}>
           {result.medicines && result.medicines.length > 0 ? (
             <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart} activeOpacity={0.8}>
               <Text style={styles.addToCartText}>Add Verified Generics to Cart</Text>
               <Ionicons name="chevron-forward" size={20} color="#ffffff" />
             </TouchableOpacity>
           ) : (
             <TouchableOpacity style={styles.processButton} onPress={() => { setResult(null); setImageUri(null); }} activeOpacity={0.8}>
               <Text style={styles.processButtonText}>Upload Clearer Image</Text>
             </TouchableOpacity>
           )}
         </View>
      )}
      <Modal
        visible={showPickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPickerModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowPickerModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderLine} />
            <Text style={styles.modalTitle}>Select Option</Text>
            
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => {
                setShowPickerModal(false);
                takePhoto();
              }}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: '#EAF4F2' }]}>
                <Ionicons name="camera" size={24} color="#0D9488" />
              </View>
              <View style={styles.modalOptionTextContainer}>
                <Text style={styles.modalOptionText}>Take Photo</Text>
                <Text style={styles.modalOptionSubText}>Use your camera to capture prescription</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => {
                setShowPickerModal(false);
                pickImage();
              }}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="images" size={24} color="#4F46E5" />
              </View>
              <View style={styles.modalOptionTextContainer}>
                <Text style={styles.modalOptionText}>Choose from Gallery</Text>
                <Text style={styles.modalOptionSubText}>Select an existing image from gallery</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalCancelBtn} 
              onPress={() => setShowPickerModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: spacing.lg,
    paddingTop: rv(16),
    paddingBottom: rv(24),
  },
  backButton: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
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
    fontSize: rm(20),
    fontWeight: '500',
    color: '#0F172A',
  },
  uploadContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: rv(20),
  },
  instructionsText: {
    fontSize: rm(14),
    color: '#64748B',
    textAlign: 'center',
    marginBottom: rv(32),
    lineHeight: rv(22),
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#99F6E4',
    borderStyle: 'dashed',
    borderRadius: radius.xl,
    backgroundColor: '#F0FDFA',
    padding: rv(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rv(24),
  },
  iconCircle: {
    width: rs(64),
    height: rs(64),
    borderRadius: rs(32),
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rv(16),
  },
  uploadText: {
    fontSize: rm(16),
    fontWeight: '600',
    color: '#115E59',
    marginBottom: rv(8),
  },
  uploadSubText: {
    fontSize: rm(12),
    color: '#0D9488',
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  privacyText: {
    flex: 1,
    marginLeft: rs(12),
    fontSize: rm(12),
    color: '#475569',
    lineHeight: rv(18),
  },
  scannerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  documentCard: {
    width: '100%',
    aspectRatio: 0.65,
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
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
    paddingHorizontal: spacing.lg,
    paddingTop: rv(32),
  },
  statusText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: rm(14),
    lineHeight: rv(22),
    marginBottom: rv(24),
  },
  processButton: {
    backgroundColor: '#0D9488',
    borderRadius: radius.lg,
    paddingVertical: rv(16),
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  processButtonText: {
    color: '#ffffff',
    fontSize: rm(16),
    fontWeight: '700',
  },
  scanButton: {
    backgroundColor: '#34D399',
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rv(16),
    paddingHorizontal: spacing.lg,
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
    fontSize: rm(18),
    fontWeight: '600',
    marginLeft: rs(12),
  },
  progressCircle: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: '#ffffff',
    fontSize: rm(11),
    fontWeight: '700',
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: rv(24),
    backgroundColor: '#ffffff',
    padding: spacing.lg,
    borderRadius: radius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultTitle: {
    fontSize: rm(18),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: rv(12),
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: rm(14),
    color: '#64748B',
    marginTop: rv(8),
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: rm(12),
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: rv(16),
  },
  medCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: rv(16),
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
    marginBottom: rv(16),
    gap: rs(8),
  },
  brandBadge: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    paddingHorizontal: rs(8),
    paddingVertical: rv(4),
    borderRadius: radius.sm,
  },
  brandBadgeText: {
    color: '#E11D48',
    fontSize: rm(10),
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  extractedText: {
    fontSize: rm(14),
    fontWeight: '500',
    color: '#475569',
    fontStyle: 'italic',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  matchDetails: {
    flex: 1,
  },
  productName: {
    fontSize: rm(16),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: rv(8),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: rs(8),
  },
  doseboxPrice: {
    fontSize: rm(18),
    fontWeight: '800',
    color: '#0D9488',
  },
  marketPrice: {
    fontSize: rm(14),
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
    paddingTop: rv(16),
  },
  addToCartButton: {
    backgroundColor: '#0D9488',
    borderRadius: radius.lg,
    paddingVertical: rv(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  addToCartText: {
    color: '#ffffff',
    fontSize: rm(16),
    fontWeight: '700',
  },
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: rv(24),
  },
  optionBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radius.xl,
    backgroundColor: '#ffffff',
    paddingVertical: rv(24),
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  optionTitle: {
    fontSize: rm(15),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: rv(4),
  },
  optionDesc: {
    fontSize: rm(11),
    color: '#64748B',
    textAlign: 'center',
  },
  mainUploadBox: {
    borderWidth: 2,
    borderColor: '#99F6E4',
    borderStyle: 'dashed',
    borderRadius: radius.xl,
    backgroundColor: '#F0FDFA',
    paddingVertical: rv(48),
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rv(24),
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  mainIconCircle: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rv(20),
  },
  mainUploadTitle: {
    fontSize: rm(18),
    fontWeight: '800',
    color: '#115E59',
    marginBottom: rv(6),
  },
  mainUploadDesc: {
    fontSize: rm(13),
    color: '#0D9488',
    marginBottom: rv(16),
  },
  uploadBadge: {
    backgroundColor: '#EAF4F2',
    paddingHorizontal: spacing.md,
    paddingVertical: rv(6),
    borderRadius: radius.full,
  },
  uploadBadgeText: {
    fontSize: rm(11),
    fontWeight: '600',
    color: '#0D9488',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: rv(12),
    paddingBottom: rv(32),
  },
  modalHeaderLine: {
    width: rs(40),
    height: rv(4),
    backgroundColor: '#E2E8F0',
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: rv(20),
  },
  modalTitle: {
    fontSize: rm(18),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: rv(20),
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rv(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalOptionIcon: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(16),
  },
  modalOptionTextContainer: {
    flex: 1,
  },
  modalOptionText: {
    fontSize: rm(16),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: rv(2),
  },
  modalOptionSubText: {
    fontSize: rm(12),
    color: '#64748B',
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: rv(14),
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: rv(20),
  },
  modalCancelText: {
    fontSize: rm(15),
    fontWeight: '700',
    color: '#475569',
  },
});
