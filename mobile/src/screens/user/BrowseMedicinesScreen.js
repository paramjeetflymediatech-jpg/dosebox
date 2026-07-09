import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MEDICINES = [
  { id: '1', name: 'Amoxicillin 500mg', desc: 'Antibiotic', price: '$12.00' },
  { id: '2', name: 'Lisinopril 10mg', desc: 'Blood Pressure', price: '$8.50' },
  { id: '3', name: 'Atorvastatin 20mg', desc: 'Cholesterol', price: '$15.00' },
  { id: '4', name: 'Metformin 500mg', desc: 'Diabetes', price: '$5.00' },
];

export default function BrowseMedicinesScreen({ navigation }) {
  const [search, setSearch] = useState('');

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
          <Text style={styles.title}>Medicines</Text>
          
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search medicines..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {MEDICINES.map((med) => (
            <View key={med.id} style={styles.medCard}>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDesc}>{med.desc}</Text>
              </View>
              <View style={styles.medAction}>
                <Text style={styles.medPrice}>{med.price}</Text>
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footerContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('CartCheckout')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>View Cart (3 items)</Text>
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
    marginBottom: 20,
    letterSpacing: -0.5},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'},
  searchIcon: {
    fontSize: 16,
    marginRight: 10},
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a'},
  listContainer: {
    flex: 1},
  medCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'},
  medInfo: {
    flex: 1},
  medName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 4},
  medDesc: {
    fontSize: 14,
    color: '#64748b'},
  medAction: {
    alignItems: 'flex-end'},
  medPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#134E4A',
    marginBottom: 8},
  addButton: {
    backgroundColor: '#f1f5f9',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'},
  addButtonText: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '500'},
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

