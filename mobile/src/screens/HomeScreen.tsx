import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';

export default function HomeScreen({ navigation }: any) {
  const features = [
    { id: 1, title: 'Order Medicines', icon: '💊', route: 'BrowseMedicines' },
    { id: 2, title: 'Consult Doctor', icon: '👨‍⚕️', route: 'Home' }, // Not implemented yet
    { id: 3, title: 'Upload Prescript', icon: '📄', route: 'UploadPrescription' },
    { id: 4, title: 'My Orders', icon: '📦', route: 'OrderTracking' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning.</Text>
            <Text style={styles.subtitle}>Ready to manage your health?</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => navigation.navigate('Welcome')}
            activeOpacity={0.6}
          >
            <Text style={styles.profileText}>Log out</Text>
          </TouchableOpacity>
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
    backgroundColor: '#ffffff',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '300',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '400',
  },
  profileButton: {
    paddingVertical: 8,
  },
  profileText: {
    color: '#134E4A',
    fontWeight: '500',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  cardContainer: {
    marginBottom: 40,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '400',
    color: '#0f172a',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  heroButton: {
    backgroundColor: '#134E4A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  gridItem: {
    width: '47%',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  icon: {
    fontSize: 28,
    marginBottom: 16,
  },
  gridText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: 20,
  },
  emptyState: {
    backgroundColor: '#f8fafc',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyStateText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '400',
  },
});
