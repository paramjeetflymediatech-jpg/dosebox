import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, FONTS, SHADOWS } from '../../utils/theme';
import { rs, rv, rm, spacing, radius } from '../../utils/responsive';

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Auto-navigate after 2.5 seconds using replace
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.centerArea,
            { opacity: fadeAnim },
          ]}
        >
          <Image
            source={require('../../assets/images/mobile-uper.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Health, simplified.</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerArea: {
    alignItems: 'center',
  },
  logoImage: {
    width: rs(260),
    height: rv(70),
    marginBottom: spacing.xl,
  },
  tagline: {
    fontSize: rm(24),
    fontWeight: FONTS.semiBold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
});
