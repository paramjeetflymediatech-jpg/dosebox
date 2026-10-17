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

// Design base dimensions (iPhone 13 / common 375×812 baseline)
const BASE_W = 375;
const BASE_H = 812;

const getDims = () => {
  const { width, height } = Dimensions.get('window');
  return {
    width: width || BASE_W,
    height: height || BASE_H,
  };
};

/** 
 * Scale relative to base width.
 * Clamped between 0.85x and 1.25x so horizontal spacing and widths never collapse excessively on small phones.
 */
export const rs = (size) => {
  const { width } = getDims();
  const scale = Math.min(Math.max(width / BASE_W, 0.85), 1.25);
  return Math.round(size * scale);
};

/** 
 * Scale relative to base height.
 * CRITICAL FOR SMALL SCREENS: Clamped between 0.90x and 1.25x so vertical heights (inputs, cards, buttons, lineHeights)
 * never collapse and cut off text or push content off screen.
 */
export const rv = (size) => {
  const { height } = getDims();
  const scale = Math.min(Math.max(height / BASE_H, 0.90), 1.25);
  return Math.round(size * scale);
};

/**
 * Moderate scale — blends the scaled value with the original.
 * Clamped so fonts stay legible and proportionate across all devices.
 */
export const rm = (size, factor = 0.5) => {
  const { width } = getDims();
  const rawScale = width / BASE_W;
  const clampedScale = Math.min(Math.max(rawScale, 0.88), 1.15);
  const scaled = size * clampedScale;
  return Math.round(size + (scaled - size) * factor);
};

/** Percentage of screen width */
export const wp = (pct) => (getDims().width * pct) / 100;

/** Percentage of screen height */
export const hp = (pct) => (getDims().height * pct) / 100;

/** True when running on a tablet-sized screen */
export const isTablet = getDims().width >= 768;

/** Convenience layout snapshot */
export const layout = {
  get width() { return getDims().width; },
  get height() { return getDims().height; },
  get isPortrait() { return getDims().height >= getDims().width; },
};

/**
 * Pixel-ratio-aware font size helper.
 * Keeps fonts legible across low/high-DPI screens.
 */
export const fontSize = (size) => {
  return rm(size);
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
