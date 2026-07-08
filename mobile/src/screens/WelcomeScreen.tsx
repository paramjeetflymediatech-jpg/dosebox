import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log("🚀 WelcomeScreen mounted! If you see this, logs are working.");
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, floatAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.content}>
          <Animated.View style={[styles.headerArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Image 
              source={require('../assets/images/mobile-uper.png')} 
              style={styles.logoImage} 
              resizeMode="contain" 
            />
          </Animated.View>
          
          <Animated.View style={[styles.mainArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* <Animated.Text style={[styles.floatingIcon, { transform: [{ translateY: floatAnim }] }]}>💊</Animated.Text> */}
            {/* <Text style={styles.title}>Simplicity in healthcare.</Text>
            <Text style={styles.subtitle}>
              Manage your prescriptions and order medicines effortlessly.
            </Text> */}

            <Image 
              source={require('../assets/images/Media.jpg')} 
              style={styles.heroImage} 
              resizeMode="cover" 
            />

            <View style={styles.pointersContainer}>
              <Text style={styles.pointerText}>✓ Genuine Medicines Guaranteed</Text>
              <Text style={styles.pointerText}>✓ Consult with Top Doctors</Text>
              <Text style={styles.pointerText}>✓ Fast & Secure Delivery</Text>
            </View>
          </Animated.View>
          
          
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
    maxWidth: 500,
    alignSelf: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  headerArea: {
    marginTop: 20,
    alignItems: 'center',
  },
  logoImage: {
    width: 300,
    height: 80,
  },
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  pointersContainer: {
    marginTop: 8,
    gap: 10,
  },
  pointerText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
  },
  mainArea: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  floatingIcon: {
    position: 'absolute',
    top: -10,
    right: 20,
    fontSize: 48,
    opacity: 0.9,
    zIndex: -1,
  },
  title: {
    fontSize: 40,
    fontWeight: '300',
    color: '#0f172a',
    lineHeight: 48,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#64748b',
    lineHeight: 26,
  },
  footerArea: {
    gap: 16,
    paddingBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#134E4A',
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
