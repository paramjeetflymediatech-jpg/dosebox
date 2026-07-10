import React from 'react';
import { CommonActions } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderTrackingScreen({ route, navigation }) {
  // Default status or passed via route params
  const status = route?.params?.status || 'Pending Pharmacist Approval';
  const orderId = '#ORD-9824';

  const getStatusIcon = () => {
    switch(status) {
      case 'Pending Pharmacist Approval': return '⏳';
      case 'Approved': return '✅';
      case 'Rejected': return '❌';
      case 'Delivered': return '📦';
      default: return '📍';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }))}
            style={styles.backButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.backIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusArea}>
          <Text style={styles.icon}>{getStatusIcon()}</Text>
          <Text style={styles.title}>Order {orderId}</Text>
          
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
          
          <Text style={styles.description}>
            {status === 'Pending Pharmacist Approval' 
              ? 'Our pharmacist is reviewing your prescription. You will be notified once it is approved.' 
              : 'Your order status has been updated.'}
          </Text>
        </View>

        <View style={styles.footerContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }))}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'},
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 24},
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    marginBottom: 40,
    alignItems: 'flex-end'},
  backButton: {
    padding: 8},
  backIcon: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '300'},
  statusArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -80},
  icon: {
    fontSize: 64,
    marginBottom: 24},
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#0f172a',
    marginBottom: 16,
    letterSpacing: -0.5},
  statusBadge: {
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 24},
  statusText: {
    color: '#d97706',
    fontWeight: '600',
    fontSize: 14},
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20},
  footerContainer: {
    paddingBottom: 20},
  primaryButton: {
    backgroundColor: '#f8fafc',
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'},
  primaryButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5}});

