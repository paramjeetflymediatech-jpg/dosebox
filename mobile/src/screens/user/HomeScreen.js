import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }) {
  const features = [
    { id: 1, title: 'Order Medicines', icon: '💊', route: 'BrowseMedicines' },
    { id: 2, title: 'Consult Doctor', icon: '👨‍⚕️', route: 'Home' }, // Not implemented yet
    { id: 3, title: 'Upload Prescript', icon: '📄', route: 'UploadPrescription' },
    { id: 4, title: 'My Orders', icon: '📦', route: 'OrderTracking' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contentWrapper}>
        
        {/* TOP NAVBAR */}
        <View style={styles.header}>
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.locationContainer} activeOpacity={0.7}>
              <Text style={styles.locationIcon}>📍</Text>
              <View>
                <Text style={styles.locationLabel}>Delivering to</Text>
                <Text style={styles.locationText} numberOfLines={1}>Select Location ▾</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cartButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('CartCheckout')}
            >
              <Text style={styles.cartIcon}>🛒</Text>
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>0</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput 
              style={styles.searchInput}
              placeholder="Search for medicines, doctors..."
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>
        
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.cardContainer}>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>20% Off First Order</Text>
              <Text style={styles.heroSubtitle}>Use code HEALTH20 at checkout</Text>
              <TouchableOpacity style={styles.heroButton} activeOpacity={0.8}>
                <Text style={styles.heroButtonText}>Shop Now</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Quick Access</Text>
          
          <View style={styles.grid}>
            {features.map((feature) => (
              <TouchableOpacity 
                key={feature.id} 
                style={styles.gridItem}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(feature.route)}
              >
                <Text style={styles.icon}>{feature.icon}</Text>
                <Text style={styles.gridText}>{feature.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent activity found.</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff'},
  contentWrapper: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    flex: 1},
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'},
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16},
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 16},
  locationIcon: {
    fontSize: 22},
  locationLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5},
  locationText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'},
  cartButton: {
    padding: 8,
    position: 'relative'},
  cartIcon: {
    fontSize: 24},
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff'},
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold'},
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0'},
  searchIcon: {
    fontSize: 16,
    marginRight: 12},
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    height: '100%'},
  container: {
    flex: 1,
    backgroundColor: '#ffffff'},
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40},
  cardContainer: {
    marginBottom: 32},
  heroCard: {
    backgroundColor: '#1F5C52',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#123B34',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4},
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8},
  heroSubtitle: {
    fontSize: 14,
    color: '#EAF2EE',
    marginBottom: 24},
  heroButton: {
    backgroundColor: '#E3A857',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'flex-start'},
  heroButtonText: {
    color: '#122622',
    fontWeight: '700',
    fontSize: 14},
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32},
  gridItem: {
    width: '48%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9'},
  icon: {
    fontSize: 32,
    marginBottom: 12},
  gridText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center'},
  recentSection: {
    marginBottom: 20},
  emptyState: {
    backgroundColor: '#f8fafc',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed'},
  emptyStateText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500'}});

