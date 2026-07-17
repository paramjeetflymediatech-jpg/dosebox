import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { rs, rv, rm, spacing, radius } from '../utils/responsive';
import { setAlertRef } from '../services/AlertService';

export default function CustomAlert() {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({});
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Register this component with the global AlertService
    setAlertRef({
      show: (options) => {
        setConfig(options || {});
        setVisible(true);
        Animated.parallel([
          Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true })
        ]).start();
      },
      hide: () => {
        hideModal();
      }
    });
  }, []);

  const hideModal = (callback) => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, easing: Easing.ease, useNativeDriver: true })
    ]).start(() => {
      setVisible(false);
      setConfig({});
      if (typeof callback === 'function') {
        callback();
      }
    });
  };

  if (!visible) return null;

  const { title = 'Alert', message = '', type = 'info', buttons = [], cancellable = true } = config;

  let iconName = 'information-circle';
  let iconColor = '#0c888d'; // Default Dosebox Primary

  if (type === 'error') {
    iconName = 'alert-circle';
    iconColor = '#e68a7f';
  } else if (type === 'success') {
    iconName = 'checkmark-circle';
    iconColor = '#0c888d';
  } else if (type === 'warning') {
    iconName = 'warning';
    iconColor = '#F59E0B';
  }

  const renderButtons = () => {
    if (!buttons || buttons.length === 0) {
      return (
        <TouchableOpacity style={[styles.button, { backgroundColor: iconColor }]} onPress={() => hideModal()} activeOpacity={0.8}>
          <Text style={styles.buttonText}>OK</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.buttonsContainer}>
        {buttons.map((btn, index) => {
          const isCancel = btn.style === 'cancel';
          return (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.button, 
                isCancel ? styles.cancelButton : { backgroundColor: iconColor },
                buttons.length > 1 ? { flex: 1, marginLeft: index > 0 ? rs(8) : 0 } : {}
              ]} 
              onPress={() => hideModal(btn.onPress)} 
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, isCancel && styles.cancelButtonText]}>{btn.text}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => cancellable && hideModal()}>
      <TouchableWithoutFeedback onPress={() => cancellable && hideModal()}>
        <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
              
              <View style={styles.iconContainer}>
                <Ionicons name={iconName} size={rs(48)} color={iconColor} />
              </View>

              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              <View style={styles.footer}>
                {renderButtons()}
              </View>

            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    zIndex: 9999,
  },
  card: {
    width: '100%',
    maxWidth: rs(340),
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: rv(16),
  },
  title: {
    fontSize: rm(20),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: rv(8),
    textAlign: 'center',
  },
  message: {
    fontSize: rm(15),
    color: '#475569',
    textAlign: 'center',
    lineHeight: rv(22),
    marginBottom: rv(24),
  },
  footer: {
    width: '100%',
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  button: {
    width: '100%',
    paddingVertical: rv(12),
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: rm(16),
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#64748B',
  }
});
