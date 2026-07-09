import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartCheckoutScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Checkout</Text>
        </View>

        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Cart Items</Text>
          <View style={styles.cartItem}>
            <Text style={styles.itemName}>Amoxicillin 500mg</Text>
            <Text style={styles.itemPrice}>$12.00</Text>
          </View>
          <View style={styles.cartItem}>
            <Text style={styles.itemName}>Atorvastatin 20mg</Text>
            <Text style={styles.itemPrice}>$15.00</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Subtotal</Text>
            <Text style={styles.summaryText}>$27.00</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Delivery</Text>
            <Text style={styles.summaryText}>$5.00</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalText}>$32.00</Text>
          </View>

          <View style={styles.addressBox}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <Text style={styles.addressText}>123 Health Ave, Wellness City, 90210</Text>
          </View>
        </ScrollView>

        <View style={styles.footerContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('OrderTracking', { status: 'Pending Pharmacist Approval' })}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Place Order</Text>
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
    paddingHorizontal: 24},
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    marginBottom: 24},
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start'},
  backIcon: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '300'},
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#0f172a',
    letterSpacing: -0.5},
  listContainer: {
    flex: 1},
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
    marginTop: 10},
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12},
  itemName: {
    fontSize: 16,
    color: '#0f172a'},
  itemPrice: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500'},
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 20},
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12},
  summaryText: {
    fontSize: 14,
    color: '#64748b'},
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'},
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#134E4A'},
  addressBox: {
    marginTop: 40,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9'},
  addressText: {
    fontSize: 16,
    color: '#0f172a',
    lineHeight: 24},
  footerContainer: {
    paddingVertical: 20},
  primaryButton: {
    backgroundColor: '#134E4A',
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center'},
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5}});

