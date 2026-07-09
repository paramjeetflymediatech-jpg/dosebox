import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    backgroundColor: palette.bg,
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
    width: 260,
    height: 70,
    marginBottom: 24,
  },
  tagline: {
    fontSize: 24,
    fontWeight: '500',
    color: palette.ink,
    letterSpacing: -0.5,
  },
});
