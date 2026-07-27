import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { COLORS, FONTS, SHADOWS } from '../../utils/theme';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';


const SLIDES = [
  {
    id: '1',
    image: require('../../assets/images/onboarding_medicine.png'),
    title: 'Genuine Medicines',
    description: 'We source exclusively from accredited formulators, so you always get authentic medication safely.',
  },
  {
    id: '2',
    image: require('../../assets/images/onboarding_doctor.png'),
    title: 'Top-Rated Doctors',
    description: 'Consult with verified healthcare professionals from the comfort of your home.',
  },
  {
    id: '3',
    image: require('../../assets/images/onboarding_delivery.png'),
    title: 'Fast, Secure Delivery',
    description: 'Get your prescriptions delivered right to your door with real-time tracking.',
  },
];


export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const timerRef = useRef(null);

  // Auto-advance logic
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex < SLIDES.length) {
          flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
          return nextIndex;
        } else {
          // If we reach the end, stop auto-advancing
          if (timerRef.current) clearInterval(timerRef.current);
          return prev;
        }
      });
    }, 4000);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const onScrollBeginDrag = () => {
    // If user starts dragging, clear the auto-advance timer so we don't fight them
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const onMomentumScrollEnd = (e) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(newIndex);
    // Restart timer if not at the end
    if (newIndex < SLIDES.length - 1) {
      startTimer();
    }
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      navigation.replace('GuestTabs');
    } catch (e) {
      console.error('Failed to save onboarding flag', e);
      navigation.replace('GuestTabs');
    }
  };

  const handleNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const nextIndex = currentIndex + 1;
    if (nextIndex < SLIDES.length) {
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
      startTimer(); // Optional: restart the timer, but usually we just let them click through
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.heroImage} resizeMode="contain" />
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                currentIndex === i ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Skip Button */}
        <TouchableOpacity onPress={finishOnboarding} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />

      <View style={styles.footer}>
        {currentIndex === SLIDES.length - 1 ? (
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={finishOnboarding}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={handleNext}
          >
            <Text style={styles.secondaryButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: rv(16),
    height: rv(60),
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: rs(8),
  },
  dot: {
    height: rs(6),
    borderRadius: rs(3),
  },
  dotActive: {
    width: rs(20),
    backgroundColor: COLORS.primary,
  },
  dotInactive: {
    width: rs(6),
    backgroundColor: COLORS.border,
  },
  skipButton: {
    padding: rs(8),
  },
  skipText: {
    fontSize: rm(14),
    fontWeight: FONTS.semiBold,
    color: COLORS.textSecondary,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  imageContainer: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rv(30),
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.xl,
  },
  slideTitle: {
    fontSize: rm(32),
    fontWeight: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: rv(16),
    letterSpacing: -0.5,
  },
  slideDescription: {
    fontSize: rm(16),
    fontWeight: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: rv(24),
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: rv(40),
    paddingTop: rv(20),
    height: rv(120),
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: rv(16),
    borderRadius: radius.md,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: rm(16),
    fontWeight: FONTS.bold,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: rv(16),
    borderRadius: radius.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: rm(16),
    fontWeight: FONTS.bold,
  },
  placeholderButton: {
    height: rv(56),
  },
});


