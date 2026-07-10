import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

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

const { width } = Dimensions.get('window');

const POINTERS = [
  'Check your internet connection',
  'Try Wi-Fi or mobile data',
  'Refresh your network',
  'Reopen the DoseBox app'
];

interface NoInternetScreenProps {
  onRetry?: () => void;
}

export default function NoInternetScreen({ onRetry }: NoInternetScreenProps) {
  
  const handleReload = () => {
    // Manually force a check if desired, though the listener usually handles it
    NetInfo.refresh().then(state => {
      if (onRetry && state.isConnected) {
        onRetry();
      }
    });
    if (onRetry) onRetry();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.topArea}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📡</Text>
          </View>
          
          <Text style={styles.title}>We tried but could not connect to the internet.</Text>
          
          <View style={styles.vitalLine}>
            <View style={styles.vitalPulse} />
          </View>
          
          <View style={styles.pointersContainer}>
            {POINTERS.map((pointer, index) => (
              <View key={index} style={styles.pointerRow}>
                <View style={styles.bulletPoint} />
                <Text style={styles.pointerText}>{pointer}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footerArea}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handleReload}
          >
            <Text style={styles.primaryButtonText}>Reload</Text>
          </TouchableOpacity>
        </View>
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  topArea: {
    marginTop: 40,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 32,
    opacity: 0.8,
  },
  title: {
    fontSize: 34,
    fontWeight: '500',
    color: palette.ink,
    lineHeight: 40,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  vitalLine: {
    height: 2,
    backgroundColor: palette.line,
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: 32,
    width: Math.min(width - 64, 468),
  },
  vitalPulse: {
    width: 56,
    height: 2,
    backgroundColor: palette.accent,
    borderRadius: 1,
  },
  pointersContainer: {
    gap: 16,
  },
  pointerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.primary,
    marginTop: 8,
  },
  pointerText: {
    fontSize: 16,
    color: palette.inkMuted,
    lineHeight: 24,
    flex: 1,
  },
  footerArea: {
    paddingBottom: 20,
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
});
