import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const palette = {
  bg: '#F7F5EF',
  surface: '#FFFFFF',
  surfaceMuted: '#EAF2EE',
  ink: '#122622',
  inkMuted: '#5B6F69',
  primary: '#1F5C52',
  primaryDark: '#123B34',
  accent: '#E3A857',
  line: '#DCE6E1',
};

const fonts = {
  // display: 'Newsreader_500Medium',
  // body: 'Manrope_600SemiBold',
};

const SLIDES = [
  {
    id: '1',
    icon: '💊',
    title: 'Genuine Medicines',
    description: 'We source exclusively from accredited formulators, so you always get authentic medication safely.',
  },
  {
    id: '2',
    icon: '🩺',
    title: 'Top-Rated Doctors',
    description: 'Consult with verified healthcare professionals from the comfort of your home.',
  },
  {
    id: '3',
    icon: '🚚',
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
    }, 2500);
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
      navigation.replace('MainTabs');
    } catch (e) {
      console.error('Failed to save onboarding flag', e);
      navigation.replace('MainTabs');
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
        <View style={styles.iconBadge}>
          <Text style={styles.iconText}>{item.icon}</Text>
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
    backgroundColor: palette.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 16,
    height: 60,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: palette.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: palette.line,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.inkMuted,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  iconText: {
    fontSize: 56,
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: '500',
    color: palette.ink,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  slideDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: palette.inkMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 20,
    height: 120,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: palette.primary,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: palette.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  primaryButtonText: {
    color: palette.surface,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.primary,
  },
  secondaryButtonText: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  placeholderButton: {
    height: 56, // Same height as primary button approximately
  },
});


