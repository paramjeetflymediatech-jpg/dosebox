import React, { useContext } from 'react';
import * as ReactNative from 'react-native';

const OriginalText = ReactNative.Text;
const OriginalTextInput = ReactNative.TextInput;

// Set defaultProps for compatibility with libraries that read defaultProps
try {
  if (OriginalText.defaultProps == null) OriginalText.defaultProps = {};
  OriginalText.defaultProps.allowFontScaling = false;
  OriginalText.defaultProps.maxFontSizeMultiplier = 1.15;

  if (OriginalTextInput.defaultProps == null) OriginalTextInput.defaultProps = {};
  OriginalTextInput.defaultProps.allowFontScaling = false;
  OriginalTextInput.defaultProps.maxFontSizeMultiplier = 1.15;
  OriginalTextInput.defaultProps.placeholderTextColor = '#94A3B8';
} catch (e) {
  // Ignore fallback error
}

/**
 * Universal Text wrapper that protects text across all physical screen sizes:
 * 1. Disables extreme font scaling that hides or clips text in fixed containers / cards / headers.
 * 2. Provides default visible color '#1E293B' on root text so text is never invisible on Android dark mode.
 * 3. Preserves nested text inheritance without overriding parent colors.
 */
const CustomText = React.forwardRef((props, ref) => {
  let hasTextAncestor = false;
  try {
    if (ReactNative.unstable_TextAncestorContext) {
      hasTextAncestor = useContext(ReactNative.unstable_TextAncestorContext);
    }
  } catch (e) {
    // Context fallback
  }

  const defaultStyle = hasTextAncestor ? null : { color: '#1E293B' };

  return (
    <OriginalText
      allowFontScaling={false}
      maxFontSizeMultiplier={1.15}
      {...props}
      style={defaultStyle ? [defaultStyle, props.style] : props.style}
      ref={ref}
    />
  );
});

CustomText.displayName = 'DoseboxText';
Object.assign(CustomText, OriginalText);

/**
 * Universal TextInput wrapper:
 * 1. Disables font scaling that crushes inputs on small devices.
 * 2. Guarantees placeholderTextColor='#94A3B8' so placeholders never turn white/invisible on Android dark mode.
 * 3. Guarantees default text color='#0F172A' so typed text is always clearly legible.
 */
const CustomTextInput = React.forwardRef((props, ref) => {
  return (
    <OriginalTextInput
      allowFontScaling={false}
      maxFontSizeMultiplier={1.15}
      placeholderTextColor={props.placeholderTextColor || '#94A3B8'}
      {...props}
      style={[{ color: '#0F172A' }, props.style]}
      ref={ref}
    />
  );
});

CustomTextInput.displayName = 'DoseboxTextInput';
Object.assign(CustomTextInput, OriginalTextInput);

// Intercept react-native export dynamically
try {
  Object.defineProperty(ReactNative, 'Text', {
    configurable: true,
    enumerable: true,
    get: () => CustomText,
  });
  Object.defineProperty(ReactNative, 'TextInput', {
    configurable: true,
    enumerable: true,
    get: () => CustomTextInput,
  });
} catch (e) {
  ReactNative.Text = CustomText;
  ReactNative.TextInput = CustomTextInput;
}

export { CustomText, CustomTextInput };
