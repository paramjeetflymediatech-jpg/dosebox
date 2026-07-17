import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { rm, rv, rs, spacing, radius } from '../../utils/responsive';

export default function MenuScreen({ navigation }) {

  const MENU_SECTIONS = [
    {
      title: 'Explore',
      items: [
        { name: 'Categories', icon: 'grid-outline', screen: 'Categories' },
        { name: 'Blogs & Articles', icon: 'document-text-outline', screen: 'Blog' },
        { name: 'News & Updates', icon: 'chatbubble-outline', screen: 'News' },
        { name: 'Testimonials', icon: 'chatbubble-outline', screen: 'Testimonial' },
      ]
    },
    {
      title: 'Support & Help',
      items: [
        { name: 'About Us', icon: 'information-circle-outline', screen: 'About' },
        { name: 'Contact Us', icon: 'call-outline', screen: 'Contact' },
        { name: 'FAQs', icon: 'help-circle-outline', screen: 'FAQ' },
      ]
    },
    {
      title: 'Legal & Policies',
      items: [
        { name: 'Terms of Service', icon: 'document-text-outline', screen: 'Terms' },
        { name: 'Privacy Policy', icon: 'document-text-outline', screen: 'PrivacyPolicy' },
        { name: 'Refund Policy', icon: 'document-text-outline', screen: 'RefundPolicy' },
        { name: 'Cookie Policy', icon: 'document-text-outline', screen: 'CookiePolicy' },
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {MENU_SECTIONS.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, itemIdx) => (
                <TouchableOpacity
                  key={itemIdx}
                  style={[styles.menuItem, itemIdx === section.items.length - 1 && styles.lastMenuItem]}
                  onPress={() => navigation.navigate(item.screen)}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.iconBox}>
                      <Ionicons name={item.icon} size={rs(20)} color="#1F5C52" />
                    </View>
                    <Text style={styles.menuItemText}>{item.name}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={rs(20)} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: rv(16),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  headerTitle: { fontSize: rm(24), fontWeight: '800', color: '#0F172A' },
  content: { padding: spacing.md },
  section: { marginBottom: rv(24) },
  sectionTitle: { fontSize: rm(14), fontWeight: '700', color: '#64748B', marginBottom: rv(12), textTransform: 'uppercase', letterSpacing: 0.5, paddingLeft: spacing.sm },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  lastMenuItem: { borderBottomWidth: 0 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: rs(40),
    height: rs(40),
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  menuItemText: { fontSize: rm(16), fontWeight: '600', color: '#334155' }
});
