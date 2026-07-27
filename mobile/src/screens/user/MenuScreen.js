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
        { name: 'Categories', icon: 'grid', screen: 'Categories', color: '#3b82f6', bgColor: '#eff6ff' },
        { name: 'Blogs & Articles', icon: 'document-text', screen: 'Blog', color: '#8b5cf6', bgColor: '#f5f3ff' },
        { name: 'News & Updates', icon: 'newspaper', screen: 'News', color: '#0ea5e9', bgColor: '#f0f9ff' },
        { name: 'Testimonials', icon: 'chatbubbles', screen: 'Testimonial', color: '#f59e0b', bgColor: '#fffbeb' },
      ]
    },
    {
      title: 'Support & Help',
      items: [
        { name: 'About Us', icon: 'information-circle', screen: 'About', color: '#10b981', bgColor: '#ecfdf5' },
        { name: 'Contact Us', icon: 'call', screen: 'Contact', color: '#ec4899', bgColor: '#fdf2f8' },
        { name: 'FAQs', icon: 'help-circle', screen: 'FAQ', color: '#f43f5e', bgColor: '#fff1f2' },
      ]
    },
    {
      title: 'Legal & Policies',
      items: [
        { name: 'Terms of Service', icon: 'shield-checkmark', screen: 'Terms', color: '#64748b', bgColor: '#f8fafc' },
        { name: 'Privacy Policy', icon: 'lock-closed', screen: 'PrivacyPolicy', color: '#14b8a6', bgColor: '#f0fdfa' },
        { name: 'Refund Policy', icon: 'cash', screen: 'RefundPolicy', color: '#84cc16', bgColor: '#f7fee7' },
        { name: 'Cookie Policy', icon: 'globe', screen: 'CookiePolicy', color: '#6366f1', bgColor: '#eef2ff' },
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
                    <View style={[styles.iconBox, { backgroundColor: item.bgColor || '#F1F5F9' }]}>
                      <Ionicons name={item.icon} size={18} color={item.color || '#1F5C52'} />
                    </View>
                    <Text style={styles.menuItemText}>{item.name}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
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
  section: { marginBottom: rv(16) },
  sectionTitle: { fontSize: rm(14), fontWeight: '700', color: '#64748B', marginBottom: rv(8), textTransform: 'uppercase', letterSpacing: 0.5, paddingLeft: spacing.sm },
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
    paddingHorizontal: spacing.md,
    paddingVertical: rv(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  lastMenuItem: { borderBottomWidth: 0 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: rs(32),
    height: rs(32),
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(10)
  },
  menuItemText: { fontSize: rm(14), fontWeight: '600', color: '#334155' }
});
