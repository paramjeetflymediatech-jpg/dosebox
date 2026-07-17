import { Platform } from 'react-native';

export const COLORS = {
  // Primary (Teals)
  primary: '#0d9488',
  primaryLight: '#14b8a6',
  primaryDark: '#0f766e',

  // Secondary (Navy Blues)
  secondary: '#1e293b',
  secondaryLight: '#334155',
  secondaryDark: '#0f172a',

  // Accent (Soft Corals/Oranges)
  accent: '#f28b82',
  accentLight: '#f8b4b0',
  accentDark: '#d9736a',

  // Neutrals
  background: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',

  // Text & Status (keeping consistent names so app doesn't break)
  text: '#0f172a', // Secondary Dark
  textSecondary: '#334155', // Secondary Light
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
};

export const FONTS = {
  // Using system font weight mapping for a premium Inter/SF Pro look
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
};

export const SHADOWS = {
  // Minimalist Stripe/Apple style shadows
  sm: Platform.select({
    ios: {
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }),
  none: Platform.select({
    ios: {
      shadowOpacity: 0,
    },
    android: {
      elevation: 0,
    },
  }),
};

export default {
  COLORS,
  FONTS,
  SHADOWS,
};
