import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, FONTS } from '../../utils/theme';
import { rs, rv, rm } from '../../utils/responsive';

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const subtitleFadeAnim = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([
          Animated.timing(subtitleFadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(subtitleTranslateY, {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // Check routing logic
    const checkRouting = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        let nextRoute = 'Welcome';

        if (hasSeenOnboarding === 'true') {
          const token = await AsyncStorage.getItem('accessToken');
          const userStr = await AsyncStorage.getItem('user');

          if (token && userStr) {
            const user = JSON.parse(userStr);
            const userRole = user?.role?.toLowerCase() || '';
            if (userRole === 'admin' || userRole.includes('admin') || userRole === 'super_admin' || userRole === 'super admin') {
              nextRoute = 'AdminTabs';
            } else {
              nextRoute = 'MainTabs';
            }
          } else {
            nextRoute = 'GuestTabs';
          }
        }

        // Wait a bit so the splash animation is fully visible
        setTimeout(() => {
          navigation.replace(nextRoute);
        }, 2000);

      } catch (e) {
        console.error('Splash routing error', e);
        setTimeout(() => navigation.replace('Welcome'), 2000);
      }
    };

    checkRouting();
  }, [fadeAnim, scaleAnim, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={require('../../assets/images/mobile-uper.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>
          DoseBox<Text style={{ color: '#E78D44' }}>.</Text>in
        </Text>
        <Animated.Text style={[styles.subtitle, { opacity: subtitleFadeAnim, transform: [{ translateY: subtitleTranslateY }] }]}>
          RELIABLE CARE, RIGHT HERE
        </Animated.Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Slightly off-white to match theme background
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: rs(180),
    height: rv(180),
    marginBottom: rv(20),
  },
  tagline: {
    fontSize: rm(42),
    fontWeight: FONTS.bold,
    color: '#17819B',
    letterSpacing: 1,
    marginBottom: rv(4),
  },
  subtitle: {
    fontSize: rm(14),
    fontWeight: FONTS.bold,
    color: COLORS.textSecondary || '#64748B',
    letterSpacing: 1,
  },
});
