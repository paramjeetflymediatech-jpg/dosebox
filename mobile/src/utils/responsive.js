/**
 * responsive.js
 * ─────────────────────────────────────────────────────────────
 * A single-source-of-truth for all responsive sizing helpers.
 * Import what you need:
 *
 *   import { rs, rv, rm, wp, hp, isTablet, layout } from '../utils/responsive';
 *
 * rs(n)  — scale a horizontal / font size relative to 375px base width
 * rv(n)  — scale a vertical size relative to 812px base height
 * rm(n, f) — moderate scale (gentler, great for fonts). factor 0–1, default 0.5
 * wp(pct) — percentage of screen width  (e.g. wp(50) = 50%)
 * hp(pct) — percentage of screen height (e.g. hp(10) = 10%)
 * isTablet — true when width >= 768
 * layout  — { width, height, isPortrait }
 */

import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Design base dimensions (iPhone 13 / common 375×812 baseline)
const BASE_W = 375;
const BASE_H = 812;

/** Scale relative to base width */
export const rs = (size) => (SCREEN_W / BASE_W) * size;

/** Scale relative to base height */
export const rv = (size) => (SCREEN_H / BASE_H) * size;

/**
 * Moderate scale — blends the scaled value with the original.
 * factor=0 → no scaling (same as original), factor=1 → full scaling.
 * Defaults to 0.5 which is perfect for font sizes.
 */
export const rm = (size, factor = 0.5) =>
  size + (rs(size) - size) * factor;

/** Percentage of screen width */
export const wp = (pct) => (SCREEN_W * pct) / 100;

/** Percentage of screen height */
export const hp = (pct) => (SCREEN_H * pct) / 100;

/** True when running on a tablet-sized screen */
export const isTablet = SCREEN_W >= 768;

/** Convenience layout snapshot */
export const layout = {
  width: SCREEN_W,
  height: SCREEN_H,
  isPortrait: SCREEN_H >= SCREEN_W,
};

/**
 * Pixel-ratio-aware font size helper.
 * Keeps fonts legible across low/high-DPI screens.
 */
export const fontSize = (size) => {
  const newSize = rm(size);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

/**
 * Common spacing scale built on rs() so it adapts automatically.
 * Usage: spacing.md  →  16 dp (scaled)
 */
export const spacing = {
  xs: rs(4),
  sm: rs(8),
  md: rs(16),
  lg: rs(24),
  xl: rs(32),
  xxl: rs(48),
};

/**
 * Responsive border-radius scale.
 */
export const radius = {
  sm: rs(8),
  md: rs(12),
  lg: rs(16),
  xl: rs(24),
  full: 9999,
};

/**
 * Tab bar height that accounts for:
 *  - Bottom gesture inset on Android gesture-nav devices
 *  - Extra safe-area bottom padding on iOS notch devices
 * Use this in tabBarStyle.height to avoid content being clipped.
 */
export const TAB_BAR_HEIGHT = Platform.select({
  ios: rv(68),
  android: rv(64),
});

export default {
  rs,
  rv,
  rm,
  wp,
  hp,
  isTablet,
  layout,
  fontSize,
  spacing,
  radius,
  TAB_BAR_HEIGHT,
};
